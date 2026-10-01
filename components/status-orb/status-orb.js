/*! frk-components / status-orb — tek dosya, kütüphanesiz · SPDX-License-Identifier: MIT · Kullanım: FRKComponents.statusOrb.mount(el, { locale: 'tr' }) */
(function (global) {
  'use strict';

  // Durumlar ve renkler (FRK-OS jetonları; koyu zeminde ≥ 6:1 kontrast).
  const NAMES = ['listening', 'thinking', 'searching', 'done'];
  const RGB = { listening: [241, 236, 226], thinking: [25, 211, 230], searching: [255, 122, 26], done: [255, 194, 26] };
  const TXT = {
    tr: { prefix: 'Asistan', listening: 'dinliyor', thinking: 'düşünüyor', searching: 'arıyor', done: 'bitti' },
    en: { prefix: 'Assistant', listening: 'listening', thinking: 'thinking', searching: 'searching', done: 'done' },
  };
  const BG = '#0e0d0b', MUTE = '#b9b4a8';
  const BLEND = 0.7;                        // durum geçişi (sn)
  const STATIC_T = 2.0;                     // reduced-motion'da sabit pozun zamanı
  const REEL = [[0, 'listening'], [1.5, 'thinking'], [3, 'searching'], [4.5, 'done']];
  const SR = 'position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
  const TAU = Math.PI * 2;
  const BUCKETS = 10;                       // parçacık saydamlığı kümesi sayısı

  const smooth = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };

  function prng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Zaman çizelgesi: [[t, durum], ...] → t anındaki {durum: ağırlık}. Saf: yalnız t'ye ve listeye bakar.
  function weightsAt(states, t) {
    const w = { listening: 0, thinking: 0, searching: 0, done: 0 };
    let k = -1;
    for (let i = 0; i < states.length; i++) if (states[i][0] <= t) k = i;
    if (k < 0) { w.listening = 1; return { w: w, cur: 'listening' }; }
    const cur = states[k][1], f = k > 0 ? smooth((t - states[k][0]) / BLEND) : 1;
    w[cur] += f;
    if (k > 0) w[states[k - 1][1]] += 1 - f;
    return { w: w, cur: cur };
  }

  // Parçacık konumu (birim koordinat, [-1,1]): durum başına çözümsel form, hepsi t'nin fonksiyonu.
  const POS = {
    listening(s, ph, rx, ry, t, lv) {
      const a = TAU * s + 0.25 * t, row = ((s * 977) % 1 < 0.5) ? 0.64 : 0.76;
      const r = row + (0.03 + 0.17 * lv) * Math.sin(6 * a - 2.4 * t + ph * 0.2);
      return [r * Math.cos(a) + rx * 0.014, r * Math.sin(a) + ry * 0.014];
    },
    thinking(s, ph, rx, ry, t) {
      const u = TAU * s, c = Math.cos(0.18 * t), n = Math.sin(0.18 * t);
      const x = 0.6 * Math.sin(2 * u + 0.7 * t) + 0.26 * Math.sin(5 * u - 0.5 * t);
      const y = 0.6 * Math.sin(3 * u + 0.9 * t + 1.1) + 0.26 * Math.cos(4 * u + 0.4 * t);
      return [x * c - y * n + rx * 0.012, x * n + y * c + ry * 0.012];
    },
    searching(s, ph, rx, ry, t) {
      const q = (s * 5 + 0.3 * t) % 1, r = 0.12 + 0.68 * Math.pow(q, 0.8), a = TAU * s * 3 + 1.3 * t + q * 2;
      return [r * Math.cos(a) + rx * 0.012, r * Math.sin(a) + ry * 0.012];
    },
    done(s, ph, rx, ry, t, lv, i) {
      if (i % 4 === 0) {                                  // her dördüncü parçacık onay işaretini çizer
        const p = (s * 4) % 1, seg = p < 0.35 ? p / 0.35 : (p - 0.35) / 0.65;
        const x = p < 0.35 ? -0.34 + 0.24 * seg : -0.1 + 0.48 * seg, y = p < 0.35 ? 0.02 + 0.26 * seg : 0.28 - 0.58 * seg;
        return [x + rx * 0.01, y + ry * 0.01];
      }
      const a = TAU * s + 0.05 * t, r = 0.74 + 0.012 * Math.sin(8 * a + ph + t);
      return [r * Math.cos(a), r * Math.sin(a)];
    },
  };

  let uid = 0;

  function mount(el, opts) {
    opts = opts || {};
    const loc = opts.locale === 'en' ? 'en' : 'tr', L = TXT[loc];
    const n = opts.n || 2200;
    const duration = opts.duration == null ? 6 : opts.duration;
    let level = opts.level == null ? 0.5 : opts.level;
    let states = (opts.states || REEL).map((e) => e.slice());
    const rnd = prng(opts.seed == null ? 1 : opts.seed);
    const bk = Array.from({ length: BUCKETS }, () => []);
    const P = { s: new Float32Array(n), ph: new Float32Array(n), rx: new Float32Array(n), ry: new Float32Array(n), w: new Float32Array(n) };
    for (let i = 0; i < n; i++) { P.s[i] = (i + 0.5) / n; P.ph[i] = rnd() * TAU; P.rx[i] = rnd() * 2 - 1; P.ry[i] = rnd() * 2 - 1; P.w[i] = 0.6 + rnd() * 0.9; }

    el.textContent = '';
    const root = document.createElement('div');
    root.className = 'frk-orb';
    root.setAttribute('role', 'img');
    root.style.cssText = 'position:relative;width:100%;height:100%';
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:100%';
    const live = document.createElement('div');
    live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.style.cssText = SR;
    root.append(cv, live);
    el.appendChild(root);
    const ctx = cv.getContext('2d');

    let k = 1, ox = 0, oy = 0, cur = 0, curName = 'listening', seenName = null, prevT = 0, raf = 0, t0 = null, ended = false, destroyed = false;
    const label = (name) => L.prefix + ': ' + L[name];
    const emit = (name, detail) => el.dispatchEvent(new CustomEvent('frk:' + name, { detail: detail }));

    function fit() {
      const dpr = global.devicePixelRatio || 1, w = el.clientWidth || 400, h = el.clientHeight || 400;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      k = Math.min(cv.width, cv.height) / 1000;
      ox = (cv.width - 1000 * k) / 2; oy = (cv.height - 1000 * k) / 2;
      draw(cur, weightsAt(states, cur).w);
    }

    function draw(t, w) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = BG; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(k, 0, 0, k, ox, oy);
      let r = 0, g = 0, b = 0;
      for (const nm of NAMES) { r += w[nm] * RGB[nm][0]; g += w[nm] * RGB[nm][1]; b += w[nm] * RGB[nm][2]; }
      r = Math.round(r); g = Math.round(g); b = Math.round(b);
      const glow = ctx.createRadialGradient(500, 500, 40, 500, 500, 520);
      glow.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.10)'); glow.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, 1000, 1000);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      const R = 380, act = NAMES.filter((nm) => w[nm] > 0.001);
      for (let q = 0; q < BUCKETS; q++) bk[q].length = 0;
      for (let i = 0; i < n; i++) {
        let x = 0, y = 0;
        for (const nm of act) { const p = POS[nm](P.s[i], P.ph[i], P.rx[i], P.ry[i], t, level, i); x += w[nm] * p[0]; y += w[nm] * p[1]; }
        const q = Math.min(BUCKETS - 1, ((0.5 + 0.5 * Math.sin(P.ph[i] + 2 * t * P.w[i])) * BUCKETS) | 0);
        bk[q].push(500 + x * R, 500 + y * R, 2.2 + 1.2 * P.w[i]);
      }
      for (let q = 0; q < BUCKETS; q++) {                      // aynı saydamlıktakiler tek yolda: çok sayıda ayrı çizim çağrısından kaçınır
        const c = bk[q];
        if (!c.length) continue;
        ctx.globalAlpha = 0.3 + 0.65 * (q + 0.5) / BUCKETS;
        ctx.beginPath();
        for (let j = 0; j < c.length; j += 3) ctx.rect(c[j] - c[j + 2] / 2, c[j + 1] - c[j + 2] / 2, c[j + 2], c[j + 2]);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (opts.label) {
        ctx.font = '26px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = MUTE; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(L[weightsAt(states, t).cur], 500, 975);
      }
    }

    // Saf: aynı t, aynı durum listesi, aynı seviye → aynı kare.
    function seek(t) {
      t = Math.max(0, +t || 0);
      cur = t;
      const q = weightsAt(states, t);
      draw(t, q.w);
      curName = q.cur;
      root.setAttribute('aria-label', label(curName));
      el.setAttribute('data-t', t.toFixed(3)); el.setAttribute('data-state', curName);
      if (t >= prevT && seenName !== null && curName !== seenName) { emit('state', { t: t, state: curName }); live.textContent = label(curName); }
      seenName = curName; prevT = t;
      emit('tick', { t: t });
      const done = t >= duration;
      if (done && !ended) emit('end', { t: t });
      ended = done;
    }

    const raf1 = (f) => global['requestAnimationFrame'](f), raf0 = (h) => global['cancelAnimationFrame'](h);
    function pause() { if (raf) raf0(raf); raf = 0; }
    function loop(ts) {                                        // zaman rAF'in verdiği ts'ten gelir; saat okunmaz
      if (t0 === null) t0 = ts - cur * 1000;
      const t = Math.min((ts - t0) / 1000, duration);
      seek(t);
      raf = t < duration ? raf1(loop) : 0;
    }
    const reduce = () => global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches && opts.reducedMotion !== false;

    // Hareket tercihinde animasyon yok: durumun sabit pozu (STATIC_T anı), geçiş yok.
    function still() {
      const nm = weightsAt(states, cur).cur, w = { listening: 0, thinking: 0, searching: 0, done: 0 };
      w[nm] = 1; draw(STATIC_T, w);
      curName = nm; root.setAttribute('aria-label', label(nm)); el.setAttribute('data-state', nm); el.setAttribute('data-t', cur.toFixed(3));
      if (seenName !== nm) live.textContent = label(nm);
      seenName = nm;
    }

    function play(force) {
      if (raf || destroyed) return;
      if (force !== true && reduce()) { cur = duration; still(); emit('tick', { t: cur }); return; }
      if (cur >= duration) cur = 0;
      t0 = null;
      raf = raf1(loop);
    }

    // Uygulama durumu seçer: o ana kadarki kayıt kalır, sonrası silinir; kayıt başka örnekte aynı kareleri verir.
    function setState(name) {
      if (NAMES.indexOf(name) < 0) throw new RangeError('status-orb: bilinmeyen durum ' + name);
      states = states.filter((e) => e[0] < cur);
      if (!states.length || states[states.length - 1][1] !== name) states.push([states.length ? cur : 0, name]);
      if (reduce()) { still(); return; }
      seek(cur);
      play(true);
    }

    function setLevel(v) { level = Math.max(0, Math.min(1, +v || 0)); if (reduce()) still(); else seek(cur); }

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);
    if (opts.label && document.fonts && document.fonts.load) document.fonts.load('26px "JetBrains Mono"').then(() => draw(cur, weightsAt(states, cur).w), function () {});

    function destroy() { destroyed = true; pause(); if (ro) ro.disconnect(); el.textContent = ''; el.removeAttribute('data-t'); el.removeAttribute('data-state'); }

    fit();
    seek(0);
    emit('ready', { duration: duration });
    return {
      seek: seek, play: play, pause: pause, destroy: destroy, duration: duration, setState: setState, setLevel: setLevel,
      get playing() { return !!raf; },
      get state() { return curName; },
      get states() { return states.map((e) => e.slice()); },
    };
  }

  const api = { mount: mount, NAMES: NAMES, REEL: REEL };
  global.FRKComponents = global.FRKComponents || {};
  global.FRKComponents.statusOrb = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
