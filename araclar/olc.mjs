// Ölçüm betiği: node araclar/olc.mjs components/odometer/demo.html
// Playwright global kurulumdan alınır (npm root -g); axe-core araclar/node_modules'tan.
// Çıktı: demo.html'in yanına olcum.json. Ölçülemeyen alan null kalır.
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);
const gRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const { chromium } = req(req.resolve('playwright', { paths: [gRoot] }));
const axeSrc = readFileSync(req.resolve('axe-core/axe.min.js', { paths: [here] }), 'utf8');

const demo = resolve(process.argv[2] || 'components/odometer/demo.html');
const dir = dirname(demo);
const jsFile = join(dir, readdirSync(dir).find((f) => f.endsWith('.js')));
const url = pathToFileURL(demo).href;
const out = { olculdu: new Date().toISOString(), hedef: demo.replace(/\\/g, '/') };

// 1) Boyut
const js = readFileSync(jsFile);
const name = /FRKComponents\.(\w+)\s*=/.exec(js.toString('utf8'))[1];   // örn. odometer, promptTerminal
out.bilesen = name;
out.boyut = { js_bayt: js.length, js_gzip_bayt: gzipSync(js, { level: 9 }).length, demo_html_bayt: statSync(demo).size, hedef_bayt: 51200 };

// 1b) Kaynak taraması: render mantığında yasak saat/rastgelelik çağrısı var mı
out.yasak_cagri_taramasi = Object.fromEntries(['Math.random', 'Date.now', 'performance.now', 'new Date'].map((k) => [k, js.toString('utf8').includes(k)]));

const browser = await chromium.launch();
out.tarayici = 'Chromium ' + browser.version();
const open = async (ctxOpts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 }, ...ctxOpts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errors };
};

