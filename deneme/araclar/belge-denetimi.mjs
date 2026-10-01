// Belge ↔ ölçüm kapısı: node deneme/araclar/belge-denetimi.mjs
// Her parçanın README.md'sindeki ölçüm sayıları (bayt, gzip, demo boyutu, FCP/LCP) olcum.json'daki değerlerle aynı mı?
// Eşleşmeyen sayı çıkış kodu 1 ile bildirilir. Yalnız okur; dosya yazmaz.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const bin = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');   // TR binlik: 15.605
const parcalar = readdirSync(join(kok, 'components')).filter((p) => existsSync(join(kok, 'components', p, 'olcum.json')) && existsSync(join(kok, 'components', p, 'README.md')));
let sorun = 0;
for (const p of parcalar) {
  const o = JSON.parse(readFileSync(join(kok, 'components', p, 'olcum.json'), 'utf8'));
  const r = readFileSync(join(kok, 'components', p, 'README.md'), 'utf8');
  const beklenen = [];
  if (o.boyut) {
    beklenen.push([`${bin(o.boyut.js_bayt)} bayt`, 'JS boyutu']);
    beklenen.push([`gzip ${bin(o.boyut.js_gzip_bayt)}`, 'gzip boyutu']);
    if (o.boyut.demo_html_bayt) beklenen.push([`${bin(o.boyut.demo_html_bayt)} bayt`, 'demo.html boyutu']);
  }
  if (o.ilk_boyama && o.ilk_boyama.fcp_ms != null) {
    beklenen.push([`FCP ${Math.round(o.ilk_boyama.fcp_ms)} ms`, 'FCP']);
    beklenen.push([`LCP ${Math.round(o.ilk_boyama.lcp_ms)} ms`, 'LCP']);
  }
  const eksik = beklenen.filter(([metin]) => !r.includes(metin));
  console.log(`${p.padEnd(18)} ${beklenen.length - eksik.length}/${beklenen.length} sayı README'de olcum.json ile aynı`);
  for (const [metin, ad] of eksik) { console.log(`   ✗ ${ad}: README'de "${metin}" yok`); sorun++; }
}
process.exit(sorun ? 1 : 0);
