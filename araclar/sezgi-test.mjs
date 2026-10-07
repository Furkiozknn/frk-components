// SEZGİ testi: status-orb'un "konuşuyor" ve "onay bekliyor" durumları + seslendir.mjs. Bir şey tutmuyorsa çıkış kodu 1.
//   node araclar/sezgi-test.mjs        (depo kökünden; Playwright global kurulumdan, axe-core araclar/node_modules'tan)
// Çıktı: components/status-orb/olcum-sezgi.json. Ölçülemeyen alan null kalır; eşikler koşudan ÖNCE yazıldı, sayıya bakıp ayarlanmadı.
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { yaklasikKelimeler, zarfCikar } from './seslendir.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..');
const dir = join(root, 'components/status-orb'), url = pathToFileURL(join(dir, 'sezgi.html')).href;
const req = createRequire(import.meta.url);
const { chromium } = req(req.resolve('playwright', { paths: [execSync('npm root -g', { encoding: 'utf8' }).trim()] }));
const axeSrc = readFileSync(req.resolve('axe-core/axe.min.js', { paths: [here] }), 'utf8');
const sp = { tr: JSON.parse(readFileSync(join(dir, 'konusma/tr.speech.json'), 'utf8')), en: JSON.parse(readFileSync(join(dir, 'konusma/en.speech.json'), 'utf8')) };
const out = { olculdu: new Date().toISOString(), kontroller: {} }, fail = [];
const check = (ad, ok, kanit) => { out.kontroller[ad] = { gecti: !!ok, kanit }; if (!ok) fail.push(ad); };
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

// 1) seslendir.mjs saf işlevleri
{
  const SR = 16000, x = new Float32Array(SR * 3);                      // 0,5 sn sessiz, 1 sn ton, 1,5 sn sessiz
  for (let i = SR / 2; i < SR * 1.5; i++) x[i] = 0.5 * Math.sin((2 * Math.PI * 220 * i) / SR);
  const { zarf } = zarfCikar(x, 30), ort = (a, b) => zarf.slice(a, b).reduce((s, v) => s + v, 0) / (b - a);
  // Bırakma 0,2/kare: ton 45. karede biter, 20 kare sonra (0,8^20 ≈ 0,01) zarf sessizliğe inmiş olmalı; arada yumuşak iner (ilk taslakta pencere erken seçilmişti: 53–60. kare).
  const iner = zarf[46] > zarf[50] && zarf[50] > zarf[56] && zarf[56] > zarf[64];
  check('zarf_sessiz_ton', ort(2, 12) < 0.02 && ort(20, 40) > 0.9 && ort(70, 90) < 0.02 && iner, { sessiz_bas: +ort(2, 12).toFixed(3), ton: +ort(20, 40).toFixed(3), sessiz_son_70_90: +ort(70, 90).toFixed(3), yumusak_iniyor: iner });
  const a = zarfCikar(x, 30), b = zarfCikar(x, 30);
  check('zarf_deterministik', sha(JSON.stringify(a)) === sha(JSON.stringify(b)), 'aynı girdi iki kez aynı JSON');
  const gercek = sp.tr.kelimeler, yak = yaklasikKelimeler(sp.tr.metin, sp.tr.zarf, sp.tr.fps);
  const hata = gercek.map((g, i) => Math.abs(g.baslangic_sn - yak[i].baslangic_sn)), ort_h = hata.reduce((s, v) => s + v, 0) / hata.length;
  check('yaklasik_kelime_sayisi', yak.length === gercek.length, { yaklasik: yak.length, motor: gercek.length });
  out.yaklasik_kelime_hatasi = { not: 'edge-tts kelime zamanı referans; tek TR cümle (9 kelime), genel doğruluk DEĞİL', ort_mutlak_sapma_sn: +ort_h.toFixed(3), en_buyuk_sn: +Math.max(...hata).toFixed(3) };
  check('yaklasik_kelime_makul', ort_h < 0.6, 'ortalama başlangıç sapması ' + ort_h.toFixed(3) + ' sn (<0,6 sağlık eşiği; "doğru" demek değildir)');
}

const browser = await chromium.launch();
out.tarayici = 'Chromium ' + browser.version();
const open = async (o = {}, u = url) => {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 }, ...o }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(u); await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errors };
};
const canvas = (page) => page.evaluate(() => document.querySelector('#stage canvas').toDataURL());

