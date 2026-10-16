// registry.mjs self-test: node araclar/registry-test.mjs
//
// A validator that says "valid" is only worth something if it can also say "invalid".
// So besides checking the seven manifests, this test mutates a valid manifest one rule
// at a time and expects every mutant to be rejected, and feeds it an upstream catalogue
// item to show it is not stricter than HyperFrames itself. Reads only; writes nothing.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEMA, dogrula, kompozisyon, manifest, parcalar } from './registry.mjs';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
let gecti = 0;
let kaldi = 0;
const kontrol = (kosul, ad) => {
  if (kosul) gecti += 1;
  else {
    kaldi += 1;
    console.log(`  ✗ ${ad}`);
  }
};

console.log('— Manifestler —');
const hepsi = parcalar();
kontrol(hepsi.length === 7, `7 parça bekleniyordu, ${hepsi.length} bulundu`);
for (const p of hepsi) {
  const yol = join(kok, 'deneme', p, 'registry-item.json');
  kontrol(existsSync(yol), `${p}: registry-item.json yok`);
  if (!existsSync(yol)) continue;
  const m = JSON.parse(readFileSync(yol, 'utf8'));
  kontrol(dogrula(SEMA, m).length === 0, `${p}: şemaya uymuyor: ${dogrula(SEMA, m).join('; ')}`);
  kontrol(JSON.stringify(m) === JSON.stringify(manifest(p)), `${p}: diskteki manifest üreticinin çıktısıyla aynı değil`);
  // Every listed file must exist where the manifest says, relative to the manifest.
  for (const f of m.files) kontrol(existsSync(join(kok, 'deneme', p, f.path)), `${p}: ${f.path} yok`);
  // The composition must load nothing the manifest leaves out.
  const k = kompozisyon(readFileSync(join(kok, 'deneme', p, 'index.html'), 'utf8'));
  const hedefler = new Set(m.files.map((f) => f.target));
  for (const s of [...k.betikler, ...k.yazitipleri]) kontrol(hedefler.has(`compositions/${s}`), `${p}: kompozisyon ${s} yüklüyor, manifestte yok`);
  kontrol(m.dimensions.width === k.genislik && m.dimensions.height === k.yukseklik && m.duration === k.sure, `${p}: boyut/süre kompozisyonla aynı değil`);
  kontrol(m.files.some((f) => f.target.endsWith('.txt') && f.target.includes('LICENSE')), `${p}: yazı tipi lisansı dosyalarla gitmiyor`);
}

console.log('— Doğrulayıcı: üst akıştan bir katalog öğesi geçmeli —');
// registry/blocks/heatmap/registry-item.json in heygen-com/hyperframes (same commit as the schema).
const heatmap = {
  $schema: 'https://hyperframes.heygen.com/schema/registry-item.json',
  name: 'heatmap', type: 'hyperframes:block', title: 'Heatmap',
  description: 'Thermal colours flow through a glowing orb, on black.',
  tags: ['webgpu', 'heat'], license: 'Apache-2.0 AND MIT',
  dimensions: { width: 1920, height: 1080 }, duration: 2,
  files: [{ path: 'heatmap.html', target: 'compositions/heatmap.html', type: 'hyperframes:composition' }],
  preview: { video: 'https://static.heygen.ai/hyperframes-oss/docs/images/catalog/blocks/heatmap.mp4' },
};
kontrol(dogrula(SEMA, heatmap).length === 0, `üst akış öğesi reddedildi: ${dogrula(SEMA, heatmap).join('; ')}`);
kontrol(dogrula(SEMA, { name: 'x', type: 'hyperframes:component', title: 'X', description: 'x', files: heatmap.files }).length === 0, 'boyutsuz bileşen (component) reddedildi');

console.log('— Doğrulayıcı: her kural tek tek bozulunca yakalanmalı —');
const temel = manifest('odometer');
const mutantlar = {
  'name eksik': (m) => { delete m.name; },
  'name kebab değil': (m) => { m.name = 'Odometer'; },
  'name tire ile bitiyor': (m) => { m.name = 'odometer-'; },
  'type tanımsız': (m) => { m.type = 'block'; },
  'title boş': (m) => { m.title = ''; },
  'description eksik': (m) => { delete m.description; },
  'files boş': (m) => { m.files = []; },
  'file type tanımsız': (m) => { m.files[0].type = 'hyperframes:font'; },
  'file içinde tanımsız alan': (m) => { m.files[0].boyut = 1; },
  'target ..': (m) => { m.files[0].target = 'compositions/../../x.html'; },
  'target mutlak': (m) => { m.files[0].target = '/etc/x.html'; },
  'target sürücü harfi': (m) => { m.files[0].target = 'C:\\x.html'; },
  'file url https değil': (m) => { m.files[0].url = 'http://example.com/x'; },
  'duration 0': (m) => { m.duration = 0; },
  'duration metin': (m) => { m.duration = '5'; },
  'width 0': (m) => { m.dimensions.width = 0; },
  'width kesirli': (m) => { m.dimensions.width = 1080.5; },
  'dimensions içinde tanımsız alan': (m) => { m.dimensions.depth = 1; },
  'block için dimensions eksik': (m) => { delete m.dimensions; },
  'component süre taşıyor': (m) => { m.type = 'hyperframes:component'; },
  'preview içinde tanımsız alan': (m) => { m.preview = { gif: 'x.gif' }; },
  'tags boş metin': (m) => { m.tags = ['']; },
  '$schema URI değil': (m) => { m.$schema = 'registry-item'; },
  'minCliVersion semver değil': (m) => { m.minCliVersion = '1.0'; },
};
let yakalanan = 0;
for (const [ad, boz] of Object.entries(mutantlar)) {
  const m = JSON.parse(JSON.stringify(temel));
  boz(m);
  const ok = dogrula(SEMA, m).length > 0;
  if (ok) yakalanan += 1;
  kontrol(ok, `mutant hayatta kaldı: ${ad}`);
}
console.log(`  ${yakalanan}/${Object.keys(mutantlar).length} mutant yakalandı`);

console.log(`\n${gecti} geçti, ${kaldi} kaldı.`);
process.exit(kaldi ? 1 : 0);
