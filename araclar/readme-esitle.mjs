// README ölçüm satırlarını olcum.json ile eşitler: node araclar/readme-esitle.mjs [parça ...]
// Yalnız YEDEK'in parçaları (varsayılan): odometer, prompt-terminal, katki-isi, kod-diff. Satırlar: JS boyutu, seek maliyeti, canlı kare aralığı, FCP/LCP.
// Eşleşmeyen satır varsa hata verir (sessizce atlamaz). Sonra: node deneme/araclar/belge-denetimi.mjs
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const tr = (x) => String(x).replace('.', ',');
const nokta = (n) => n.toLocaleString('en-US').replace(/,/g, '.');
const virgul = (n) => n.toLocaleString('en-US');
const parcalar = process.argv.slice(2).length ? process.argv.slice(2) : ['odometer', 'prompt-terminal', 'katki-isi', 'kod-diff'];

for (const ad of parcalar) {
  const d = join(kok, 'components', ad);
  const m = JSON.parse(readFileSync(join(d, 'olcum.json'), 'utf8'));
  const js = readdirSync(d).find((f) => f.endsWith('.js'));
  let s = readFileSync(join(d, 'README.md'), 'utf8');
  const p = m.performans, b = m.boyut, f = m.ilk_boyama;
  const degistir = (re, yeni, ad2) => { if (!re.test(s)) throw new Error(ad + ': satır bulunamadı: ' + ad2); s = s.replace(re, yeni); };
  degistir(new RegExp('\\| `' + js.replace(/\./g, '\\.') + '` \\| [\\d.]+ bayt, gzip [\\d.]+ bayt \\(hedef ≤ 51\\.200\\) / [\\d,]+ bytes, gzip [\\d,]+ \\(target ≤ 51,200\\) \\|'),
    '| `' + js + '` | ' + nokta(b.js_bayt) + ' bayt, gzip ' + nokta(b.js_gzip_bayt) + ' bayt (hedef ≤ 51.200) / ' + virgul(b.js_bayt) + ' bytes, gzip ' + virgul(b.js_gzip_bayt) + ' (target ≤ 51,200) |', 'boyut');
  degistir(/ort\. [\d,]+ ms, en çok [\d,]+ ms \(600 çağrı\)/, 'ort. ' + tr(p.seek_ort_ms) + ' ms, en çok ' + tr(p.seek_max_ms) + ' ms (600 çağrı)', 'seek tr');
  degistir(/avg [\d.]+ ms, max [\d.]+ ms \(600 calls\)/, 'avg ' + p.seek_ort_ms + ' ms, max ' + p.seek_max_ms + ' ms (600 calls)', 'seek en');
  degistir(/ort\. [\d,]+ ms, p95 [\d,]+ ms, \d+ kare \(hedef 16,7\) \/ avg [\d.]+ ms, p95 [\d.]+ ms, \d+ frames/,
    'ort. ' + tr(p.kare_araligi_ort_ms) + ' ms, p95 ' + tr(p.kare_araligi_p95_ms) + ' ms, ' + p.canli_kare_sayisi + ' kare (hedef 16,7) / avg ' + p.kare_araligi_ort_ms + ' ms, p95 ' + p.kare_araligi_p95_ms + ' ms, ' + p.canli_kare_sayisi + ' frames', 'kare aralığı');
  degistir(/FCP \d+ ms, LCP \d+ ms \(hedef ≤ 2500\)/, 'FCP ' + f.fcp_ms + ' ms, LCP ' + f.lcp_ms + ' ms (hedef ≤ 2500)', 'fcp/lcp');
  writeFileSync(join(d, 'README.md'), s);
  console.log(ad + ': eşitlendi (' + b.js_bayt + ' bayt, seek ' + p.seek_ort_ms + ' ms, FCP ' + f.fcp_ms + ' / LCP ' + f.lcp_ms + ')');
}