// 2) Determinizm (TR ve EN): ileri / geri / karışık sıra, kelime uçuş anları dahil; farklı önceki durumlardan aynı ekran görüntüsü
{
  const { ctx, page, errors } = await open();
  const sonuc = {};
  for (const lang of ['tr', 'en']) {
    if (lang === 'en') await page.evaluate(() => document.getElementById('lang').click());
    await page.evaluate(() => window.inst.pause());
    const dur = await page.evaluate(() => window.inst.duration), at = 0.6, k = sp[lang].kelimeler;
    const times = [0, 0.3, at + k[0].baslangic_sn + 0.12, at + k[2].baslangic_sn + 0.2, at + k[3].baslangic_sn + 0.05, at + k[3].baslangic_sn + 0.45, at + k[k.length - 1].baslangic_sn + 0.1, dur - 0.1, dur].map((v) => +v.toFixed(3));
    const seek = (t) => page.evaluate((x) => window.inst.seek(x), t), kare = {};
    const gez = async (sira) => { const o = {}; for (const t of sira) { await seek(t); o[t] = await canvas(page); } return o; };
    const ileri = await gez(times), geri = await gez([...times].reverse()), kar = await gez([times[4], times[1], times[7], times[0], times[5], times[2], times[8], times[3], times[6]]);
    const esit = times.every((t) => ileri[t] === geri[t] && ileri[t] === kar[t]);
    const stage = page.locator('#stage'), pix = [];
    for (const t of [times[2], times[4], times[6], dur]) {
      const hs = [];
      for (const prev of [0.1, dur * 0.5, dur + 0.5, dur * 0.97]) { await seek(prev); await seek(t); hs.push(sha((await stage.screenshot()).toString('base64'))); }
      pix.push(hs.every((h) => h === hs[0]));
    }
    sonuc[lang] = { zamanlar: times, canvas_ileri_geri_karisik_esit: esit, farkli_kare_sayisi: new Set(times.map((t) => sha(ileri[t]))).size, ekran_goruntusu_onceki_durumdan_bagimsiz: pix };
    check('determinizm_' + lang, esit && pix.every(Boolean) && sonuc[lang].farkli_kare_sayisi >= times.length - 1, sonuc[lang]);
  }
  out.determinizm = sonuc; out.konsol_hatasi = errors;
  check('konsol_hatasi_yok', errors.length === 0, errors);
  await ctx.close();
}

