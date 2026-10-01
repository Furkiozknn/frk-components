/*! frk-components / ilerleme-halkasi — tek dosya, kütüphanesiz · SPDX-License-Identifier: MIT · Kullanım: FRKComponents.ilerlemeHalkasi.mount(el, { value: 72 }) */
(function (global) {
  'use strict';

  const TAU = Math.PI * 2;
  const BG = '#0e0d0b', PANEL = '#1a1712', LINE = '#3a352b', CREAM = '#f1ece2', MUTE = '#b9b4a8', YELLOW = '#ffc21a';
  const TXT = {
    tr: { label: 'ilerleme', done: 'tamamlandı', name: 'İlerleme', pct: (n) => '%' + n },
    en: { label: 'progress', done: 'complete', name: 'Progress', pct: (n) => n + '%' },
  };
  const SR = 'position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
  const SPARKS = 28, BUCKETS = 4, R = 330, W = 56;

  const ease = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return 1 - Math.pow(1 - x, 3); };   // power3.out

  function prng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Değer çizelgesi: [[t, hedef, süre], ...] — t anında mevcut değerden hedefe `süre` sn'de gidilir.
  // Başlangıç değerleri önceki olaylardan hesaplanır; yeni olay eklemek geçmiş kareleri değiştirmez.
  function starts(ev, from) {
    const s = [];
    for (let k = 0; k < ev.length; k++) {
      if (k === 0) { s.push(from); continue; }
      const p = ev[k - 1];
      s.push(s[k - 1] + (p[1] - s[k - 1]) * ease((ev[k][0] - p[0]) / p[2]));
    }
    return s;
  }
  function valueAt(ev, st, from, t) {
    let k = -1;
    for (let i = 0; i < ev.length; i++) if (ev[i][0] <= t) k = i;
    if (k < 0) return from;
    return st[k] + (ev[k][1] - st[k]) * ease((t - ev[k][0]) / ev[k][2]);
  }

  function mount(el, opts) {
    opts = opts || {};
    const L = TXT[opts.locale === 'en' ? 'en' : 'tr'];
    const from = opts.from == null ? 0 : opts.from;
    let dur = opts.duration || 2.4;
    const value = opts.value == null ? 72 : opts.value;
    let ev = (opts.values || [[0, value, dur]]).map((e) => [e[0], e[1], e[2] || dur]);
    let st = starts(ev, from);
    const rnd = prng(opts.seed == null ? 1 : opts.seed);
    const sp = Array.from({ length: SPARKS }, () => ({ d: rnd(), r: rnd() * 2 - 1, z: 3.5 + rnd() * 4.5, ph: rnd() * TAU }));
    const target = () => Math.round(ev.length ? ev[ev.length - 1][1] : from);

    el.textContent = '';
    const root = document.createElement('div');
    root.className = 'frk-ring';
    root.setAttribute('role', 'progressbar');
    root.setAttribute('aria-label', L.name);
    root.setAttribute('aria-valuemin', '0'); root.setAttribute('aria-valuemax', '100');
    root.style.cssText = 'position:relative;width:100%;height:100%';
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:100%';
    const live = document.createElement('div');
    live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.style.cssText = SR; live.setAttribute('data-layout-ignore', '');
    root.append(cv, live);
    el.appendChild(root);
    const ctx = cv.getContext('2d');
    const bk = Array.from({ length: BUCKETS }, () => []);

    let k = 1, ox = 0, oy = 0, cur = 0, prevT = 0, prevV = 0, raf = 0, t0 = null, ended = false, destroyed = false;
    const emit = (name, detail) => el.dispatchEvent(new CustomEvent('frk:' + name, { detail: detail }));
    const aria = () => { const n = target(); root.setAttribute('aria-valuenow', String(n)); root.setAttribute('aria-valuetext', L.pct(n) + ' ' + (n >= 100 ? L.done : L.label)); };

    function fit() {
      const dpr = global.devicePixelRatio || 1, w = el.clientWidth || 400, h = el.clientHeight || 400;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      k = Math.min(cv.width, cv.height) / 1000;
      ox = (cv.width - 1000 * k) / 2; oy = (cv.height - 1000 * k) / 2;
      draw(cur);
    }

    function draw(t) {
      const v = valueAt(ev, st, from, t), p = Math.max(0, Math.min(100, v)) / 100, a1 = -Math.PI / 2, a2 = a1 + p * TAU;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.fillStyle = BG; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(k, 0, 0, k, ox, oy);
      const glow = ctx.createRadialGradient(500, 500, 60, 500, 500, 520);
      glow.addColorStop(0, 'rgba(255,194,26,' + (0.02 + 0.07 * p).toFixed(3) + ')'); glow.addColorStop(1, 'rgba(255,194,26,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, 1000, 1000);
      ctx.lineCap = 'butt';
      ctx.strokeStyle = PANEL; ctx.lineWidth = W;                                 // iz
      ctx.beginPath(); ctx.arc(500, 500, R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(500, 500, R + W / 2, 0, TAU); ctx.moveTo(500 + R - W / 2, 500); ctx.arc(500, 500, R - W / 2, 0, TAU); ctx.stroke();
      ctx.strokeStyle = MUTE; ctx.globalAlpha = 0.4; ctx.lineWidth = 3;           // çentikler: her %5, %25'te uzun
      ctx.beginPath();
      for (let i = 0; i < 20; i++) {
        const a = a1 + (i / 20) * TAU, r0 = R - W / 2 - (i % 5 === 0 ? 42 : 26), r1 = R - W / 2 - 14;
        ctx.moveTo(500 + r0 * Math.cos(a), 500 + r0 * Math.sin(a)); ctx.lineTo(500 + r1 * Math.cos(a), 500 + r1 * Math.sin(a));
      }
      ctx.stroke(); ctx.globalAlpha = 1;
      if (p > 0.0005) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = YELLOW; ctx.globalAlpha = 0.07; ctx.lineWidth = W + 56;   // parıltı
        ctx.beginPath(); ctx.arc(500, 500, R, a1, a2); ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = W;
        ctx.beginPath(); ctx.arc(500, 500, R, a1, a2); ctx.stroke();
        if (p < 0.9995) {                                                          // uçtaki kıvılcımlar (tohumlu, t'nin saf fonksiyonu)
          for (let q = 0; q < BUCKETS; q++) bk[q].length = 0;
          for (const s of sp) {
            const fl = 0.5 + 0.5 * Math.sin(s.ph + 11 * t), a = a2 - s.d * 0.42, rr = R + s.r * (W / 2 + 10 + 22 * s.d);
            bk[Math.min(BUCKETS - 1, (fl * BUCKETS) | 0)].push(500 + rr * Math.cos(a), 500 + rr * Math.sin(a), s.z * (1 - 0.6 * s.d));
          }
          ctx.fillStyle = CREAM;
          for (let q = 0; q < BUCKETS; q++) {
            const c = bk[q];
            if (!c.length) continue;
            ctx.globalAlpha = 0.25 + 0.7 * (q + 0.5) / BUCKETS;
            ctx.beginPath();
            for (let j = 0; j < c.length; j += 3) ctx.rect(c[j] - c[j + 2] / 2, c[j + 1] - c[j + 2] / 2, c[j + 2], c[j + 2]);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          ctx.beginPath(); ctx.arc(500 + R * Math.cos(a2), 500 + R * Math.sin(a2), 14, 0, TAU); ctx.fillStyle = CREAM; ctx.fill();
        }
      }
      const n = Math.round(v);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.font = '300px "League Gothic", Impact, "Arial Narrow", sans-serif'; ctx.fillStyle = CREAM;
      ctx.fillText(L.pct(n), 500, 560);
      ctx.font = '34px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = MUTE;
      ctx.fillText(n >= 100 ? L.done : L.label, 500, 640);
    }

    // Saf: aynı t, aynı değer çizelgesi → aynı kare.
    function seek(t) {
      t = Math.max(0, +t || 0);
      cur = t;
      const v = valueAt(ev, st, from, t);
      draw(t);
      el.setAttribute('data-t', t.toFixed(3)); el.setAttribute('data-value', v.toFixed(2));
      if (t >= prevT && prevV < 99.95 && v >= 99.95) { live.textContent = L.pct(100) + ' ' + L.done; emit('done', { t: t }); }
      prevT = t; prevV = v;
      emit('tick', { t: t, value: v });
      const done = t >= dur;
      if (done && !ended) emit('end', { t: t });
      ended = done;
    }

    const raf1 = (f) => global['requestAnimationFrame'](f), raf0 = (h) => global['cancelAnimationFrame'](h);
    function pause() { if (raf) raf0(raf); raf = 0; }
    function loop(ts) {                                        // zaman rAF'in verdiği ts'ten gelir; saat okunmaz
      if (t0 === null) t0 = ts - cur * 1000;
      const t = Math.min((ts - t0) / 1000, dur);
      seek(t);
      raf = t < dur ? raf1(loop) : 0;
    }
    const reduce = () => global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches && opts.reducedMotion !== false;
    function play(force) {
      if (raf || destroyed) return;
      if (force !== true && reduce()) { seek(dur); return; }
      if (cur >= dur) cur = 0;
      t0 = null;
      raf = raf1(loop);
    }

    // Uygulama değeri değiştirir: o ana kadarki çizelge kalır, sonrası silinir; mevcut değerden yeni hedefe gidilir.
    function setValue(v, trans) {
      v = Math.max(0, Math.min(100, +v || 0));
      if (reduce()) { ev = [[0, v, 0.001]]; st = starts(ev, from); aria(); seek(dur); return; }
      trans = trans || opts.transition || 0.8;
      ev = ev.filter((e) => e[0] < cur); ev.push([cur, v, trans]); st = starts(ev, from);
      dur = Math.max(dur, cur + trans + 0.4);
      aria(); seek(cur); play(true);
    }

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);
    if (document.fonts && document.fonts.load) {               // canvas metni: gereken yazı tipi alt kümeleri çizilecek bütün metinle önceden yüklenir
      const all = '0123456789%' + Object.keys(TXT).map((l) => TXT[l].label + TXT[l].done).join('');
      Promise.all([document.fonts.load('300px "League Gothic"', all), document.fonts.load('34px "JetBrains Mono"', all)]).then(() => draw(cur), function () {});
    }
    function destroy() { destroyed = true; pause(); if (ro) ro.disconnect(); el.textContent = ''; el.removeAttribute('data-t'); el.removeAttribute('data-value'); }

    aria();
    fit();
    seek(0);
    emit('ready', { duration: dur });
    return {
      seek: seek, play: play, pause: pause, destroy: destroy, setValue: setValue,
      get duration() { return dur; },
      get playing() { return !!raf; },
      get value() { return valueAt(ev, st, from, cur); },
      get values() { return ev.map((e) => e.slice()); },
      get state() { return { value: +valueAt(ev, st, from, cur).toFixed(4) }; },
    };
  }

  const api = { mount: mount, valueAt: (ev, t, from) => valueAt(ev, starts(ev, from || 0), from || 0, t) };
  global.FRKComponents = global.FRKComponents || {};
  global.FRKComponents.ilerlemeHalkasi = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