// 2) İlk boyama (soğuk açılış)
{
  const { ctx, page } = await open();
  out.ilk_boyama = await page.evaluate(() => new Promise((res) => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    let lcp = null;
    new PerformanceObserver((l) => { const e = l.getEntries(); lcp = e[e.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(() => res({ fcp_ms: fcp ? +fcp.startTime.toFixed(1) : null, lcp_ms: lcp == null ? null : +lcp.toFixed(1), hedef_lcp_ms: 2500 }), 300);
  }));
  await ctx.close();
}

// 3) Determinizm
{
  const { ctx, page, errors } = await open();
  await page.evaluate(() => window.inst.pause());
  const times = [0, 0.37, 1.0, 1.234, 1.9, 2.4, 3.0];
  const dom = () => page.evaluate(() => { const st = document.getElementById('stage'); return st.innerHTML + Array.from(st.querySelectorAll('canvas')).map((c) => c.toDataURL()).join(''); });
  const seek = (t) => page.evaluate((x) => window.inst.seek(x), t);
  const ileri = {};
  for (const t of times) { await seek(t); ileri[t] = await dom(); }
  const geri = {};
  for (const t of [...times].reverse()) { await seek(t); geri[t] = await dom(); }
  const karisik = {};
  for (const t of [1.234, 0.37, 3.0, 0, 1.9, 1.0, 2.4]) { await seek(t); karisik[t] = await dom(); }
  const dom_esit = times.every((t) => ileri[t] === geri[t] && ileri[t] === karisik[t]);

  // Piksel: aynı t, farklı önceki durumlardan gelinerek (başa, ortaya, süre sonrasına atlayıp) ekran görüntüsü aynı mı?
  // Raster önbelleği sıraya bağlı olabilir; son faz (oturma darbesi, geç dolan hücreler) dahil.
  const stage = page.locator('#stage');
  const dur = await page.evaluate(() => window.inst.duration);
  const pix = [], pixFark = [];
  for (const t of [0, 0.6, 1.0, 1.7, dur * 0.9, dur * 0.95, dur]) {
    const hs = [];
    for (const prev of [0.1, dur * 0.5, dur + 0.5, dur * 0.97]) { await seek(prev); await seek(t); hs.push(createHash('sha256').update(await stage.screenshot()).digest('hex')); }
    const esit = hs.every((h) => h === hs[0]);
    pix.push(esit); if (!esit) pixFark.push(+t.toFixed(3));
  }
  // Tohum: aynı tohum aynı kare, farklı tohum (orta zamanda) farklı kare
  const seedDom = await page.evaluate((nm) => {
    const mk = (seed) => { const d = document.createElement('div'); d.style.cssText = 'width:560px;height:560px;position:absolute;left:-9999px'; document.body.appendChild(d);
      const i = FRKComponents[nm].mount(d, { seed, value: 167829 }); i.seek(1.2); const h = d.innerHTML + Array.from(d.querySelectorAll('canvas')).map((c) => c.toDataURL()).join(''); i.destroy(); d.remove(); return h; };
    return { ayniTohum: mk(7) === mk(7), farkliTohum: mk(7) !== mk(8) };
  }, name);
  out.determinizm = {
    zamanlar: times, dom_ileri_geri_karisik_esit: dom_esit,
    piksel_ayni_t_iki_cizim_esit: pix, piksel_farkli_olan_t: pixFark, tohum_ayni_ayni: seedDom.ayniTohum, tohum_farkli_farkli: seedDom.farkliTohum,
  };
  out.konsol_hatasi = errors;
  await ctx.close();
}

// 4) Son değer doğruluğu: son karede görünen hane dizisi = aria-label
if (name === 'odometer') {
  const { ctx, page } = await open();
  out.deger_dogrulugu = await page.evaluate(() => {
    const read = (d) => Array.from(d.querySelectorAll('.frk-odo-row > *')).map((n) => {
      if (n.classList.contains('frk-odo-sep')) return n.textContent;
      const m = /translate3d\(0px?,\s*(-?[\d.]+)em/.exec(n.firstChild.style.transform); return String(Math.round(Math.abs(m ? +m[1] : 0) / 1.1)); }).join('');
    const cases = [[0, 'tr'], [7, 'tr'], [10, 'en'], [167829, 'tr'], [167829, 'en'], [999999, 'tr'], [1234567, 'en'], [-5.5, 'tr', 1], [1234.56, 'en', 2], [0.05, 'tr', 2]];
    return cases.map(([v, loc, dec]) => {
      const d = document.createElement('div'); d.style.cssText = 'width:560px;height:560px;position:absolute;left:-9999px'; document.body.appendChild(d);
      const i = FRKComponents.odometer.mount(d, { value: v, locale: loc, decimals: dec || 0 }); i.seek(i.duration);
      const r = { deger: v, locale: loc, ondalik: dec || 0, beklenen: d.getAttribute('aria-label'), gorunen: read(d) }; r.dogru = r.beklenen === r.gorunen; r.son_kare_olcek_1 = parseFloat(d.querySelector('.frk-odo-row').style.fontSize) === 100;
      i.destroy(); d.remove(); return r; });
  });
  await ctx.close();
}

if (name === 'promptTerminal') {
  // Son kare: görünen satırlar senaryonun tamamı; duration ölçeği çalışıyor
  const { ctx, page } = await open();
  out.son_kare_metni = await page.evaluate(() => {
    const kos = (loc, extra) => { const d = document.createElement('div'); d.style.cssText = 'width:560px;height:560px;position:absolute;left:-9999px'; document.body.appendChild(d);
      const i = FRKComponents.promptTerminal.mount(d, Object.assign({ locale: loc }, extra)); i.seek(i.duration);
      const rows = Array.from(d.querySelectorAll('.frk-pt-l')).map((r) => r.textContent.replace(/^(› |• )/, '')).join('. ');
      const beklenen = d.getAttribute('aria-label').replace(/^› /, '').replace(/\. › /g, '. ');
      const r = { locale: loc, sure_sn: +i.duration.toFixed(3), dogru: rows === beklenen, satir_sayisi: d.querySelectorAll('.frk-pt-l').length };
      i.destroy(); d.remove(); return r; };
    const ozel = [{ k: 'cmd', text: 'özel komut: uzun bir satırla birlikte' }, { k: 'think', text: 'Düşünüyor…', done: 'Düşünüldü', dur: 0.6 }]
      .concat(Array.from({ length: 12 }, (_, n) => ({ k: 'out', text: n === 5 ? 'çok uzun satır '.repeat(8).trim() : 'satır ' + (n + 1), dim: n % 2 === 1 })), [{ k: 'out', text: 'son satır', accent: true }]);
    const d = document.createElement('div'); d.style.cssText = 'width:560px;height:560px;position:absolute;left:-9999px'; document.body.appendChild(d);
    const i = FRKComponents.promptTerminal.mount(d, { script: ozel }); i.seek(i.duration);
    const rows = Array.from(d.querySelectorAll('.frk-pt-l')); const last = rows[rows.length - 1].getBoundingClientRect(), box = d.getBoundingClientRect();
    const ozelSonuc = { adim_sayisi: ozel.length, satir_sayisi: rows.length, son_satir_metni: rows[rows.length - 1].textContent, son_satir_kutu_icinde: last.bottom <= box.bottom + 0.5 && last.top >= box.top, sure_sn: +i.duration.toFixed(3) };
    i.destroy(); d.remove();
    return { varsayilan: [kos('tr'), kos('en'), Object.assign(kos('tr', { duration: 5 }), { istenen_sure_sn: 5 })], ozel_script: ozelSonuc };
  });
  await ctx.close();
}

if (name === 'katkiIsi') {
  // Örnek veri etiketi: veri verilmezse etiketli, verilirse etiketsiz; son karede sayaç toplamı
  const { ctx, page } = await open();
  out.ornek_veri_etiketi = await page.evaluate(() => {
    const kos = (o) => { const d = document.createElement('div'); d.style.cssText = 'width:560px;height:560px;position:absolute;left:-9999px'; document.body.appendChild(d);
      const i = FRKComponents.katkiIsi.mount(d, o); const r = { etiket: d.getAttribute('aria-label'), toplam: i.total }; i.destroy(); d.remove(); return r; };
    const tr = kos({ locale: 'tr' }), en = kos({ locale: 'en' }), veri = kos({ data: [1, 2, 3, 0, 4, 5, 6], weeks: 1 });
    return { tr_baslangic_ornek: tr.etiket.startsWith('Örnek veri'), en_baslangic_sample: en.etiket.startsWith('Sample data'), veri_verilince_etiket_yok: !/Örnek veri|Sample data/.test(veri.etiket), verilen_veri_toplami: veri.toplam, beklenen_toplam: 21 };
  });
  await ctx.close();
}

if (name === 'kodDiff') {
  // Son kare sayaçları; apply modunda silinen satır çöker ve piksel sıraya bağlı olmamalı
  const { ctx, page } = await open();
  await page.evaluate(() => window.inst.pause());
  const son = await page.evaluate(() => { const i = window.inst; i.seek(i.duration); const st = document.getElementById('stage');
    return { satir_sayisi: st.querySelectorAll('.frk-kd-r').length, sayac_metni: st.querySelector('.frk-kd-bar b').textContent.trim(), aria_label: st.getAttribute('aria-label').slice(0, 60) }; });
  await page.evaluate(() => { window.inst.destroy(); window.inst = FRKComponents.kodDiff.mount(document.getElementById('stage'), { mode: 'apply', seed: 1, locale: 'tr' }); window.inst.pause(); });
  const stg = page.locator('#stage'), dur = await page.evaluate(() => window.inst.duration), farkli = [];
  const gec = (x) => page.evaluate((v) => window.inst.seek(v), x);
  for (const t of [0, 1.0, 1.7, 2.6, 3.4, dur * 0.9, dur]) {
    const hs = [];
    for (const prev of [0.1, dur * 0.5, dur + 0.5, dur * 0.97]) { await gec(prev); await gec(t); hs.push(createHash('sha256').update(await stg.screenshot()).digest('hex')); }
    if (new Set(hs).size > 1) farkli.push(+t.toFixed(3));
  }
  const cokenSatir = await page.evaluate(() => { window.inst.seek(window.inst.duration); return Array.from(document.querySelectorAll('.frk-kd-r')).filter((r) => r.getBoundingClientRect().height < 0.5).length; });
  const ozel = await page.evaluate(() => {
    const d = document.createElement('div'); d.style.cssText = 'width:560px;height:560px;position:absolute;left:-9999px'; document.body.appendChild(d);
    const diff = [{ k: 'ctx', text: 'a' }, { k: 'del', text: 'x' }, { k: 'add', text: 'y '.repeat(60).trim() }, { k: 'add', text: '' }, { k: 'ctx', text: 'b' }];
    const i = FRKComponents.kodDiff.mount(d, { diff, title: 'ozel.js', locale: 'en' }); const sure = i.duration; i.seek(i.duration);
    const kutu = d.getBoundingClientRect(), satirlar = Array.from(d.querySelectorAll('.frk-kd-r')), uzun = satirlar[2].querySelector('.frk-kd-c');
    const r = { satir_sayisi: satirlar.length, sayac: d.querySelector('.frk-kd-bar b').textContent.trim(), baslik: d.querySelector('.frk-kd-bar span').textContent,
      aria_basi: d.getAttribute('aria-label').slice(0, 44), uzun_satir_kesildi: uzun.scrollWidth > uzun.clientWidth, satirlar_kutu_icinde: satirlar.every((x) => x.getBoundingClientRect().right <= kutu.right + 0.5), sure_sn: +sure.toFixed(3) };
    i.destroy(); d.remove(); return r;
  });
  out.kod_diff = { ozel_diff: ozel, varsayilan_mod_son_kare: son, apply_modu: { piksel_farkli_olan_t: farkli, son_karede_cokmus_satir: cokenSatir, sure_sn: +dur.toFixed(3) } };
  await ctx.close();
}

// 5) Kare maliyeti: seek süresi + canlı oynatmada rAF aralıkları
{
  const { ctx, page } = await open();
  out.performans = await page.evaluate(async () => {
    const inst = window.inst; inst.pause();
    const N = 600, ts = []; // bu ölçüm betiğidir, bileşen kodu değil
    for (let i = 0; i < N; i++) { const t0 = performance.now(); inst.seek((i / N) * 2.4); ts.push(performance.now() - t0); }
    const seekMs = ts.reduce((a, b) => a + b, 0) / N;
    inst.seek(0);
    const gaps = []; let last = 0, frames = 0;
    await new Promise((res) => {
      const onTick = () => { const n = performance.now(); if (last) gaps.push(n - last); last = n; frames++; };
      document.getElementById('stage').addEventListener('frk:tick', onTick);
      document.getElementById('stage').addEventListener('frk:end', () => { document.getElementById('stage').removeEventListener('frk:tick', onTick); res(); }, { once: true });
      inst.play();
    });
    gaps.sort((a, b) => a - b);
    const ort = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    return { seek_ort_ms: +seekMs.toFixed(3), seek_max_ms: +Math.max(...ts).toFixed(3), canli_kare_sayisi: frames,
      kare_araligi_ort_ms: +ort.toFixed(2), kare_araligi_p95_ms: +gaps[Math.floor(gaps.length * 0.95)].toFixed(2), hedef_kare_ms: 16.7,
      not: 'Başsız Chromium, bu makine, masaüstü. Telefon ölçülmedi.' };
  });
  await ctx.close();
}

// 6) axe-core
{
  const { ctx, page } = await open();
  await page.evaluate(() => window.inst.pause());
  await page.evaluate(axeSrc);
  const sonuc = [];
  for (const t of [0, 1.2, 2.4]) {
    await page.evaluate((x) => window.inst.seek(x), t);
    const r = await page.evaluate(() => axe.run(document, { resultTypes: ['violations'] }));
    sonuc.push({ t, ihlal: r.violations.length, kurallar: r.violations.map((v) => v.id) });
  }
  out.erisilebilirlik = { arac: 'axe-core 4.13.0', taramalar: sonuc };
  await ctx.close();
}

// 7) Klavye
{
  const { ctx, page } = await open();
  const t = () => page.evaluate(() => +document.getElementById('stage').dataset.t);
  const durum = () => page.evaluate(() => document.getElementById('play').textContent);
  const odak = [];
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); odak.push(await page.evaluate(() => document.activeElement.id || document.activeElement.tagName)); }
  await page.focus('#play'); const once = await durum();                 // açılışta oynuyor: "Duraklat"
  await page.keyboard.press('Enter'); const enterSonra = await durum();   // duraklatır: "Oynat"
  const t1 = await t(); await page.waitForTimeout(200); const enterDurdu = (await t()) === t1;
  await page.keyboard.press('Space'); const spaceSonra = await durum();   // düğme odakta: Space da tıklar: "Duraklat"
  // gövdede Space: odak düğmeden çıkınca belge kısayolu çalışır
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Space'); const govdeSpace = await durum();   // "Oynat" (duraklatıldı)
  const t2 = await t(); await page.waitForTimeout(200); const govdeDurdu = (await t()) === t2;
  await page.keyboard.press('r'); await page.waitForTimeout(200); const rOynuyor = (await t()) > 0 && (await durum()) === 'Duraklat';
  await page.focus('#t'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  const slider = await t(); const kaydiriciDurdurdu = (await durum()) !== 'Duraklat';
  out.klavye = { tab_sirasi: odak, oynat_enter: [once, enterSonra, enterDurdu], oynat_space_dugmede: spaceSonra,
    govdede_space: [govdeSpace, govdeDurdu], r_bastan_oynatir: rOynuyor, kaydirici_oklari_t: slider, kaydirici_oynatmayi_durdurur: kaydiriciDurdurdu };
  await ctx.close();
}

// 8) reduced-motion
{
  const { ctx, page } = await open({ reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  const a = await page.evaluate(() => ({ t: +document.getElementById('stage').dataset.t, dur: window.inst.duration }));
  await page.waitForTimeout(600);
  const b = await page.evaluate(() => +document.getElementById('stage').dataset.t);
  out.reduced_motion = { t_150ms: a.t, t_750ms: b, son_kare_gosterildi: Math.abs(a.t - a.dur) < 0.0015, animasyon_yok: a.t === b };
  await ctx.close();
}
const { ctx: c2, page: p2 } = await open({ reducedMotion: 'no-preference' });
await p2.waitForTimeout(400);
out.reduced_motion.normalde_oynuyor = await p2.evaluate(() => { const t = +document.getElementById('stage').dataset.t; return t > 0 && t < window.inst.duration; });
await c2.close();

// 9) 390 px mobil görünüm: Chromium'un mobil emülasyonu (dokunmatik, 2x yoğunluk); gerçek telefon DEĞİL
{
  const { ctx, page } = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await page.evaluate(axeSrc);
  const g = await page.evaluate(() => {
    const st = document.getElementById('stage').getBoundingClientRect();
    const hedef = Array.from(document.querySelectorAll('button,input,select,a')).map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0).map((r) => Math.min(r.width, r.height));
    return { tasma_yok: document.documentElement.scrollWidth <= window.innerWidth, sahne_genislik_px: Math.round(st.width), dokunma_hedefi_min_px: Math.floor(Math.min(...hedef)) };
  });
  const ax = await page.evaluate(() => axe.run(document, { resultTypes: ['violations'] }));
  out.mobil_390 = { ...g, axe_ihlal: ax.violations.length, not: 'Chromium mobil emülasyonu; gerçek telefon ölçülmedi' };
  await ctx.close();
}

await browser.close();
const hedef = join(dir, 'olcum.json');
writeFileSync(hedef, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