// 3) Zarf → küre boyutu; canlı (elle) seviye kipi; onay durumu; kelime olayları; reduced-motion; aria
{
  const { ctx, page } = await open();
  const r = await page.evaluate(async (speech) => {
    const dv = document.createElement('div'); dv.style.cssText = 'width:600px;height:600px;position:absolute;left:-9999px'; document.body.appendChild(dv);
    const yaricap = (cv) => {                                            // parlak piksellerin birim koordinatta merkeze en uzak mesafesi (merkez 500,500)
      const c = cv.getContext('2d'), w = cv.width, h = cv.height, d = c.getImageData(0, 0, w, h).data, k = Math.min(w, h) / 1000, ox = (w - 1000 * k) / 2, oy = (h - 1000 * k) / 2;
      let m = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (d[i] + d[i + 1] + d[i + 2] > 120) { const dx = (x - ox) / k - 500, dy = (y - oy) / k - 500, q = Math.hypot(dx, dy); if (q > m) m = q; } }
      return m;
    };
    const z = speech.tr.zarf, imax = z.indexOf(Math.max(...z)), orta = z.slice(20, z.length - 5), isil = 20 + orta.indexOf(Math.min(...orta));   // en sessiz kare (konuşma ortasında)
    const inst = FRKComponents.statusOrb.mount(dv, { seed: 1, speech: { fps: 30, zarf: z, at: 0 }, states: [[0, 'speaking']], duration: 7 });
    const cv = dv.querySelector('canvas'), res = {};
    inst.seek(imax / 30); res.sesli_yaricap = yaricap(cv); res.sesli_zarf = z[imax];
    inst.seek(isil / 30); res.sessiz_yaricap = yaricap(cv); res.sessiz_zarf = z[isil];
    inst.seek(imax / 30 + 0.3); const bir = cv.toDataURL(); inst.seek(0); inst.seek(imax / 30 + 0.3); res.ayni_t_ayni_kare = bir === cv.toDataURL();
    inst.destroy();
    // canlı kip: konuşma verisi yok, setLevel sürer
    const live = FRKComponents.statusOrb.mount(dv, { seed: 1, states: [[0, 'speaking']], duration: 4 }), cv2 = dv.querySelector('canvas');
    live.setLevel(0); live.seek(1); res.canli_seviye0_yaricap = yaricap(cv2); live.setLevel(1); live.seek(1); res.canli_seviye1_yaricap = yaricap(cv2);
    live.destroy();
    // onay durumu: dinliyordan farklı kare, durum adı ve etiket
    const ap = FRKComponents.statusOrb.mount(dv, { seed: 1, locale: 'en', states: [[0, 'listening'], [1, 'approval']], duration: 3 }), cv3 = dv.querySelector('canvas');
    ap.seek(0.5); const l = cv3.toDataURL(); ap.seek(2); const a = cv3.toDataURL();
    res.onay = { farkli_kare: l !== a, durum: dv.getAttribute('data-state'), aria: dv.firstChild.getAttribute('aria-label') };
    ap.destroy();
    // kelime olayları: ileri oynarken sırayla bir kez; geri sarınca olay yok; baştan tekrar aynı sayıda
    const ev = []; const inst2 = FRKComponents.statusOrb.mount(dv, { seed: 1, locale: 'tr', speech: speech.tr });
    dv.addEventListener('frk:word', (e) => ev.push(e.detail.word));
    for (let t = 0; t <= inst2.duration + 0.001; t += 1 / 30) inst2.seek(t);
    const ilk = ev.slice(); ev.length = 0; inst2.seek(3); inst2.seek(1); const geriOlay = ev.length;
    inst2.seek(0); for (let t = 0; t <= inst2.duration + 0.001; t += 1 / 30) inst2.seek(t);
    res.kelime_olaylari = { ilk_oynatma: ilk.length, beklenen: speech.tr.kelimeler.length, sira_dogru: ilk.join(' ') === speech.tr.kelimeler.map((e) => e.yazi || e.kelime).join(' '), geri_sarinca: geriOlay, ikinci_oynatma: ev.length - geriOlay };
    res.aria_konusurken = (() => { inst2.seek(1.5); return dv.firstChild.getAttribute('aria-label'); })();
    inst2.destroy();
    // geçersiz durum adı hâlâ atılıyor
    const t2 = FRKComponents.statusOrb.mount(dv, { seed: 1 }); try { t2.setState('yok'); res.gecersiz_durum_atildi = false; } catch (e) { res.gecersiz_durum_atildi = e instanceof RangeError; }
    t2.destroy(); dv.remove();
    return res;
  }, sp);
  const oran = r.sesli_yaricap / r.sessiz_yaricap, canliOran = r.canli_seviye1_yaricap / r.canli_seviye0_yaricap;
  out.zarf_kure = { ...r, oran_sesli_sessiz: +oran.toFixed(3), canli_oran: +canliOran.toFixed(3) };
  check('zarf_kureyi_buyutur', oran >= 1.3, { sesli_yaricap: +r.sesli_yaricap.toFixed(1), sessiz_yaricap: +r.sessiz_yaricap.toFixed(1), oran: +oran.toFixed(3), esik: 1.3 });
  check('ayni_t_ayni_kare', r.ayni_t_ayni_kare, 'zarflı konuşmada seek(0) → seek(t) ile seek(t) aynı');
  check('canli_seviye_kipi', canliOran >= 1.3, { seviye0: +r.canli_seviye0_yaricap.toFixed(1), seviye1: +r.canli_seviye1_yaricap.toFixed(1), oran: +canliOran.toFixed(3) });
  check('onay_durumu', r.onay.farkli_kare && r.onay.durum === 'approval' && /awaiting approval/.test(r.onay.aria), r.onay);
  const ko = r.kelime_olaylari;
  check('kelime_olaylari', ko.ilk_oynatma === ko.beklenen && ko.sira_dogru && ko.geri_sarinca === 0 && ko.ikinci_oynatma === ko.beklenen, ko);
  check('aria_konusurken_metin', r.aria_konusurken === 'Asistan: ' + sp.tr.metin, r.aria_konusurken);
  check('gecersiz_durum_atilir', r.gecersiz_durum_atildi, 'RangeError');
  await ctx.close();
}

// 4) reduced-motion: konuşurken animasyon yok, bütün kelimeler yerinde
{
  const { ctx, page } = await open({ reducedMotion: 'reduce' }, pathToFileURL(join(dir, 'demo.html')).href);
  const r = await page.evaluate((speech) => {
    const dv = document.createElement('div'); dv.style.cssText = 'width:600px;height:600px;position:absolute;left:-9999px'; document.body.appendChild(dv);
    const i = FRKComponents.statusOrb.mount(dv, { seed: 1, speech: speech, states: [[0, 'speaking']] }); i.play();
    const alt = () => { const cv = dv.querySelector('canvas'), w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, Math.round(h * 0.82), w, Math.round(h * 0.12)).data; let n = 0; for (let p = 0; p < d.length; p += 4) if (d[p] + d[p + 1] + d[p + 2] > 300) n++; return n; };
    const a = alt(), t = dv.getAttribute('data-t'), pl = i.playing; i.destroy(); dv.remove();
    return { oynuyor: pl, durum_yazilan_t: t, altyazi_parlak_piksel: a };
  }, sp.tr);
  await page.waitForTimeout(300);
  out.reduced_motion = r;
  check('reduced_motion_konusma', !r.oynuyor && r.altyazi_parlak_piksel > 500, r);
  await ctx.close();
}

