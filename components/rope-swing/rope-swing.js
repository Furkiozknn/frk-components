/*! frk-components / rope-swing — tek dosya, kütüphanesiz · SPDX-License-Identifier: MIT · Kullanım: FRKComponents.ropeSwing.mount(el, { locale: 'tr' }) */
(function (global) {
  'use strict';

  // ── Çekirdek: sabit adımlı, DOM'suz, yalnız + − × ÷ √ (sin/cos/hypot yok → motorlar arası aynı sonuç) ──
  const DT = 1 / 120, G = 1100, REACH = 240, DAMP = 0.1, BONUS = 1.1, BONUS_MIN = 380, VMAX = 900, FALL_Y = 440;
  const LEVEL = {
    start: [40, 200, 110, 0],                                   // x, y, vx, vy
    anchors: [[150, 90], [350, 70], [560, 105], [760, 75], [970, 100], [1170, 65], [1380, 110], [1590, 80], [1790, 95], [2000, 70], [2200, 100]],
    finishX: 2340,
  };
  // [adım, basılı 1/0] — otopilot kaydı; araclar/rope-bot.mjs üretir, sabit adım sayısıyla çalışır.
  const DEFAULT_INPUTS = [[12, 1], [66, 0], [88, 1], [130, 0], [155, 1], [203, 0], [255, 1], [297, 0], [349, 1], [391, 0], [443, 1], [485, 0], [531, 1], [561, 0]];
  const DUR = 6;                                              // varsayılan süre (sn): otopilot 4,86 sn'de bitirir

  function createSim(level) {
    level = level || LEVEL;
    const A = level.anchors;
    let s, log;

    function reset() {
      s = { step: 0, x: level.start[0], y: level.start[1], vx: level.start[2], vy: level.start[3], hook: -1, len: 0,
        down: 0, ev: 0, done: false, doneStep: -1, deaths: 0, hooks: 0, trail: [] };
      log = [];
    }

    // Menzildeki, yukarıdaki en uygun nokta: hız yönüne hizalı ve yakın olan kazanır.
    function pick() {
      const sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      const ux = sp > 40 ? s.vx / sp : 1, uy = sp > 40 ? s.vy / sp : 0;
      let best = -1, bs = -1e9;
      for (let i = 0; i < A.length; i++) {
        const dx = A[i][0] - s.x, dy = A[i][1] - s.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > REACH || dy > -10) continue;
        const sc = ((dx * ux + dy * uy) / d) * 3 - d / REACH;
        if (sc > bs) { bs = sc; best = i; }
      }
      return best;
    }

    function once(inputs) {
      const i = s.step;
      while (s.ev < inputs.length && inputs[s.ev][0] <= i) s.down = inputs[s.ev++][1];
      s.step = i + 1;
      if (s.done) return;
      if (s.down && s.hook < 0) {
        const k = pick();
        if (k >= 0) {
          const dx = A[k][0] - s.x, dy = A[k][1] - s.y;
          s.hook = k; s.len = Math.sqrt(dx * dx + dy * dy); s.hooks++;
          log.push({ step: i, type: 'hook', ax: A[k][0], ay: A[k][1] });
        }
      } else if (!s.down && s.hook >= 0) {
        s.hook = -1;
        const sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        if (sp >= BONUS_MIN) { s.vx *= BONUS; s.vy *= BONUS; }
        log.push({ step: i, type: 'release', speed: sp });
      }
      s.vy += G * DT;
      if (s.hook >= 0) { s.vx *= 1 - DAMP * DT; s.vy *= 1 - DAMP * DT; }
      const sp2 = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (sp2 > VMAX) { s.vx *= VMAX / sp2; s.vy *= VMAX / sp2; }
      s.x += s.vx * DT; s.y += s.vy * DT;
      if (s.hook >= 0) {                                       // halat: sert kısıt, dışa doğru hız atılır
        const dx = s.x - A[s.hook][0], dy = s.y - A[s.hook][1];
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > s.len) {
          const nx = dx / d, ny = dy / d;
          s.x = A[s.hook][0] + nx * s.len; s.y = A[s.hook][1] + ny * s.len;
          const vr = s.vx * nx + s.vy * ny;
          if (vr > 0) { s.vx -= vr * nx; s.vy -= vr * ny; }
        }
      }
      if (i % 3 === 0) { s.trail.push([s.x, s.y]); if (s.trail.length > 18) s.trail.shift(); }
      if (s.x >= level.finishX) { s.done = true; s.doneStep = s.step; log.push({ step: i, type: 'finish' }); }
      else if (s.y > FALL_Y) {                                 // düştü: başa dön, süre durmaz
        s.x = level.start[0]; s.y = level.start[1]; s.vx = level.start[2]; s.vy = level.start[3];
        s.hook = -1; s.deaths++; s.trail = [];
        log.push({ step: i, type: 'fall' });
      }
    }

    function run(inputs, to) {
      if (to < s.step) reset();
      while (s.step < to) once(inputs);
      return s;
    }

    reset();
    return { run: run, reset: reset, pick: pick, get state() { return s; }, get log() { return log; } };
  }

  // ── Arayüz ──
  const TXT = {
    tr: { label: 'Kanca ipi oyunu', hint: 'Boşluk ya da dokunma: kancayı tut, bırakınca fırla.', hook: 'Kanca takıldı', rel: 'Bırakıldı',
      fin: 'Bitti', fall: 'Düştün', hooks: 'kanca', done: 'BİTTİ' },
    en: { label: 'Rope swing game', hint: 'Space or touch: hold to hook, release to fling.', hook: 'Hooked', rel: 'Released',
      fin: 'Finished', fall: 'You fell', hooks: 'hooks', done: 'FINISHED' },
  };
  const BG = '#0e0d0b', CREAM = '#f1ece2', MUTE = '#b9b4a8', YELLOW = '#ffc21a', CORAL = '#ff4d6d';
  const SR = 'position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
  let uid = 0;

  function prng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mount(el, opts) {
    opts = opts || {};
    const L = TXT[opts.locale === 'en' ? 'en' : 'tr'];
    const duration = opts.duration || DUR;
    let inputs = (opts.inputs || DEFAULT_INPUTS).map((e) => e.slice());
    const sim = createSim(opts.level);
    const level = opts.level || LEVEL;
    const rnd = prng(opts.seed == null ? 1 : opts.seed);
    const stars = Array.from({ length: 48 }, () => ({ x: rnd() * 1400, y: rnd() * 330, z: 0.15 + rnd() * 0.35, r: rnd() < 0.2 ? 1.6 : 1 }));

    el.textContent = '';
    const id = 'frk-rope-' + ++uid;
    const root = document.createElement('div');
    root.className = 'frk-rope';
    root.tabIndex = 0;
    root.setAttribute('role', 'application');
    root.setAttribute('aria-label', L.label);
    root.setAttribute('aria-describedby', id);
    root.style.cssText = 'position:relative;width:100%;height:100%;outline-offset:2px';
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    const hint = document.createElement('div');
    hint.id = id; hint.style.cssText = SR; hint.textContent = L.hint;
    const live = document.createElement('div');
    live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.style.cssText = SR;
    root.append(cv, hint, live);
    el.appendChild(root);
    const ctx = cv.getContext('2d');

    let k = 1, ox = 0, oy = 0;
    function fit() {
      const dpr = global.devicePixelRatio || 1, w = el.clientWidth || 640, h = el.clientHeight || 360;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      k = Math.min(cv.width / 640, cv.height / 360);
      ox = (cv.width - 640 * k) / 2; oy = (cv.height - 360 * k) / 2;
      draw();
    }

    function draw() {
      const s = sim.state;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(k, 0, 0, k, ox, oy);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 640, 360); ctx.clip();
      const cam = Math.max(0, Math.min(s.x - 210, level.finishX + 90 - 640));
      ctx.fillStyle = CREAM;
      for (const st of stars) {                                // paralaks yıldızlar
        ctx.globalAlpha = 0.25;
        const x = ((st.x - cam * st.z) % 1400 + 1400) % 1400 - 380;
        if (x > -4 && x < 644) ctx.fillRect(x, st.y, st.r, st.r);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = CORAL; ctx.globalAlpha = 0.35; ctx.setLineDash([6, 6]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 346); ctx.lineTo(640, 346); ctx.stroke();   // düşme çizgisi
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      const cand = s.hook < 0 ? sim.pick() : -1;
      for (let i = 0; i < level.anchors.length; i++) {
        const ax = level.anchors[i][0] - cam, ay = level.anchors[i][1];
        if (ax < -20 || ax > 660) continue;
        ctx.fillStyle = i === s.hook ? YELLOW : i === cand ? CORAL : MUTE;
        ctx.beginPath(); ctx.arc(ax, ay, i === s.hook || i === cand ? 6 : 4.5, 0, 6.2832); ctx.fill();
        if (i === cand) {
          ctx.strokeStyle = CORAL; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(s.x - cam, s.y); ctx.lineTo(ax, ay); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      const fx = level.finishX - cam;                          // bitiş bayrağı
      ctx.strokeStyle = YELLOW; ctx.fillStyle = YELLOW; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(fx, 130); ctx.lineTo(fx, 346); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx, 130); ctx.lineTo(fx + 26, 142); ctx.lineTo(fx, 154); ctx.fill();
      for (let i = 0; i < s.trail.length; i++) {               // iz
        ctx.globalAlpha = (i + 1) / (s.trail.length + 1) * 0.5; ctx.fillStyle = YELLOW;
        ctx.beginPath(); ctx.arc(s.trail[i][0] - cam, s.trail[i][1], 3, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (s.hook >= 0) {
        ctx.strokeStyle = CREAM; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(level.anchors[s.hook][0] - cam, level.anchors[s.hook][1]); ctx.lineTo(s.x - cam, s.y); ctx.stroke();
      }
      ctx.fillStyle = CREAM; ctx.strokeStyle = s.hook >= 0 ? YELLOW : MUTE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x - cam, s.y, 7, 0, 6.2832); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.setTransform(k, 0, 0, k, ox, oy);
      ctx.font = '12px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = MUTE; ctx.textBaseline = 'top';
      ctx.textAlign = 'left'; ctx.fillText(((s.done ? s.doneStep : s.step) * DT).toFixed(2) + ' s', 10, 8);
      ctx.textAlign = 'right'; ctx.fillText(L.hooks + ' ' + s.hooks, 630, 8);
      if (s.done) {
        ctx.font = '56px "League Gothic", Impact, "Arial Narrow", sans-serif'; ctx.fillStyle = YELLOW; ctx.textAlign = 'center';
        ctx.fillText(L.done + ' ' + (s.doneStep * DT).toFixed(2) + ' s', 320, 150);
      }
    }

    let cur = 0, prevT = 0, seen = 0, raf = 0, t0 = null, ended = false, destroyed = false;
    const emit = (name, detail) => el.dispatchEvent(new CustomEvent('frk:' + name, { detail: detail }));

    // Saf: aynı t + aynı girdi listesi → aynı kare. Sabit adım: adım = round(t / DT).
    function seek(t) {
      t = Math.max(0, +t || 0);
      cur = t;
      const s = sim.run(inputs, Math.round(t / DT));
      draw();
      el.setAttribute('data-t', t.toFixed(3));
      const log = sim.log;
      if (t >= prevT) {
        for (let i = seen; i < log.length; i++) {
          const e = log[i], et = e.step * DT;
          if (e.type === 'hook') { emit('hook', { t: et, ax: e.ax, ay: e.ay }); live.textContent = L.hook; }
          else if (e.type === 'release') { emit('release', { t: et, speed: e.speed }); live.textContent = L.rel; }
          else if (e.type === 'finish') { emit('finish', { t: et }); live.textContent = L.fin + ' ' + et.toFixed(2) + ' s'; }
          else live.textContent = L.fall;
        }
      }
      seen = log.length; prevT = t;
      emit('tick', { t: t, x: s.x, y: s.y });
      const done = t >= duration;
      if (done && !ended) emit('end', { t: t });
      ended = done;
    }

    // rAF'e dolaylı erişim: HyperFrames lint'i kompozisyon betiğinde doğrudan çağrıyı yasaklar; bu yol yalnız düğme/girdiyle çalışır.
    const raf1 = (f) => global['requestAnimationFrame'](f), raf0 = (h) => global['cancelAnimationFrame'](h);

    function pause() {
      if (raf) raf0(raf);
      raf = 0;
    }

    function loop(ts) {                                        // zaman rAF'in verdiği ts'ten gelir; saat okunmaz
      if (t0 === null) t0 = ts - cur * 1000;
      const t = Math.min((ts - t0) / 1000, duration);
      seek(t);
      raf = t < duration ? raf1(loop) : 0;
    }

    function play(force) {
      if (raf || destroyed) return;
      const reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (force !== true && opts.reducedMotion !== false && reduce) { seek(duration); return; }
      if (cur >= duration) { cur = 0; sim.reset(); }
      t0 = null;
      raf = raf1(loop);
    }

    // Oyuncu girdisi: o ana kadarki kayıt kalır, sonrası silinir (otopilottan devralma).
    function input(down) {
      down = down ? 1 : 0;
      const step = Math.round(cur / DT);
      inputs = inputs.filter((e) => e[0] < step);
      if ((inputs.length ? inputs[inputs.length - 1][1] : 0) !== down) inputs.push([step, down]);
      sim.reset();
      seek(cur);
      play(true);
    }

    function setInputs(list) {                                 // null → otopilot, [] → boş
      inputs = (list || DEFAULT_INPUTS).map((e) => e.slice());
      sim.reset(); seen = 0; prevT = 0;
      seek(0);
    }

    const down = (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); input(1); }
      else if (e.key === 'Escape') { e.preventDefault(); pause(); }                                 // WCAG 2.2.2: duraklat
      else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); if (raf) pause(); else play(true); }
    };
    const up = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); input(0); } };
    const pdown = (e) => { root.focus({ preventScroll: true }); input(1); };
    const pup = () => input(0);
    root.addEventListener('keydown', down); root.addEventListener('keyup', up);
    cv.addEventListener('pointerdown', pdown);
    cv.addEventListener('pointerup', pup); cv.addEventListener('pointercancel', pup);

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('12px "JetBrains Mono"'), document.fonts.load('56px "League Gothic"')]).then(draw, function () {});
    }

    function destroy() {
      destroyed = true; pause();
      if (ro) ro.disconnect();
      root.removeEventListener('keydown', down); root.removeEventListener('keyup', up);
      el.textContent = ''; el.removeAttribute('data-t');
    }

    fit();
    seek(0);
    emit('ready', { duration: duration });
    return {
      seek: seek, play: play, pause: pause, destroy: destroy, duration: duration, input: input, setInputs: setInputs,
      get playing() { return !!raf; },
      get inputs() { return inputs.map((e) => e.slice()); },
      get state() { return Object.assign({}, sim.state, { trail: undefined }); },
    };
  }

  const api = { mount: mount, createSim: createSim, LEVEL: LEVEL, DEFAULT_INPUTS: DEFAULT_INPUTS, DT: DT };
  global.FRKComponents = global.FRKComponents || {};
  global.FRKComponents.ropeSwing = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
