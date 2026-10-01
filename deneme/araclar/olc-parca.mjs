// Canvas tabanlı parçalar için ölçüm: node deneme/araclar/olc-parca.mjs components/<parca>/demo.html
// (rope-swing, status-orb). Playwright global kurulumdan (npm root -g), axe-core araclar/node_modules'tan okunur.
// Çıktı: demo.html'in yanına olcum.json (araclar/olc.mjs ile aynı üst anahtarlar). Ölçülemeyen alan null kalır.
// Not: sayılar yalnız bu koşudan gelir; başsız Chromium, bu makine, masaüstü. Gerçek telefon/Safari/Firefox ölçülmedi.
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { kilitAl } from './kilit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);
const { chromium } = req(req.resolve('playwright', { paths: [execSync('npm root -g', { encoding: 'utf8' }).trim()] }));
const axeSrc = readFileSync(req.resolve('axe-core/axe.min.js', { paths: [resolve(here, '../../araclar')] }), 'utf8');

const demo = resolve(process.argv[2]);
const dir = dirname(demo);
const jsFile = join(dir, readdirSync(dir).find((f) => f.endsWith('.js') && !f.endsWith('.mjs')));
const url = pathToFileURL(demo).href;
const src = readFileSync(jsFile, 'utf8');
const name = /FRKComponents\.(\w+)\s*=/.exec(src)[1];            // ropeSwing | statusOrb
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 16);
const out = { olculdu: new Date().toISOString(), hedef: demo.replace(/\\/g, '/'), bilesen: name };

// 1) Boyut ve kaynak taraması (render mantığında yasak çağrı; HyperFrames lint'i için doğrudan rAF)
out.boyut = { js_bayt: Buffer.byteLength(src), js_gzip_bayt: gzipSync(src, { level: 9 }).length, demo_html_bayt: statSync(demo).size, hedef_bayt: 51200 };
out.yasak_cagri_taramasi = Object.fromEntries(['Math.random', 'Date.now', 'performance.now', 'new Date', 'requestAnimationFrame('].map((k) => [k, src.includes(k)]));

const birak = await kilitAl('olc-parca.mjs ' + name);
const browser = await chromium.launch();
out.tarayici = 'Chromium ' + browser.version();
const open = async (ctxOpts = {}, w = 900, h = 1100) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...ctxOpts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errors };
};