// 5) Kare maliyeti: seek (JS) ve canlı oynatma
{
  const { ctx, page } = await open();
  out.performans = await page.evaluate(async () => {
    const inst = window.inst; inst.pause();
    const N = 600, ts = [];
    for (let i = 0; i < N; i++) { const t0 = performance.now(); inst.seek(0.6 + (i / N) * 5.5); ts.push(performance.now() - t0); }
    const gaps = []; let last = 0;
    inst.seek(0);
    await new Promise((res) => {
      const onTick = () => { const n = performance.now(); if (last) gaps.push(n - last); last = n; };
      const st = document.getElementById('stage');
      st.addEventListener('frk:tick', onTick);
      st.addEventListener('frk:end', () => { st.removeEventListener('frk:tick', onTick); res(); }, { once: true });
      inst.play();
    });
    gaps.sort((a, b) => a - b);
    const ort = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    return { seek_ort_ms: +ort(ts).toFixed(3), seek_max_ms: +Math.max(...ts).toFixed(3), canli_kare_sayisi: gaps.length + 1, kare_araligi_ort_ms: +ort(gaps).toFixed(2), kare_araligi_p95_ms: +gaps[Math.floor(gaps.length * 0.95)].toFixed(2), hedef_kare_ms: 16.7, not: 'Başsız Chromium, bu makine, masaüstü. Telefon ölçülmedi.' };
  });
  check('seek_kare_butcesi', out.performans.seek_ort_ms < 16.7, 'seek ort ' + out.performans.seek_ort_ms + ' ms (bütçe 16,7)');
  await ctx.close();
}

// 6) axe + klavye + 390 px mobil
{
  const { ctx, page } = await open();
  await page.evaluate(() => window.inst.pause()); await page.evaluate(axeSrc);
  const ax = [];
  for (const t of [0.2, 2.0, 4.5, 7.0]) { await page.evaluate((x) => window.inst.seek(x), t); const r = await page.evaluate(() => axe.run(document, { resultTypes: ['violations'] })); ax.push({ t, ihlal: r.violations.length, kurallar: r.violations.map((v) => v.id) }); }
  await page.keyboard.press('2');
  const onayKlavye = await page.evaluate(() => (window.inst.pause(), window.inst.seek(2.0), window.inst.state)), r2 = await page.evaluate(() => axe.run(document, { resultTypes: ['violations'] }));
  ax.push({ durum: 'onay', ihlal: r2.violations.length, kurallar: r2.violations.map((v) => v.id) });
  await page.keyboard.press('1');
  const geriKonusma = await page.evaluate(() => (window.inst.pause(), window.inst.seek(2.0), window.inst.state));
  out.erisilebilirlik = { arac: 'axe-core 4.13.0', taramalar: ax, klavye_2_onay_durumuna_gecer: onayKlavye, klavye_1_konusmaya_doner: geriKonusma };
  check('axe_sezgi', ax.every((a) => a.ihlal === 0), ax);
  check('klavye_durumlar', onayKlavye === 'approval' && geriKonusma === 'speaking', { tus2_t2: onayKlavye, tus1_t2: geriKonusma });
  await ctx.close();
  const m = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const g = await m.page.evaluate(() => { const st = document.getElementById('stage').getBoundingClientRect(); const h = [...document.querySelectorAll('button,input')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => Math.min(r.width, r.height)); return { tasma_yok: document.documentElement.scrollWidth <= window.innerWidth, sahne_px: Math.round(st.width), dokunma_hedefi_min_px: Math.floor(Math.min(...h)) }; });
  out.mobil_390 = { ...g, not: 'Chromium mobil emülasyonu; gerçek telefon ölçülmedi' };
  check('mobil_390', g.tasma_yok && g.dokunma_hedefi_min_px >= 44, g);
  await m.ctx.close();
}

await browser.close();
out.ozet = { toplam: Object.keys(out.kontroller).length, gecen: Object.values(out.kontroller).filter((k) => k.gecti).length, basarisiz: fail };
writeFileSync(join(dir, 'olcum-sezgi.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out.ozet), fail.length ? 'BAŞARISIZ: ' + fail.join(', ') : 'TAMAM');
process.exit(fail.length ? 1 : 0);
