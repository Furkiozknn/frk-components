// 390 px mobil ekran görüntüleri: node araclar/galeri.mjs
// Her parçanın demo.html'ini 390x844 mobil emülasyonunda (Chromium, dokunmatik, 2x) açar, sürenin %60'ına sarar, assets/galeri/<parça>-390.png yazar
// ve kök README.md'deki <!-- galeri:başla --> ... <!-- galeri:bitti --> bloğunu günceller.
// Gerçek telefon görüntüsü DEĞİL: Chromium'un mobil emülasyonudur.
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(import.meta.url);
const { chromium } = req(req.resolve('playwright', { paths: [execSync('npm root -g', { encoding: 'utf8' }).trim()] }));
const dizin = join(kok, 'components'), cikti = join(kok, 'assets', 'galeri');
mkdirSync(cikti, { recursive: true });

// Yalnız tam paketli parçalar (README + RECETE + demo + olcum.json)
const parcalar = readdirSync(dizin).filter((d) => ['README.md', 'RECETE.md', 'demo.html', 'olcum.json'].every((f) => existsSync(join(dizin, d, f)))).sort();
const browser = await chromium.launch();
const sonuc = [];
for (const ad of parcalar) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(join(dizin, ad, 'demo.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const t = await page.evaluate(() => { window.inst.pause(); const t = +(window.inst.duration * 0.6).toFixed(2); window.inst.seek(t); return t; });
  await page.waitForTimeout(150);
  const dosya = join(cikti, ad + '-390.png');
  await page.screenshot({ path: dosya });
  sonuc.push({ ad, t, bayt: statSync(dosya).size });
  await ctx.close();
}
await browser.close();

const adlar = { odometer: 'Odometre / Odometer', 'prompt-terminal': 'Prompt terminal', 'katki-isi': 'Katkı ısısı / Contribution heat', 'rope-swing': 'Kanca ipi / Rope swing', 'status-orb': 'Durum küresi / Status orb', 'kod-diff': 'Kod diff / Code diff', 'ilerleme-halkasi': 'İlerleme halkası / Progress ring' };
const hucre = (r) => `<td align="center" valign="top"><a href="components/${r.ad}/demo.html"><img src="assets/galeri/${r.ad}-390.png" width="180" alt="${adlar[r.ad] || r.ad}, 390 px mobil görünüm"></a><br><sub>${adlar[r.ad] || r.ad}<br>t = ${String(r.t).replace('.', ',')} sn</sub></td>`;
const satirlar = [];
for (let i = 0; i < sonuc.length; i += 4) satirlar.push('<tr>' + sonuc.slice(i, i + 4).map(hucre).join('') + '</tr>');
const blok = `<!-- galeri:başla -->
## Galeri / Gallery (390 px)

**TR** — Her parçanın demo sayfası 390 × 844 px mobil görünümde (Chromium'un mobil emülasyonu, dokunmatik, 2x yoğunluk; **gerçek telefon değil**). Kare, her parçanın süresinin %60'ında alınır. \`node araclar/galeri.mjs\` ile yeniden üretilir.
**EN** — Each part's demo page at 390 × 844 px (Chromium mobile emulation, touch, 2x density; **not a real phone**), captured at 60 % of each part's duration. Regenerate with \`node araclar/galeri.mjs\`.

<table>
${satirlar.join('\n')}
</table>
<!-- galeri:bitti -->`;
const yol = join(kok, 'README.md');
let md = readFileSync(yol, 'utf8');
if (md.includes('<!-- galeri:başla -->')) md = md.replace(/<!-- galeri:başla -->[\s\S]*?<!-- galeri:bitti -->/, blok);
else md = md.replace('## Ölçüm / Measuring', blok + '\n\n## Ölçüm / Measuring');
writeFileSync(yol, md);
console.log(JSON.stringify(sonuc));
