// HyperFrames adımlarını kilitli ve sırayla koşturur: node deneme/kos.mjs <parca|hepsi> <check|snapshot|render|render-en|tumu>
// Başlatıcı: eklentinin plugin-cli.mjs'i (bu makinede npx hyperframes değil). Günlükler deneme/<parca>/log/ altına yazılır.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kilitAl } from './araclar/kilit.mjs';
import { bayatsaDur } from './araclar/bayat.mjs';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const HF = process.env.HYPERFRAMES_CLI || join(homedir(), '.claude/plugins/cache/hyperframes/hyperframes/0.8.85/skills/hyperframes/scripts/plugin-cli.mjs');
const TUM = ['odometer', 'prompt-terminal', 'rope-swing', 'status-orb', 'katki-isi', 'ilerleme-halkasi', 'kod-diff'];
const parcalar = process.argv[2] === 'hepsi' ? TUM : [process.argv[2]];
const adimlar = process.argv[3] === 'tumu' ? ['check', 'snapshot', 'render'] : [process.argv[3]];
bayatsaDur(kok, parcalar);

function hf(parca, args, ad) {
  const cwd = join(kok, 'deneme', parca);
  mkdirSync(join(cwd, 'log'), { recursive: true });
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [HF, ...args], { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  const sn = +((Date.now() - t0) / 1000).toFixed(1);
  writeFileSync(join(cwd, 'log', ad + '.txt'), (r.stdout || '') + (r.stderr || ''));
  return { kod: r.status, sn, cikti: r.stdout || '', hata: r.stderr || '' };
}

const birak = await kilitAl('kos.mjs ' + process.argv.slice(2).join(' '), 1800);
try {
  for (const p of parcalar) {
    for (const a of adimlar) {
      mkdirSync(join(kok, 'deneme', p, 'out'), { recursive: true });
      let r;
      if (a === 'check') {
        r = hf(p, ['check', '--json', '--at', process.env.KOS_CHECK_AT || '0.5,1.5,2.5,3.5,4.5', '--no-browser-gpu'], 'check');
        let ozet = '';
        try { const j = JSON.parse(r.cikti); ozet = JSON.stringify(j.summary || j.ozet || { anahtarlar: Object.keys(j) }); } catch { ozet = r.cikti.slice(-300).replace(/\s+/g, ' '); }
        console.log(`[${p}] check kod=${r.kod} ${r.sn} sn ${ozet.slice(0, 400)}`);
      } else if (a === 'snapshot') {
        r = hf(p, ['snapshot', '.', '--at', process.env.KOS_SNAP_AT || '0.2,1.2,2.5,3.7,4.8', '--no-end', '--describe', 'false', '--no-browser-gpu', '-o', 'snapshots'], 'snapshot');
        console.log(`[${p}] snapshot kod=${r.kod} ${r.sn} sn`);
      } else if (a === 'render' || a === 'render-en') {
        const dil = a === 'render-en' ? 'en' : 'tr';
        r = hf(p, ['render', '.', '--variables-file', `vars-${dil}.json`, '--strict-variables', '--fps', '30', '--workers', '2', '--no-browser-gpu', '--output', `out/${p}-${dil}.mp4`], 'render-' + dil);
        const f = join(kok, 'deneme', p, 'out', `${p}-${dil}.mp4`);
        let mb = null; try { mb = +(statSync(f).size / 1048576).toFixed(2); } catch { /* yok */ }
        console.log(`[${p}] render-${dil} kod=${r.kod} ${r.sn} sn ${mb} MB`);
      } else throw new Error('bilinmeyen adım: ' + a);
      if (r.kod !== 0) console.log(`  son satırlar: ${(r.cikti + r.hata).trim().split('\n').slice(-6).join(' | ').slice(0, 600)}`);
    }
  }
} finally {
  birak();
}
