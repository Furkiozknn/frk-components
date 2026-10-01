/*! frk-components / prompt-terminal — tek dosya, kütüphanesiz. Kullanım: FRKComponents.promptTerminal.mount(el, { locale: 'tr' }) */
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

  const SPIN = ['-', '\\', '|', '/'];
  const CPS_TYPE = 24, CPS_OUT = 80;                       // yazma / çıktı hızı (karakter/sn)

  // Örnek senaryo — gerçek bir oturum kaydı değildir.
  const DEFAULT = {
    tr: [
      { k: 'cmd', text: 'hero animasyonunu hareket azaltma tercihine uyumlu yap' },
      { k: 'think', text: 'Düşünüyor…', done: 'Düşünüldü', dur: 1.1 },
      { k: 'out', text: 'src/hero.js okunuyor' },
      { k: 'out', text: 'prefers-reduced-motion kontrolü ekleniyor' },
      { k: 'out', text: 'Tercih açıkken animasyon son kareye atlıyor' },
      { k: 'out', text: 'Bitti — örnek senaryo', accent: true },
    ],
    en: [
      { k: 'cmd', text: 'make the hero animation respect reduced motion' },
      { k: 'think', text: 'Thinking…', done: 'Thought', dur: 1.1 },
      { k: 'out', text: 'Reading src/hero.js' },
      { k: 'out', text: 'Adding a prefers-reduced-motion check' },
      { k: 'out', text: 'With the preference on, the animation jumps to its last frame' },
      { k: 'out', text: 'Done — sample scenario', accent: true },
    ],
  };

  const CSS =
    '.frk-pt{display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;box-sizing:border-box;' +
    'background:var(--frk-pt-bg,#0e0d0b);color:var(--frk-pt-fg,#f1ece2);' +
    'font-family:var(--frk-pt-font,"JetBrains Mono",ui-monospace,Consolas,monospace);line-height:1.45}' +
    '.frk-pt-bar{flex:none;display:flex;align-items:center;gap:.5em;height:2.1em;padding:0 .9em;background:var(--frk-pt-bar,#1a1712);' +
    'color:var(--frk-pt-dim,#b9b4a8);font-size:.8em;border-bottom:1px solid #3a352b}' +
    '.frk-pt-bar i{width:.7em;height:.7em;border-radius:50%;background:#3a352b;display:block}' +
    '.frk-pt-bar i:first-child{background:var(--frk-pt-accent,#ffc21a)}' +
    '.frk-pt-body{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-end;padding:.9em;overflow:hidden}' +
    '.frk-pt-l{white-space:pre-wrap;word-break:break-word}' +
    '.frk-pt-l.d{color:var(--frk-pt-dim,#b9b4a8)}.frk-pt-l.a{color:var(--frk-pt-accent,#ffc21a)}' +
    '.frk-pt-p{color:var(--frk-pt-accent,#ffc21a)}' +
    '.frk-pt-cur{display:inline-block;width:.6em;height:1.1em;vertical-align:text-bottom;margin-left:1px;background:var(--frk-pt-accent,#ffc21a)}';

  let cssDone = false;
  function injectCss() {
    if (cssDone) return;
    const s = document.createElement('style');
    s.setAttribute('data-frk', 'prompt-terminal');
    s.textContent = CSS;
    document.head.appendChild(s);
    cssDone = true;
  }

  // Zaman planı: her adımın ne zaman başlayıp bittiği ve harf harf çıkış anları.
  function plan(script, rnd) {
    let t = 0.4;
    const items = [];
    script.forEach((s) => {
      const chars = Array.from(s.text || '');
      if (s.k === 'think') {
        const dur = s.dur || 1.1;
        items.push({ s: s, start: t, end: t + dur, chars: chars, times: [] });
        t += dur + 0.1;
        return;
      }
      const cps = s.k === 'cmd' ? CPS_TYPE : CPS_OUT, start = t, times = [];
      chars.forEach((ch) => {
        t += (1 / cps) * (0.6 + 0.8 * rnd()) + (s.k === 'cmd' && ch === ' ' && rnd() < 0.12 ? 0.22 : 0);
        times.push(t);
      });
      items.push({ s: s, start: start, end: t, chars: chars, times: times });
      t += s.k === 'cmd' ? 0.35 : 0.22;                    // Enter / satır arası
    });
    return { items: items, total: t + 0.9 };
  }

  function mount(el, opts) {
    opts = opts || {};
    const seed = opts.seed == null ? 1 : opts.seed;
    const locale = opts.locale === 'en' ? 'en' : 'tr';
    const script = opts.script || DEFAULT[locale];
    const cols = opts.cols || 44;
    const title = opts.title || 'claude · frk-components';
    const prompt = opts.prompt || '› ';

    injectCss();
    const pl = plan(script, prng(seed));
    const scale = opts.duration ? opts.duration / pl.total : 1;   // duration verilirse tüm zamanlar ölçeklenir
    const items = pl.items.map((it) => ({
      s: it.s, chars: it.chars, start: it.start * scale, end: it.end * scale, times: it.times.map((x) => x * scale),
    }));
    const duration = pl.total * scale;
    const transcript = script.map((s) => (s.k === 'cmd' ? prompt : '') + (s.k === 'think' ? s.done || s.text : s.text)).join('. ');   // son kareyle aynı metin

    el.textContent = '';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', transcript);
    const root = document.createElement('div');
    root.className = 'frk-pt';
    root.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('div');
    bar.className = 'frk-pt-bar';
    for (let i = 0; i < 3; i++) bar.appendChild(document.createElement('i'));
    bar.appendChild(document.createElement('span')).textContent = title;
    const body = document.createElement('div');
    body.className = 'frk-pt-body';
    root.appendChild(bar);
    root.appendChild(body);
    el.appendChild(root);
    const cur = document.createElement('span');
    cur.className = 'frk-pt-cur';

    // Yazı boyutu: `cols` sütun genişliğe sığsın (yalnız yerleşim, zamandan bağımsız)
    function fit() { root.style.fontSize = Math.max(8, el.clientWidth / (cols * 0.6 + 1.8)).toFixed(2) + 'px'; }
    fit();
    if (document.fonts && document.fonts.load) document.fonts.load('16px ' + getComputedStyle(root).fontFamily, prompt + transcript + '•…—').catch(() => {});
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);

    const pool = [];                                       // satır düğümleri; yalnız önbellek, durumu t belirler
    function line(i) {
      if (!pool[i]) { pool[i] = document.createElement('div'); pool[i].className = 'frk-pt-l'; pool[i]._k = ''; pool[i]._v = null; }
      return pool[i];
    }

    let cur_t = 0, raf = 0, ended = false, destroyed = false;
    const emit = (name, detail) => el.dispatchEvent(new CustomEvent('frk:' + name, { detail: detail }));

    // Saf çizim: aynı t → aynı kare.
    function seek(t) {
      t = Math.max(0, +t || 0);
      cur_t = t;
      const rows = [];                                     // {cls, pre, text}
      let typing = false;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (t < it.start) break;
        const k = it.s.k;
        if (k === 'think') {
          rows.push(t < it.end
            ? { cls: 'a', pre: SPIN[Math.floor(t * 10) % SPIN.length] + ' ', text: it.s.text }
            : { cls: 'd', pre: '• ', text: it.s.done || it.s.text });
          continue;
        }
        let n = 0;
        while (n < it.chars.length && it.times[n] <= t) n++;
        if (n < it.chars.length) typing = true;
        rows.push({ cls: k === 'cmd' ? '' : it.s.accent ? 'a' : it.s.dim ? 'd' : '', pre: k === 'cmd' ? prompt : '• ', pcls: k === 'cmd' ? 'p' : '', text: it.chars.slice(0, n).join('') });
      }
      for (let i = 0; i < rows.length; i++) {
        const d = line(i), r = rows[i], key = r.cls + '|' + (r.pcls || '') + '|' + r.pre + '|' + r.text;
        if (d._v !== key) {
          d._v = key;
          d.className = 'frk-pt-l' + (r.cls ? ' ' + r.cls : '');
          d.textContent = '';
          const p = document.createElement('span');
          if (r.pcls) p.className = 'frk-pt-' + r.pcls;
          p.textContent = r.pre;
          d.appendChild(p);
          d.appendChild(document.createTextNode(r.text));
        }
        if (d.parentNode !== body) body.appendChild(d);
      }
      for (let i = rows.length; i < pool.length; i++) if (pool[i].parentNode) pool[i].remove();
      // İmleç: son satırın sonunda; yazarken sabit, bekleyince yarım saniyede bir yanıp söner.
      if (rows.length) {
        line(rows.length - 1).appendChild(cur);
        cur.style.visibility = typing || Math.floor(t * 2) % 2 === 0 ? 'visible' : 'hidden';
      }
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
      if (cur_t >= duration) cur_t = 0;
      // Saati tarayıcı verir (rAF zaman damgası); kod doğrudan saat okumaz, her kare hemen seek(t)'e çevrilir.
      let t0 = null;
      const from = cur_t;
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
    emit('ready', { duration: duration, text: transcript });
    return { seek: seek, play: play, pause: pause, destroy: destroy, duration: duration };
  }

  global.FRKComponents = global.FRKComponents || {};
  global.FRKComponents.promptTerminal = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
