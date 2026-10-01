// Seek determinizmi kanıtı: node deneme/kanit.mjs [parca ...]
// A) Kompozisyonu düz Chromium'da aç; HyperFrames'in yaptığı gibi tl.totalTime(t, false) ile aynı t'lere ileri / ters / karışık sırada git,
//    kök öğenin ekran görüntülerini (SHA-256) karşılaştır.
// B) HyperFrames snapshot karesi ↔ aynı t'nin düz Chromium karesi (bayt eşitliği ve ortalama mutlak fark).
// C) Aynı kompozisyonu --workers 2 ve --workers 1 ile iki kez render et; çözülmüş karelerin MD5'lerini karşılaştır.
// Çıktı: deneme/KANIT.json. Sayılar yalnız bu koşudan gelir.
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { kilitAl } from './araclar/kilit.mjs';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(import.meta.url);
const { chromium } = req(req.resolve('playwright', { paths: [execFileSync('npm', ['root', '-g'], { encoding: 'utf8', shell: true }).trim()] }));
const HF = join(homedir(), '.claude/plugins/cache/hyperframes/hyperframes/0.8.85/skills/hyperframes/scripts/plugin-cli.mjs');
const TUM = ['odometer', 'prompt-terminal', 'rope-swing', 'status-orb', 'katki-isi'];
const parcalar = process.argv.slice(2).length ? process.argv.slice(2) : TUM;
const TIMES = [0, 0.4, 1.2, 2.5, 3.3, 4.1, 4.8];       // saniye; SURE = 5
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 16);
const onceki = existsSync(join(kok, 'deneme', 'KANIT.json')) ? JSON.parse(readFileSync(join(kok, 'deneme', 'KANIT.json'), 'utf8')) : null;
const sonuc = { olculdu: new Date().toISOString(), sure_sn: 5, fps: 30, zamanlar: TIMES, parcalar: onceki ? onceki.parcalar : {} };

function render(p, workers, cikti) {
  const cwd = join(kok, 'deneme', p);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [HF, 'render', '.', '--variables-file', 'vars-tr.json', '--strict-variables', '--fps', '30', '--workers', String(workers), '--no-browser-gpu', '--output', cikti], { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  return { kod: r.status, sn: +((Date.now() - t0) / 1000).toFixed(1) };
}
function kareMd5(dosya) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', dosya, '-f', 'framemd5', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.stdout.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split(',').pop().trim());
}

