/*! frk-components / kod-diff — tek dosya, kütüphanesiz · SPDX-License-Identifier: MIT · Kullanım: FRKComponents.kodDiff.mount(el, { locale: 'tr' }) */
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

  const CPS = 55;                                           // yazma hızı (karakter/sn)
  const LH = 1.5;                                           // satır yüksekliği (em)
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

  // Örnek senaryo — gerçek bir değişiklik kaydı değildir. k: ctx (olduğu gibi) | del (silinir) | add (yazılır)
  const SAMPLE = [
    { k: 'ctx', text: '"use strict";' },
    { k: 'add', text: "const Q = '(prefers-reduced-motion: reduce)';" },
    { k: 'ctx', text: '' },
    { k: 'ctx', text: 'function animateHero(el) {' },
    { k: 'del', text: "  el.style.transition = 'all 1.8s';" },
    { k: 'add', text: '  const calm = matchMedia(Q).matches;' },
    { k: 'add', text: '  el.style.transition = calm' },
    { k: 'add', text: "    ? 'none' : 'all 0.9s';" },
    { k: 'ctx', text: "  el.classList.add('enter');" },
    { k: 'ctx', text: '  return el;' },
    { k: 'ctx', text: '}' },
  ];
  const T = {
    tr: { title: 'src/hero.js · örnek diff', label: (f, a, d, body) => f + ' dosyasında ' + a + ' satır eklendi, ' + d + ' satır silindi. ' + body, add: 'Eklenen: ', del: 'Silinen: ' },
    en: { title: 'src/hero.js · sample diff', label: (f, a, d, body) => f + ': ' + a + (a === 1 ? ' line' : ' lines') + ' added, ' + d + (d === 1 ? ' line' : ' lines') + ' removed. ' + body, add: 'Added: ', del: 'Removed: ' },
  };

  const CSS =
    '.frk-kd{display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;box-sizing:border-box;' +
    'background:var(--frk-kd-bg,#0e0d0b);color:var(--frk-kd-fg,#f1ece2);' +
    'font-family:var(--frk-kd-font,"JetBrains Mono",ui-monospace,Consolas,monospace);line-height:' + LH + '}' +
    '.frk-kd-bar{flex:none;display:flex;align-items:center;gap:.5em;height:2.1em;padding:0 .9em;background:var(--frk-kd-bar,#1a1712);' +
    'color:var(--frk-kd-dim,#b9b4a8);font-size:.8em;border-bottom:1px solid #3a352b}' +
    '.frk-kd-bar i{width:.7em;height:.7em;border-radius:50%;background:#3a352b;display:block}' +
    '.frk-kd-bar i:first-child{background:var(--frk-kd-add,#ffc21a)}' +
    '.frk-kd-bar span{flex:1;white-space:nowrap;overflow:hidden}' +
    '.frk-kd-bar b{font-weight:400;white-space:nowrap}.frk-kd-bar b u{text-decoration:none;color:var(--frk-kd-add,#ffc21a)}' +
    '.frk-kd-bar b s{text-decoration:none;color:var(--frk-kd-del,#ff4d6d)}' +
    '.frk-kd-body{flex:1;min-height:0;padding:.7em 0;overflow:hidden}' +
    '.frk-kd-r{display:flex;height:' + LH + 'em;overflow:hidden;white-space:pre;padding-right:.9em}' +
    '.frk-kd-r.a{background:rgba(255,194,26,calc(var(--a,0)*.14));box-shadow:inset .25em 0 0 rgba(255,194,26,var(--a,0))}' +
    '.frk-kd-r.d{background:rgba(255,77,109,calc(var(--a,0)*.16));box-shadow:inset .25em 0 0 rgba(255,77,109,var(--a,0))}' +
    '.frk-kd-r.x .frk-kd-c{text-decoration:line-through;color:var(--frk-kd-dim,#b9b4a8)}' +
    '.frk-kd-n{flex:none;width:2.4ch;text-align:right;color:var(--frk-kd-dim,#b9b4a8);opacity:.75;margin-right:.9ch}' +
    '.frk-kd-s{flex:none;width:2ch;text-align:center}.frk-kd-r.a .frk-kd-s{color:var(--frk-kd-add,#ffc21a)}.frk-kd-r.d .frk-kd-s{color:var(--frk-kd-del,#ff4d6d)}' +
    '.frk-kd-c{flex:1;min-width:0;overflow:hidden}' +
    '.frk-kd-cur{display:inline-block;width:.6em;height:1.1em;vertical-align:text-bottom;margin-left:1px;background:var(--frk-kd-add,#ffc21a)}';

  let cssDone = false;
  function injectCss() {
    if (cssDone) return;
    const s = document.createElement('style');
    s.setAttribute('data-frk', 'kod-diff');
    s.textContent = CSS;
    document.head.appendChild(s);
    cssDone = true;
  }

  // Zaman planı: her bloğun (ardışık del/add satırları) işaretlenme, silinme ve yazılma anları.
  function plan(rows, apply, rnd) {
    let t = 0.5, i = 0;
    while (i < rows.length) {
      if (rows[i].k === 'ctx') { i++; continue; }
      let j = i;
      while (j < rows.length && rows[j].k !== 'ctx') j++;
      const run = rows.slice(i, j), dels = run.filter((r) => r.k === 'del'), adds = run.filter((r) => r.k === 'add');
      dels.forEach((r, n) => { r.mark = t + 0.14 * n; });
      let tc = dels.length ? t + 0.14 * (dels.length - 1) + 0.2 + 0.35 : t;   // işaretleme + bekleme
      dels.forEach((r) => { r.gone = tc; });
      if (dels.length) tc += apply ? 0.3 : 0.15;
      tc += 0.1;
      adds.forEach((r) => {
        r.start = tc;
        let x = tc;
        let lead = r.chars.findIndex((c) => c !== ' ');
        if (lead < 0) lead = r.chars.length;                 // girinti anında gelir, yazılmaz
        r.chars.forEach((_, n) => { if (n >= lead) x += (1 / CPS) * (0.6 + 0.8 * rnd()); r.times.push(x); });
        r.end = x;
        tc = x + 0.12;
      });
      t = tc + 0.5;
      i = j;
    }
    return t + 0.1;
  }

  function mount(el, opts) {
    opts = opts || {};
    const seed = opts.seed == null ? 1 : opts.seed;
    const locale = opts.locale === 'en' ? 'en' : 'tr';
    const tx = T[locale];
    const apply = opts.mode === 'apply';                    // 'apply': silinen satırlar çöker; varsayılan 'diff': üstü çizili kalır
    const cols = opts.cols || 44;
    const title = opts.title || tx.title;
    const lines = opts.diff || SAMPLE;

    injectCss();
    let oldN = 0, newN = 0;
    const rows = lines.map((l) => {
      const r = { k: l.k, text: l.text || '', chars: Array.from(l.text || ''), times: [], start: 0, end: 0, mark: 0, gone: 0, o: '', n: '' };
      if (l.k !== 'add') r.o = ++oldN;
      if (l.k !== 'del') r.n = ++newN;
      return r;
    });
    const natural = plan(rows, apply, prng(seed));
    const scale = opts.duration ? opts.duration / natural : 1;   // duration verilirse tüm zamanlar ölçeklenir
    const sc = (x) => x * scale;
    rows.forEach((r) => { r.start = sc(r.start); r.end = sc(r.end); r.mark = sc(r.mark); r.gone = sc(r.gone); r.times = r.times.map(sc); });
    const duration = natural * scale;
    const nAdd = rows.filter((r) => r.k === 'add').length, nDel = rows.filter((r) => r.k === 'del').length;
    const body = rows.filter((r) => r.k !== 'ctx').map((r) => (r.k === 'add' ? tx.add : tx.del) + r.text.trim()).join('; ');

    el.textContent = '';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', tx.label(title.split(' · ')[0], nAdd, nDel, body));
    const root = document.createElement('div');
    root.className = 'frk-kd';
    root.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('div');
    bar.className = 'frk-kd-bar';
    for (let i = 0; i < 3; i++) bar.appendChild(document.createElement('i'));
    bar.appendChild(document.createElement('span')).textContent = title;
    const cnt = bar.appendChild(document.createElement('b'));
    const cu = cnt.appendChild(document.createElement('u')), cs = cnt.appendChild(document.createElement('s'));
    const bodyEl = document.createElement('div');
    bodyEl.className = 'frk-kd-body';
    root.appendChild(bar);
    root.appendChild(bodyEl);
    el.appendChild(root);
    const cur = document.createElement('span');
    cur.className = 'frk-kd-cur';

    rows.forEach((r) => {
      const d = document.createElement('div');
      d.className = 'frk-kd-r';
      r.no = d.appendChild(document.createElement('span'));
      r.nn = d.appendChild(document.createElement('span'));
      r.no.className = 'frk-kd-n'; r.nn.className = 'frk-kd-n';
      r.sg = d.appendChild(document.createElement('span'));
      r.sg.className = 'frk-kd-s';
      r.cd = d.appendChild(document.createElement('span'));
      r.cd.className = 'frk-kd-c';
      r.el = d; r.c = {};
      bodyEl.appendChild(d);
    });

    function fit() { root.style.fontSize = Math.max(8, el.clientWidth / (cols * 0.6 + 9)).toFixed(2) + 'px'; }
    fit();
    if (document.fonts && document.fonts.load) document.fonts.load('16px ' + getComputedStyle(root).fontFamily, title + lines.map((l) => l.text || '').join('')).catch(() => {});
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);

    // Yalnızca değişen alanı yazar; durum tamamen t'den çıkar (önbellek yalnız DOM yazısını azaltır).
    const put = (r, key, v, fn) => { if (r.c[key] !== v) { r.c[key] = v; fn(v); } };

    let cur_t = 0, raf = 0, ended = false, destroyed = false;
    const emit = (name, detail) => el.dispatchEvent(new CustomEvent('frk:' + name, { detail: detail }));

    // Saf çizim: aynı t → aynı kare.
    function seek(t) {
      t = Math.max(0, +t || 0);
      cur_t = t;
      let adds = 0, dels = 0, typingRow = null, lastStarted = null;
      rows.forEach((r) => {
        let cls = '', a = 0, sign = ' ', text = r.text, h = LH, nn = r.n, no = r.o;
        if (r.k === 'del') {
          if (t >= r.mark) { a = clamp01((t - r.mark) / 0.2); cls = 'd'; sign = '-'; dels++; }
          if (t >= r.gone) {
            if (apply) h = LH * (1 - clamp01((t - r.gone) / 0.3));
            else cls += ' x';
          }
        } else if (r.k === 'add') {
          if (t < r.start) { text = ''; h = LH; cls = 'h'; nn = ''; }
          else {
            adds++; cls = 'a'; sign = '+'; a = clamp01((t - r.start) / 0.15);
            let n = 0;
            while (n < r.chars.length && r.times[n] <= t) n++;
            text = r.chars.slice(0, n).join('');
            lastStarted = r;
            if (n < r.chars.length) typingRow = r;
          }
        }
        put(r, 'cls', cls, (v) => { r.el.className = 'frk-kd-r ' + v; });
        // Stil tek seferde, sabit sırayla yazılır: DOM metni geçmişe bağlı olmasın (özellik sırası ilk yazılışa bağlıdır).
        put(r, 'st', '--a:' + a.toFixed(3) + (h !== LH ? ';height:' + h.toFixed(4) + 'em' : '') + (cls === 'h' ? ';visibility:hidden' : ''), (v) => { r.el.style.cssText = v; });
        put(r, 'no', String(no), (v) => { r.no.textContent = v; });
        put(r, 'nn', String(nn), (v) => { r.nn.textContent = v; });
        put(r, 'sg', sign, (v) => { r.sg.textContent = v; });
        put(r, 'tx', text, (v) => { r.cd.textContent = v; });
      });
      cu.textContent = '+' + adds + ' ';
      cs.textContent = '−' + dels;
      // İmleç: yazılan satırın sonunda; yazarken sabit, beklerken yarım saniyede bir yanıp söner.
      const host = typingRow || lastStarted;
      if (host) {
        host.cd.appendChild(cur);
        cur.style.visibility = typingRow || Math.floor(t * 2) % 2 === 0 ? 'visible' : 'hidden';
      } else if (cur.parentNode) cur.parentNode.removeChild(cur);
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
    emit('ready', { duration: duration, added: nAdd, removed: nDel });
    return { seek: seek, play: play, pause: pause, destroy: destroy, duration: duration };
  }

  global.FRKComponents = global.FRKComponents || {};
  global.FRKComponents.kodDiff = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
