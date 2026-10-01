/*! frk-components / odometer — tek dosya, kütüphanesiz. Kullanım: FRKComponents.odometer.mount(el, { value: 167829 }) */
(function (global) {
  'use strict';

  // Tohumlu rastgelelik (mulberry32); tarayıcının kendi rastgele üretecine başvurulmaz.
  function prng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const easeOut = (p) => 1 - Math.pow(1 - p, 3);          // power3.out
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const LH = 1.1;                                          // hücre yüksekliği (em)
  const SETTLE = 0.35;                                     // son hane durunca "oturma" darbesi (sn)

  const CSS =
    '.frk-odo{display:flex;align-items:center;justify-content:center;width:100%;height:100%;' +
    'color:var(--frk-odo-color,#ffc21a);background:var(--frk-odo-bg,transparent);' +
    'font-family:var(--frk-odo-font,"League Gothic",Impact,"Arial Narrow",sans-serif);' +
    'font-variant-numeric:tabular-nums;line-height:1;overflow:hidden}' +
    '.frk-odo-row{display:inline-flex;align-items:flex-start;white-space:nowrap}' +
    '.frk-odo-col{display:inline-block;width:var(--frk-odo-w,1ch);height:' + LH + 'em;overflow:hidden;text-align:center;' +
    '-webkit-mask-image:linear-gradient(#0000,#000 10%,#000 90%,#0000);mask-image:linear-gradient(#0000,#000 10%,#000 90%,#0000)}' +
    '.frk-odo-strip{display:block;will-change:transform}' +
    '.frk-odo-strip>i{display:block;height:' + LH + 'em;line-height:' + LH + 'em;font-style:normal}' +
    '.frk-odo-sep{display:inline-block;height:' + LH + 'em;line-height:' + LH + 'em;padding:0 .04em}';

  let cssDone = false;
  function injectCss() {
    if (cssDone) return;
    const s = document.createElement('style');
    s.setAttribute('data-frk', 'odometer');
    s.textContent = CSS;
    document.head.appendChild(s);
    cssDone = true;
  }

  function mount(el, opts) {
    opts = opts || {};
    const seed = opts.seed == null ? 1 : opts.seed;
    const value = opts.value == null ? 167829 : opts.value;
    const duration = opts.duration || 2.4;
    const locale = opts.locale || 'tr';
    const prefix = opts.prefix || '', suffix = opts.suffix || '';
    const decimals = opts.decimals || 0;

    injectCss();
    const text = prefix +
      new Intl.NumberFormat(locale + '-u-nu-latn', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value) +
      suffix;

    el.textContent = '';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', text);
    const root = document.createElement('div');
    root.className = 'frk-odo';
    const row = document.createElement('div');
    row.className = 'frk-odo-row';
    row.setAttribute('aria-hidden', 'true');
    root.appendChild(row);
    el.appendChild(root);

    // Hane planı: her sayısal hane için {strip, digit, stop(sn), turns}
    const rnd = prng(seed);
    const spin = Math.max(0.1, duration - SETTLE);   // duration = oturma darbesi dahil toplam süre
    const chars = Array.from(text);
    const nd = chars.filter((c) => c >= '0' && c <= '9').length;
    const cols = [];
    let k = 0;
    chars.forEach((c) => {
      if (c < '0' || c > '9') {
        const sep = document.createElement('span');
        sep.className = 'frk-odo-sep';
        sep.textContent = c;
        row.appendChild(sep);
        return;
      }
      const col = document.createElement('span');
      col.className = 'frk-odo-col';
      const strip = document.createElement('span');
      strip.className = 'frk-odo-strip';
      strip.setAttribute('data-layout-ignore', '');   // ekran dışı rakamlar bilerek taşar (HyperFrames yerleşim denetimi)
      for (let i = 0; i <= 10; i++) strip.appendChild(Object.assign(document.createElement('i'), { textContent: i % 10 }));
      col.appendChild(strip);
      row.appendChild(col);
      k++;
      cols.push({
        strip,
        digit: +c,
        stop: spin * (0.55 + 0.45 * (k / nd) - rnd() * 0.04),   // soldan sağa, yaklaşık sırayla durur; hiçbiri spin'i aşmaz
        turns: 1 + Math.floor(rnd() * 2),                       // 1–2 tam tur
      });
    });
    const lastStop = Math.max.apply(null, cols.map((c) => c.stop));

    // Yazı boyutu: kutuya sığdır (zamandan bağımsız, yalnız yerleşim)
    function fit() {
      const nabiz = row.style.fontSize;
      row.style.fontSize = '';                  // oturma darbesi ölçümü bozmasın
      root.style.fontSize = '100px';
      // Sütun genişliği en geniş rakama göre (yazı tiplerinde rakamlar eşit genişlikte olmayabilir)
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      const cells = '0123456789'.split('').map((d) => { const c = document.createElement('span'); c.textContent = d; probe.appendChild(c); return c; });
      root.appendChild(probe);
      const wd = Math.max.apply(null, cells.map((c) => c.getBoundingClientRect().width));
      root.removeChild(probe);
      if (wd > 0) row.style.setProperty('--frk-odo-w', (wd / 100).toFixed(4) + 'em');
      const w = row.scrollWidth || 1, h = row.scrollHeight || 1;
      const s = Math.min((el.clientWidth * 0.94) / w, (el.clientHeight * 0.8) / h) * 100;
      root.style.fontSize = Math.max(8, s).toFixed(2) + 'px';
      row.style.fontSize = nabiz;
    }
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);

    let cur = 0, raf = 0, ended = false, destroyed = false;

    const emit = (name, detail) => el.dispatchEvent(new CustomEvent('frk:' + name, { detail: detail }));

    // Saf çizim: aynı t → aynı kare. Önceki duruma bakmaz.
    function seek(t) {
      t = Math.max(0, +t || 0);
      cur = t;
      for (let i = 0; i < cols.length; i++) {
        const c = cols[i];
        const p = clamp01(t / c.stop);
        const travel = 10 * c.turns + c.digit;
        const pos = p >= 1 ? c.digit : (easeOut(p) * travel) % 10;
        c.strip.style.transform = 'translate3d(0,' + (-pos * LH).toFixed(4) + 'em,0)';
      }
      const q = clamp01((t - lastStop) / SETTLE);
      const sc = t >= lastStop ? 1 + 0.08 * (1 - easeOut(q)) : 1;
      row.style.fontSize = (sc * 100).toFixed(2) + '%';   // transform değil: ters/ileri sırada raster önbelleği aynı pikseli verir
      el.setAttribute('data-t', t.toFixed(3));
      emit('tick', { t: t });
      const done = t >= duration;
      if (done && !ended) emit('end', { t: t });
      ended = done;
    }

    function pause() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function play() {
      if (raf || destroyed) return;
      const reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (opts.reducedMotion !== false && reduce) { seek(duration); return; }  // hareket istemeyene son hal
      if (cur >= duration) cur = 0;
      // Saati tarayıcı verir (rAF zaman damgası); kod doğrudan saat okumaz, her kare hemen seek(t)'e çevrilir.
      let t0 = null;
      const from = cur;
      const loop = (ts) => {
        if (t0 === null) t0 = ts - from * 1000;
        const t = (ts - t0) / 1000;
        seek(t);
        raf = t < duration ? requestAnimationFrame(loop) : 0;
      };
      raf = requestAnimationFrame(loop);
    }

    function destroy() {
      destroyed = true;
      pause();
      if (ro) ro.disconnect();
      el.textContent = '';
      el.removeAttribute('role');
      el.removeAttribute('aria-label');
      el.removeAttribute('data-t');
    }

    seek(0);
    emit('ready', { duration: duration, text: text });
    return { seek: seek, play: play, pause: pause, destroy: destroy, duration: duration };
  }

  global.FRKComponents = global.FRKComponents || {};
  global.FRKComponents.odometer = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