const birak = await kilitAl('kanit.mjs ' + parcalar.join(','), 1800);
const browser = await chromium.launch();
try {
  for (const p of parcalar) {
    const d = join(kok, 'deneme', p);
    const html = readFileSync(join(d, 'index.html'), 'utf8');
    const w = +/data-width="(\d+)"/.exec(html)[1], h = +/data-height="(\d+)"/.exec(html)[1], id = /data-composition-id="([^"]+)"/.exec(html)[1];
    const o = { tuval: `${w}x${h}` };

    // A) düz Chromium'da totalTime(t, false) ile üç sıra
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(String(e)));
    await page.goto(pathToFileURL(join(d, 'index.html')).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction((k) => !!(window.__timelines && window.__timelines[k]), id, { timeout: 15000, polling: 100 });
    await page.waitForTimeout(300);
    const grab = async (t) => { await page.evaluate(([k, x]) => { window.__timelines[k].totalTime(x, false); }, [id, t]); return sha(await page.locator('#root').screenshot()); };
    const sirala = { ileri: TIMES, ters: [...TIMES].reverse(), karisik: [TIMES[3], TIMES[0], TIMES[6], TIMES[1], TIMES[5], TIMES[2], TIMES[4]] };
    const hash = {};
    for (const [ad, liste] of Object.entries(sirala)) { hash[ad] = {}; for (const t of liste) hash[ad][t] = await grab(t); }
    o.A_duz_chromium = {
      ileri_ters_esit: TIMES.every((t) => hash.ileri[t] === hash.ters[t]),
      ileri_karisik_esit: TIMES.every((t) => hash.ileri[t] === hash.karisik[t]),
      ayni_t_tekrar_esit: (await grab(TIMES[3])) === hash.ileri[TIMES[3]],
      farkli_kare_sayisi: new Set(TIMES.map((t) => hash.ileri[t])).size, zaman_sayisi: TIMES.length,
      sayfa_hatalari: hatalar,
    };

    // A2) ileri ↔ ters sıra farklı çıkan zamanlar için: gerçekten kaç dB fark var (ffmpeg psnr)
    const farkli = TIMES.filter((t) => hash.ileri[t] !== hash.ters[t]);
    if (farkli.length) {
      o.A2_farkli_zamanlar = {};
      for (const t of farkli) {
        const i = TIMES.indexOf(t), once = TIMES[Math.max(0, i - 1)], sonra = TIMES[Math.min(TIMES.length - 1, i + 1)];
        const via = async (x) => { await grab(x); await page.evaluate(([k, y]) => { window.__timelines[k].totalTime(y, false); }, [id, t]); return page.locator('#root').screenshot(); };
        const f1 = join(tmpdir(), `kanit-${p}-a.png`), f2 = join(tmpdir(), `kanit-${p}-b.png`);
        writeFileSync(f1, await via(once)); writeFileSync(f2, await via(sonra));
        const r = spawnSync('ffmpeg', ['-i', f1, '-i', f2, '-lavfi', 'psnr', '-f', 'null', '-'], { encoding: 'utf8' });
        const m = /average:([\d.]+|inf)/.exec(r.stderr || '');
        o.A2_farkli_zamanlar[t] = { onceki_t_ileri: once, onceki_t_ters: sonra, psnr_db: m ? (m[1] === 'inf' ? null : +m[1]) : null };
      }
    }

    // B) HyperFrames snapshot karesi ↔ düz Chromium karesi (snapshots/ içinde 0.2, 1.2, 2.5, 3.7, 4.8 sn)
    const snap = { '1.2': 'frame-01-at-1.2s.png', '2.5': 'frame-02-at-2.5s.png', '4.8': 'frame-04-at-4.8s.png' };
    o.B_snapshot_ile_karsilastirma = {};
    for (const [t, dosya] of Object.entries(snap)) {
      await page.evaluate(([k, x]) => { window.__timelines[k].totalTime(x, false); }, [id, +t]);
      const dz = await page.locator('#root').screenshot();
      const hfpng = readFileSync(join(d, 'snapshots', dosya));
      o.B_snapshot_ile_karsilastirma[t] = { bayt_esit: sha(dz) === sha(hfpng), boyut_duz: dz.length, boyut_hf: hfpng.length };
    }
    await ctx.close();

    // C) iki işçi sayısıyla iki render: çözülmüş karelerin MD5'i
    mkdirSync(join(d, 'out'), { recursive: true });
    const r2 = render(p, 2, 'out/' + p + '-tr-w2.mp4');
    const r1 = render(p, 1, 'out/' + p + '-tr-w1.mp4');
    const m2 = kareMd5(join(d, 'out', p + '-tr-w2.mp4')), m1 = kareMd5(join(d, 'out', p + '-tr-w1.mp4'));
    o.C_iki_render = { isci2: r2, isci1: r1, kare_sayisi: [m2.length, m1.length], ayni_kare_sayisi: m2.filter((x, i) => x === m1[i]).length };
    sonuc.parcalar[p] = o;
    console.log(p, JSON.stringify({ A: o.A_duz_chromium, B: o.B_snapshot_ile_karsilastirma, C: o.C_iki_render }));
  }
} finally {
  await browser.close();
  birak();
}
writeFileSync(join(kok, 'deneme', 'KANIT.json'), JSON.stringify(sonuc, null, 2) + '\n');
