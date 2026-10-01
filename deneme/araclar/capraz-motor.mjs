// Çapraz motor ölçümü: node deneme/araclar/capraz-motor.mjs  → deneme/CAPRAZ-MOTOR.json
// Playwright'ın Chromium, Firefox ve WebKit (Windows yapısı; Safari değil) motorlarında her parçanın demo.html'ini açar:
// konsol hatası, kendi içinde determinizm (ileri / ters / karışık sırada piksel), axe-core, reduced-motion ve (rope-swing) fizik durumunun
// motorlar arası bit düzeyinde eşitliği. Motorlar arası piksel benzerliği ffmpeg PSNR ile (aynı boyutlu karelerde).
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { kilitAl } from './kilit.mjs';

const here = dirname(fileURLToPath(import.meta.url)), kok = resolve(here, '../..');
const req = createRequire(import.meta.url);
const pw = req(req.resolve('playwright', { paths: [execFileSync('npm', ['root', '-g'], { encoding: 'utf8', shell: true }).trim()] }));
const axeSrc = readFileSync(req.resolve('axe-core/axe.min.js', { paths: [resolve(kok, 'araclar')] }), 'utf8');
const PARCALAR = ['odometer', 'prompt-terminal', 'rope-swing', 'status-orb', 'katki-isi', 'ilerleme-halkasi'];
const MOTORLAR = ['chromium', 'firefox', 'webkit'];
const ORAN = [0, 0.07, 0.2, 0.42, 0.55, 0.7, 0.85, 1];
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 16);
const sonuc = { olculdu: new Date().toISOString(), not: 'Playwright, Windows, başsız. WebKit burada Playwright\'ın Windows yapısıdır, Safari değildir.', motorlar: {}, parcalar: {} };
const kare = {};                                          // motor → parça → [PNG yolu]

const birak = await kilitAl('capraz-motor.mjs', 1800);
try {
  for (const motor of MOTORLAR) {
    const browser = await pw[motor].launch();
    sonuc.motorlar[motor] = motor + ' ' + browser.version();
    for (const p of PARCALAR) {
      const o = (sonuc.parcalar[p] = sonuc.parcalar[p] || {});
      const r = (o[motor] = {});
      const url = pathToFileURL(join(kok, 'components', p, 'demo.html')).href;
      const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 } });
      const page = await ctx.newPage();
      const hatalar = [];
      page.on('pageerror', (e) => hatalar.push(String(e).slice(0, 160)));
      page.on('console', (m) => m.type() === 'error' && hatalar.push(m.text().slice(0, 160)));
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      await page.evaluate(() => window.inst.pause());
      const D = await page.evaluate(() => window.inst.duration);
      const times = ORAN.map((f) => +(f * D).toFixed(3));
      const stage = page.locator('#stage');
      const grab = async (t) => {
        await page.evaluate((x) => window.inst.seek(x), t);
        const buf = await stage.screenshot();
        const st = await page.evaluate(() => { const s = window.inst.state; return s === undefined ? null : JSON.stringify(s); });
        return { px: sha(buf), buf, st };
      };
      const sira = { ileri: times, ters: [...times].reverse(), karisik: [times[3], times[0], times[7], times[1], times[6], times[2], times[5], times[4]] };
      const h = {};
      for (const [ad, liste] of Object.entries(sira)) { h[ad] = {}; for (const t of liste) h[ad][t] = await grab(t); }
      r.determinizm = {
        zaman_sayisi: times.length,
        piksel_ileri_ters_karisik_esit: times.every((t) => h.ileri[t].px === h.ters[t].px && h.ileri[t].px === h.karisik[t].px),
        durum_ileri_ters_karisik_esit: times.every((t) => h.ileri[t].st === h.ters[t].st && h.ileri[t].st === h.karisik[t].st),
        farkli_kare_sayisi: new Set(times.map((t) => h.ileri[t].px)).size,
      };
      if (p === 'rope-swing' || p === 'status-orb') r.durum_json = times.map((t) => h.ileri[t].st);
      // kareleri motorlar arası PSNR için sakla
      kare[motor] = kare[motor] || {};
      kare[motor][p] = times.map((t, i) => { const f = join(tmpdir(), `capraz-${motor}-${p}-${i}.png`); writeFileSync(f, h.ileri[t].buf); return f; });
      // axe-core (üç kare)
      await page.evaluate(axeSrc);
      const ax = [];
      for (const t of [0, D / 2, D]) { await page.evaluate((x) => window.inst.seek(x), t); const a = await page.evaluate(() => axe.run(document, { resultTypes: ['violations'] })); ax.push({ t: +t.toFixed(2), ihlal: a.violations.length, kurallar: a.violations.map((v) => v.id) }); }
      r.axe = ax;
      r.konsol_hatasi = hatalar;
      await ctx.close();
      // reduced-motion: açılışta son kare, 600 ms sonra değişmiyor
      const c2 = await browser.newContext({ viewport: { width: 900, height: 1100 }, reducedMotion: 'reduce' });
      const p2 = await c2.newPage();
      await p2.goto(url); await p2.evaluate(() => document.fonts.ready); await p2.waitForTimeout(250);
      const a = await p2.evaluate(() => ({ t: +document.getElementById('stage').dataset.t, d: window.inst.duration }));
      await p2.waitForTimeout(600);
      const b = await p2.evaluate(() => ({ t: +document.getElementById('stage').dataset.t, oynuyor: !!window.inst.playing }));
      r.reduced_motion = { son_kare_gosterildi: Math.abs(a.t - a.d) < 0.001, animasyon_yok: a.t === b.t && !b.oynuyor };
      await c2.close();
      console.log(motor, p, JSON.stringify({ det: r.determinizm.piksel_ileri_ters_karisik_esit, axe: ax.map((x) => x.ihlal), hata: hatalar.length, rm: r.reduced_motion.son_kare_gosterildi && r.reduced_motion.animasyon_yok }));
    }
    await browser.close();
  }
  // motorlar arası: rope-swing fizik durumu bit düzeyinde aynı mı; piksel benzerliği (PSNR, aynı boyutta)
  for (const p of PARCALAR) {
    const o = sonuc.parcalar[p], c = o.chromium;
    for (const m of ['firefox', 'webkit']) {
      const x = o[m];
      if (c.durum_json) x.durum_json_chromium_ile_ayni = JSON.stringify(c.durum_json) === JSON.stringify(x.durum_json);
      const psnr = kare.chromium[p].map((f, i) => {
        const r = spawnSync('ffmpeg', ['-i', f, '-i', kare[m][p][i], '-lavfi', 'psnr', '-f', 'null', '-'], { encoding: 'utf8' });
        const mm = /average:([\d.]+|inf)/.exec(r.stderr || '');
        return mm ? (mm[1] === 'inf' ? 'inf' : +(+mm[1]).toFixed(1)) : null;
      });
      x.psnr_chromium_ile_db = psnr;
      if (psnr.every((v) => v === null)) {                 // boyut farklıysa PSNR yok: boyutları yaz
        const dim = (f) => spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout.trim().replace(',', 'x');
        x.kare_boyutu_chromium_ve_motor = [dim(kare.chromium[p][0]), dim(kare[m][p][0])];
      }
    }
    if (c.durum_json) delete c.durum_json;
    for (const m of ['firefox', 'webkit']) if (o[m].durum_json) delete o[m].durum_json;
  }
} finally {
  birak();
}
writeFileSync(join(kok, 'deneme', 'CAPRAZ-MOTOR.json'), JSON.stringify(sonuc, null, 2) + '\n');
