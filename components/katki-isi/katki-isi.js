/*! frk-components / katki-isi — tek dosya, kütüphanesiz. Kullanım: FRKComponents.katkiIsi.mount(el, { locale: 'tr' }) */
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

  const POP = 0.35;                                         // bir hücrenin dolma süresi (sn)
  const HOLD = 0.5;                                         // son hücreden sonra bekleme (sn)
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const easeBack = (p) => { const c1 = 1.70158, c3 = c1 + 1, q = p - 1; return 1 + c3 * q * q * q + c1 * q * q; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const LEVELS = ['#1a1712', '#5a4510', '#9a7410', '#d49d12', '#ffc21a'];   // 0 = boş
  const T = {
    tr: { title: 'KATKI ISISI', sample: 'ÖRNEK VERİ', unit: 'katkı', less: 'Az', more: 'Çok', label: (s, w, n, m) => (s ? 'Örnek veri: ' : '') + w + ' hafta, ' + n + ' katkı, en yoğun gün ' + m },
    en: { title: 'CONTRIBUTION HEAT', sample: 'SAMPLE DATA', unit: 'contributions', less: 'Less', more: 'More', label: (s, w, n, m) => (s ? 'Sample data: ' : '') + w + ' weeks, ' + n + ' contributions, busiest day ' + m },
  };

  // Örnek veri: hafta içi yoğun, hafta sonu seyrek, haftadan haftaya dalgalı. Sütun sırası: hafta, gün.
  function demoData(weeks, rnd) {
    const out = [];
    let mood = 0.5;
    for (let w = 0; w < weeks; w++) {
      mood = clamp01(mood + (rnd() - 0.5) * 0.5);
      for (let d = 0; d < 7; d++) {
        const f = d === 0 || d === 6 ? 0.35 : 1;
        const r = rnd();
        out.push(r < 0.18 ? 0 : Math.floor(r * r * 14 * mood * f + (rnd() < mood * f ? 1 : 0)));
      }
    }
    return out;
  }

  function mount(el, opts) {
    opts = opts || {};
    const seed = opts.seed == null ? 1 : opts.seed;
    const locale = opts.locale === 'en' ? 'en' : 'tr';
    const tx = T[locale];
    const weeks = opts.weeks || 20;
    const duration = opts.duration || 4;
    const bg = opts.bg || '#0e0d0b';
    const sample = !opts.data;
    const rnd = prng(seed);
    const data = (opts.data || demoData(weeks, rnd)).slice(0, weeks * 7);
    while (data.length < weeks * 7) data.push(0);
    const max = Math.max.apply(null, data.concat(1));
    const lvl = data.map((c) => (c <= 0 ? 0 : c <= max * 0.25 ? 1 : c <= max * 0.5 ? 2 : c <= max * 0.75 ? 3 : 4));
    const fillDur = Math.max(0.1, duration - POP - HOLD);
    const start = data.map((_, i) => {                       // çapraz dalga: sol-üstten sağ-alta
      const w = Math.floor(i / 7), d = i % 7;
      return ((w / Math.max(1, weeks - 1)) * 0.75 + (d / 6) * 0.25) * (1 - rnd() * 0.04) * fillDur;
    });
    const total = data.reduce((a, b) => a + b, 0);
    const nf = new Intl.NumberFormat(locale + '-u-nu-latn');
    const rgb = LEVELS.map(hex);
    const mix = (a, b, p) => 'rgb(' + [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * p)).join(',') + ')';

    el.textContent = '';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', tx.label(sample, weeks, nf.format(total), max));
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:100%';
    el.appendChild(cv);
    const ctx = cv.getContext('2d');
    let cur = 0, raf = 0, ended = false, destroyed = false, W = 0, H = 0;
    const emit = (name, detail) => el.dispatchEvent(new CustomEvent('frk:' + name, { detail: detail }));

    function rr(x, y, w, h, r) { if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
    function box(x, y, w, h, r) { ctx.beginPath(); rr(x, y, w, h, r); ctx.fill(); }

    // Saf çizim: yalnız t'ye ve sabit veriye bağlı.
    function draw(t) {
      const dpr = global.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      const u = Math.min(W / 1080, H / 760);
      const bw = 1000 * u, pitch = bw / weeks, cell = pitch * 0.82, gh = pitch * 7;
      const bh = 28 * u + 24 * u + 190 * u + 40 * u + gh + 40 * u + 28 * u;
      const x0 = (W - bw) / 2, y0 = (H - bh) / 2;
      // etiket
      ctx.textBaseline = 'alphabetic';
      ctx.font = Math.round(28 * u) + 'px "JetBrains Mono",ui-monospace,Consolas,monospace';
      ctx.fillStyle = '#b9b4a8';
      ctx.fillText('// ' + tx.title, x0, y0 + 24 * u);
      if (sample) { ctx.fillStyle = '#ffc21a'; ctx.textAlign = 'right'; ctx.fillText(tx.sample, x0 + bw, y0 + 24 * u); ctx.textAlign = 'left'; }
      // sayaç: o ana kadar dolan hücrelerin toplamı
      let n = 0;
      for (let i = 0; i < data.length; i++) if (t >= start[i]) n += data[i];
      ctx.font = Math.round(190 * u) + 'px "League Gothic",Impact,"Arial Narrow",sans-serif';
      ctx.fillStyle = '#f1ece2';
      const ny = y0 + 28 * u + 24 * u + 160 * u, numTxt = nf.format(n);
      ctx.fillText(numTxt, x0, ny);
      const nw = ctx.measureText(numTxt).width;
      ctx.font = Math.round(30 * u) + 'px "JetBrains Mono",ui-monospace,Consolas,monospace';
      ctx.fillStyle = '#b9b4a8';
      ctx.fillText(tx.unit, x0 + nw + 20 * u, ny);
      // ızgara: boş zemin tek yol, oturmuş hücreler düzeye göre tek yol, yalnız geçişteki hücreler tek tek
      const gy = y0 + 28 * u + 24 * u + 190 * u + 40 * u, off = (pitch - cell) / 2;
      const px = (i) => x0 + Math.floor(i / 7) * pitch + off, py = (i) => gy + (i % 7) * pitch + off;
      ctx.fillStyle = LEVELS[0];
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) rr(px(i), py(i), cell, cell, cell * 0.2);
      ctx.fill();
      const moving = [];
      for (let L = 1; L < 5; L++) {
        ctx.beginPath();
        let any = false;
        for (let i = 0; i < data.length; i++) {
          if (lvl[i] !== L) continue;
          const p = clamp01((t - start[i]) / POP);
          if (p >= 1) { rr(px(i), py(i), cell, cell, cell * 0.2); any = true; } else if (p > 0) moving.push(i);
        }
        if (any) { ctx.fillStyle = LEVELS[L]; ctx.fill(); }
      }
      for (let m = 0; m < moving.length; m++) {
        const i = moving[m], p = clamp01((t - start[i]) / POP), sz = easeBack(p) * cell, k = (cell - sz) / 2;
        ctx.fillStyle = mix(rgb[0], rgb[lvl[i]], p);
        box(px(i) + k, py(i) + k, sz, sz, sz * 0.2);
      }
      // gösterge
      const ly = gy + gh + 40 * u, lh = 28 * u, sq = 24 * u;
      ctx.font = Math.round(24 * u) + 'px "JetBrains Mono",ui-monospace,Consolas,monospace';
      ctx.fillStyle = '#b9b4a8';
      ctx.textAlign = 'right';
      const lw = ctx.measureText(tx.more).width;
      ctx.fillText(tx.more, x0 + bw, ly + 22 * u);
      ctx.textAlign = 'left';
      const sx = x0 + bw - lw - 14 * u - 5 * (sq + 6 * u);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = LEVELS[k]; box(sx + k * (sq + 6 * u), ly + (lh - sq) / 2, sq, sq, sq * 0.2); }
      ctx.fillStyle = '#b9b4a8';
      ctx.textAlign = 'right';
      ctx.fillText(tx.less, sx - 14 * u, ly + 22 * u);
      ctx.textAlign = 'left';
    }

    function resize() {
      const dpr = global.devicePixelRatio || 1;
      W = el.clientWidth || 1; H = el.clientHeight || 1;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      draw(cur);
    }
    resize();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(el);
    if (document.fonts && document.fonts.load) {
      // Canvas metni unicode-range alt kümelerini kendiliğinden beklemez: çizilecek metni açıkça yükle, sonra yeniden çiz.
      const mono = '24px "JetBrains Mono"', gothic = '190px "League Gothic"';
      const labels = tx.title + tx.sample + tx.unit + tx.less + tx.more + '// ';
      Promise.all([document.fonts.load(mono, labels), document.fonts.load(gothic, '0123456789.,-')]).then(() => draw(cur), () => {});
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(cur));

    function seek(t) {
      t = Math.max(0, +t || 0);
      cur = t;
      draw(t);
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
    emit('ready', { duration: duration, total: total });
    return { seek: seek, play: play, pause: pause, destroy: destroy, duration: duration, total: total };
  }

  global.FRKComponents = global.FRKComponents || {};
  global.FRKComponents.katkiIsi = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
