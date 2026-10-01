// Gözle kontrol: node deneme/araclar/goz.mjs <demo.html> <cikti-klasoru> t1,t2,... [genislik]
// Demo'yu açar, her t için #stage'in ekran görüntüsünü PNG olarak yazar. Başsız Chromium, tek örnek, kilitli.
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { kilitAl } from './kilit.mjs';

const req = createRequire(import.meta.url);
const { chromium } = req(req.resolve('playwright', { paths: [execSync('npm root -g', { encoding: 'utf8' }).trim()] }));
const demo = resolve(process.argv[2]), out = resolve(process.argv[3]);
const times = (process.argv[4] || '0,1,2,3,4,5').split(',').map(Number);
const width = +(process.argv[5] || 800);
mkdirSync(out, { recursive: true });

const birak = await kilitAl('goz.mjs ' + demo);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(pathToFileURL(demo).href);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.inst.pause());
  for (const t of times) {
    await page.evaluate((x) => window.inst.seek(x), t);
    await page.locator('#stage').screenshot({ path: join(out, `t${String(t).replace('.', '_')}.png`) });
  }
  console.log('hatalar:', JSON.stringify(errors));
} finally {
  await browser.close();
  birak();
}