try {
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

  // 3) Determinizm (aynı t → aynı kare): ileri / ters / karışık sırada piksel + durum özeti
  {
    const { ctx, page, errors } = await open();
    await page.evaluate(() => window.inst.pause());
    const D = await page.evaluate(() => window.inst.duration);
    const times = [0, 0.37, 1.0, 1.234, 2.5, 3.1, 4.2, 4.86, D];
    const stage = page.locator('#stage');
    const grab = async (t) => {
      await page.evaluate((x) => window.inst.seek(x), t);
      const st = await page.evaluate(() => JSON.stringify(window.inst.state));
      return { px: sha(await stage.screenshot()), st };
    };
    const orders = {
      ileri: times,
      ters: [...times].reverse(),
      karisik: [times[4], times[1], times[8], times[0], times[6], times[2], times[7], times[3], times[5]],
    };
    const res = {};
    for (const [k, list] of Object.entries(orders)) { res[k] = {}; for (const t of list) res[k][t] = await grab(t); }
    const eq = (f) => times.every((t) => f(res.ileri[t]) === f(res.ters[t]) && f(res.ileri[t]) === f(res.karisik[t]));
    const farkli = new Set(times.map((t) => res.ileri[t].px)).size;
    // Tohum: aynı tohum aynı kare, farklı tohum farklı kare (arka plan yıldızları)
    const tohum = await page.evaluate(async () => {
      const mk = (seed) => {
        const d = document.createElement('div'); d.style.cssText = 'width:640px;height:360px;position:absolute;left:0;top:0;opacity:0';
        document.body.appendChild(d);
        const mod = Object.values(FRKComponents)[0];
        const i = mod.mount(d, { seed, locale: 'tr' }); i.seek(1.2);
        const h = d.querySelector('canvas').toDataURL(); i.destroy(); d.remove(); return h;
      };
      return { ayni: mk(7) === mk(7), farkli: mk(7) !== mk(8) };
    });
    out.determinizm = {
      zamanlar: times,
      piksel_ileri_ters_karisik_esit: eq((x) => x.px),
      durum_ileri_ters_karisik_esit: eq((x) => x.st),
      farkli_kare_sayisi: farkli,
      tohum_ayni_ayni: tohum.ayni, tohum_farkli_farkli: tohum.farkli,
    };
    out.konsol_hatasi = errors;
    await ctx.close();
  }

  // 3b) Girdi kaydı ↔ yeniden oynatma: canlı oynanan koşu, kaydedilen girdiyle birebir aynı kareleri verir
  if (name === 'ropeSwing') {
    const { ctx, page } = await open();
    out.girdi_tekrari = await page.evaluate(() => {
      const mod = FRKComponents.ropeSwing;
      const mk = (o) => { const d = document.createElement('div'); d.style.cssText = 'width:640px;height:360px;position:absolute;left:0;top:0;opacity:0'; document.body.appendChild(d); return { d, i: mod.mount(d, o) }; };
      const A = mk({ inputs: [] });
      const plan = [[0.05, 1], [0.7, 0], [0.9, 1], [1.5, 0], [1.7, 1], [2.3, 0]];
      const canli = [];                                                        // canlı oturumda, girdi verilmeden hemen önce görülen kare
      for (const [t, v] of plan) { A.i.seek(t); canli.push(A.d.querySelector('canvas').toDataURL()); A.i.input(v); A.i.pause(); }
      const kayit = A.i.inputs;
      const B = mk({ inputs: kayit });
      const hash = (x, t) => { x.i.seek(t); return x.d.querySelector('canvas').toDataURL(); };
      const canliEsit = plan.map(([t], k) => hash(B, t) === canli[k]);
      const ts = [0, 0.5, 1.1, 1.6, 2.0, 2.3, 3.0];
      const esit = ts.map((t) => hash(A, t) === hash(B, t));
      const r = { kayit_olay_sayisi: kayit.length, canli_kare_tekrarda_ayni: canliEsit, zamanlar: ts, son_kareler_esit: esit };
      A.i.destroy(); B.i.destroy(); A.d.remove(); B.d.remove();
      return r;
    });
    await ctx.close();
  }

  // 3c) Durum kaydı ↔ yeniden oynatma (status-orb): uygulamanın seçtiği durumlar kaydedilir, başka örnekte aynı kareleri verir
  if (name === 'statusOrb') {
    const { ctx, page } = await open();
    out.durum_kaydi_tekrari = await page.evaluate(() => {
      const mod = FRKComponents.statusOrb;
      const mk = (o) => { const d = document.createElement('div'); d.style.cssText = 'width:480px;height:480px;position:absolute;left:0;top:0;opacity:0'; document.body.appendChild(d); return { d, i: mod.mount(d, o) }; };
      const px = (x) => x.d.querySelector('canvas').toDataURL();
      const A = mk({ states: [[0, 'listening']] });
      const plan = [[1.0, 'thinking'], [2.2, 'searching'], [3.3, 'done']];
      const canli = [];
      for (const [t, nm] of plan) { A.i.seek(t); canli.push(px(A)); A.i.setState(nm); A.i.pause(); }
      const kayit = A.i.states;
      const B = mk({ states: kayit });
      const hash = (x, t) => { x.i.seek(t); return px(x); };
      const canliEsit = plan.map(([t], k) => hash(B, t) === canli[k]);
      const ts = [0, 0.9, 1.2, 1.6, 2.3, 2.9, 3.4, 4.5, 6];
      const esit = ts.map((t) => hash(A, t) === hash(B, t));
      B.i.seek(0.5); const a = px(B); B.i.setLevel(1); B.i.pause(); const b = px(B); B.i.setLevel(0.5); B.i.pause(); const c = px(B);
      const r = { kayit: kayit, canli_kare_tekrarda_ayni: canliEsit, zamanlar: ts, son_kareler_esit: esit, seviye_kareyi_degistirir: a !== b, seviye_geri_alinca_ayni: a === c };
      A.i.destroy(); B.i.destroy(); A.d.remove(); B.d.remove();
      return r;
    });
    await ctx.close();
  }

  // 4) Kare maliyeti: seek (JS) ve seek + canvas boşaltma (getImageData ile ham kare maliyeti); ayrıca canlı rAF aralıkları
  {
    const { ctx, page } = await open();
    out.performans = await page.evaluate(async () => {
      const inst = window.inst; inst.pause();
      const el = document.getElementById('stage'), cv = el.querySelector('canvas'), g = cv.getContext('2d');
      const N = 240, js = [], tam = [];     // bu ölçüm betiğidir, bileşen kodu değil
      for (let i = 0; i < N; i++) { const t0 = performance.now(); inst.seek((i / N) * inst.duration); js.push(performance.now() - t0); }
      for (let i = 0; i < N; i++) { const t0 = performance.now(); inst.seek((i / N) * inst.duration); el.getBoundingClientRect(); g.getImageData(0, 0, 1, 1); tam.push(performance.now() - t0); }
      const st = (a) => { const s = [...a].sort((x, y) => x - y); return { ort: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3), medyan: +s[s.length >> 1].toFixed(3), p95: +s[Math.floor(s.length * 0.95)].toFixed(3), maks: +s[s.length - 1].toFixed(3) }; };
      inst.seek(0);
      const gaps = []; let last = 0, frames = 0;
      await new Promise((res) => {
        const onTick = () => { const n = performance.now(); if (last) gaps.push(n - last); last = n; frames++; };
        el.addEventListener('frk:tick', onTick);
        el.addEventListener('frk:end', () => { el.removeEventListener('frk:tick', onTick); res(); }, { once: true });
        inst.play();
      });
      const gs = [...gaps].sort((a, b) => a - b);
      return { seek_js_ms: st(js), seek_artı_canvas_bosaltma_ms: st(tam), canli_kare_sayisi: frames,
        kare_araligi_ort_ms: +(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2), kare_araligi_p95_ms: +gs[Math.floor(gs.length * 0.95)].toFixed(2),
        hedef_kare_ms: 16.7, not: 'Başsız Chromium, bu makine, masaüstü, GPU yok olabilir. Telefon ölçülmedi.' };
    });
    await ctx.close();
  }

  // 5) axe-core (üç kare)
  {
    const { ctx, page } = await open();
    await page.evaluate(() => window.inst.pause());
    await page.evaluate(axeSrc);
    const D = await page.evaluate(() => window.inst.duration);
    const sonuc = [];
    for (const t of [0, D / 2, D]) {
      await page.evaluate((x) => window.inst.seek(x), t);
      const r = await page.evaluate(() => axe.run(document, { resultTypes: ['violations'] }));
      sonuc.push({ t: +t.toFixed(2), ihlal: r.violations.length, kurallar: r.violations.map((v) => v.id) });
    }
    out.erisilebilirlik = { arac: 'axe-core ' + (await page.evaluate(() => axe.version)), taramalar: sonuc };
    await ctx.close();
  }

  // 6) Klavye / işaretçi (parçaya özgü) ve reduced-motion
  if (name === 'ropeSwing') {
    const { ctx, page } = await open();
    await page.evaluate(() => window.inst.pause());
    await page.evaluate(() => window.inst.seek(0));
    const odak = [];
    for (let i = 0; i < 7; i++) { await page.keyboard.press('Tab'); odak.push(await page.evaluate(() => document.activeElement.id || document.activeElement.className || document.activeElement.tagName)); }
    await page.locator('.frk-rope').focus();
    const roleLabel = await page.evaluate(() => { const r = document.querySelector('.frk-rope'); return [r.getAttribute('role'), r.getAttribute('aria-label'), r.tabIndex]; });
    await page.keyboard.down('Space'); await page.waitForTimeout(350);
    const basili = await page.evaluate(() => ({ inputs: window.inst.inputs, playing: window.inst.playing, hooked: window.inst.state.hook >= 0, t: +document.getElementById('stage').dataset.t }));
    await page.keyboard.up('Space'); await page.waitForTimeout(120);
    const birakildi = await page.evaluate(() => ({ inputs: window.inst.inputs, hooked: window.inst.state.hook >= 0 }));
    await page.keyboard.press('p'); await page.waitForTimeout(80);
    const p1 = await page.evaluate(() => window.inst.playing); await page.keyboard.press('p'); await page.waitForTimeout(80);
    const p2 = await page.evaluate(() => window.inst.playing); await page.keyboard.press('Escape');
    const p3 = await page.evaluate(() => window.inst.playing);
    // Fare/dokunma: canvas'ta basılı tut
    await page.evaluate(() => { window.inst.pause(); window.inst.setInputs([]); window.inst.seek(0); });
    const box = await page.locator('canvas').boundingBox();
    await page.mouse.move(box.x + 100, box.y + 100); await page.mouse.down(); await page.waitForTimeout(250);
    const fare = await page.evaluate(() => ({ inputs: window.inst.inputs, playing: window.inst.playing }));
    await page.mouse.up(); await page.evaluate(() => window.inst.pause());
    // Otopilot düğmesi ve slider
    await page.click('#auto'); await page.waitForTimeout(200);
    const otopilot = await page.evaluate(() => ({ olay: window.inst.inputs.length, playing: window.inst.playing }));
    await page.evaluate(() => window.inst.pause()); await page.focus('#t'); await page.evaluate(() => window.inst.seek(0));
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    const slider = await page.evaluate(() => +document.getElementById('stage').dataset.t);
    out.klavye = { tab_sirasi: odak, oyun_alani_role_label_tabindex: roleLabel,
      bosluk_basili: basili, bosluk_birakildi: birakildi, p_ilk_basis_oynuyor: p1, p_ikinci_basis_oynuyor: p2, esc_sonrasi_oynuyor: p3,
      fare_basili: fare, otopilot_dugmesi: otopilot, kaydirici_oklari_t: slider };
    await ctx.close();
  }
  if (name === 'statusOrb') {
    const { ctx, page } = await open();
    await page.evaluate(() => { window.inst.pause(); window.inst.seek(0); });
    const odak = [];
    for (let i = 0; i < 9; i++) { await page.keyboard.press('Tab'); odak.push(await page.evaluate(() => document.activeElement.dataset.set || document.activeElement.id || document.activeElement.tagName)); }
    await page.focus('[data-set=searching]'); await page.keyboard.press('Enter');
    const enter = await page.evaluate(() => ({ durum: window.inst.state, basili: document.querySelector('[data-set=searching]').getAttribute('aria-pressed'), etiket: document.querySelector('.frk-orb').getAttribute('aria-label'), oynuyor: window.inst.playing }));
    await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('4'); await page.waitForTimeout(150);
    const sayi4 = await page.evaluate(() => ({ durum: window.inst.state, etiket: document.querySelector('.frk-orb').getAttribute('aria-label'), canli_bolge: document.querySelector('.frk-orb [role=status]').textContent }));
    await page.keyboard.press('Space'); const bosluk1 = await page.evaluate(() => window.inst.playing); await page.keyboard.press('Space'); const bosluk2 = await page.evaluate(() => window.inst.playing);
    await page.keyboard.press('r'); await page.waitForTimeout(120);
    const r = await page.evaluate(() => ({ t: +document.getElementById('stage').dataset.t, oynuyor: window.inst.playing }));
    await page.evaluate(() => window.inst.pause()); await page.focus('#t'); await page.evaluate(() => window.inst.seek(0));
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    const slider = await page.evaluate(() => +document.getElementById('stage').dataset.t);
    out.klavye = { tab_sirasi: odak, durum_dugmesi_enter: enter, sayi_tusu_4: sayi4, bosluk_ilk_oynuyor: bosluk1, bosluk_ikinci_oynuyor: bosluk2, r_bastan: r, kaydirici_oklari_t: slider };
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ reducedMotion: 'reduce' });
    await page.waitForTimeout(150);
    const a = await page.evaluate(() => ({ t: +document.getElementById('stage').dataset.t, dur: window.inst.duration, playing: window.inst.playing }));
    await page.waitForTimeout(600);
    const b = await page.evaluate(() => ({ t: +document.getElementById('stage').dataset.t, playing: window.inst.playing }));
    out.reduced_motion = { t_150ms: a.t, t_750ms: b.t, son_kare_gosterildi: a.t === a.dur, animasyon_yok: a.t === b.t && !b.playing };
    if (name === 'ropeSwing') {            // kullanıcı eylemi (Boşluk) hareket tercihinde de oyunu başlatır
      await page.click('#own'); await page.keyboard.down('Space'); await page.waitForTimeout(300); await page.keyboard.up('Space');
      out.reduced_motion.kullanici_girdisi_oyunu_baslatir = await page.evaluate(() => +document.getElementById('stage').dataset.t > 0.1 && window.inst.inputs.length > 0);
    }
    if (name === 'statusOrb') {            // hareket tercihinde durum seçimi anında, geçişsiz sabit poz
      await page.click('[data-set=thinking]'); await page.waitForTimeout(150);
      out.reduced_motion.durum_secimi = await page.evaluate(() => ({ durum: window.inst.state, oynuyor: window.inst.playing, etiket: document.querySelector('.frk-orb').getAttribute('aria-label') }));
    }
    await ctx.close();
    const n = await open({ reducedMotion: 'no-preference' });
    await n.page.waitForTimeout(400);
    out.reduced_motion.normalde_oynuyor = await n.page.evaluate(() => { const t = +document.getElementById('stage').dataset.t; return t > 0 && t < window.inst.duration; });
    await n.ctx.close();
  }

  // 7) 390 px düzeni: yatay taşma yok, sahne genişliği
  {
    const { ctx, page } = await open({}, 390, 844);
    out.mobil_390 = await page.evaluate(() => ({ tasma_yok: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      sahne_genislik_px: Math.round(document.getElementById('stage').getBoundingClientRect().width), dokunma_hedefi_min_px: Math.round(Math.min(...[...document.querySelectorAll('button')].map((b) => b.getBoundingClientRect().height))) }));
    await ctx.close();
  }
} finally {
  await browser.close();
  birak();
}
writeFileSync(join(dir, 'olcum.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
