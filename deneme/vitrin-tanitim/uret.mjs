// 30 sn'lik tanıtım kompozisyonunu üretir: node deneme/vitrin-tanitim/uret.mjs
// Yedi parça sırayla görünür; her biri kendi bileşen dosyasıyla (seek ile) çizilir. Sahne altyazılarındaki sayılar parçaların
// olcum.json'larından, kapanıştaki sayılar KANIT.json ve CAPRAZ-MOTOR.json'dan okunur; okunamayan sayı yazılmaz.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const d = join(kok, 'deneme', 'vitrin-tanitim');
const SURE = 30;
const GSAP = '<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js" integrity="sha384-sG0Hv1tP1lZCk9KQmrIbY/XNwi+OY84GQqhMscbnsoBFqAz8KNCil1kvfL3Hbbk2" crossorigin="anonymous"></script>';
const FONTS = ['league-gothic-latin-400-normal', 'league-gothic-latin-ext-400-normal', 'jetbrains-mono-latin-400-normal', 'jetbrains-mono-latin-ext-400-normal'];
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const fontFace = FONTS.map((f) => `@font-face{font-family:"${f.startsWith('league') ? 'League Gothic' : 'JetBrains Mono'}";src:url(fonts/${f}.woff2) format("woff2");unicode-range:${f.includes('-ext-') ? EXT : LATIN}}`).join('\n');

// Sahneler: bas/sure sn; ofs: bileşen yerel zamanı = t − bas − ofs; kutu: [x, y, genişlik, yükseklik]
const PARCALAR = [
  { ad: 'odometer', g: 'odometer', bas: 2.6, sure: 3.4, ofs: 0.25, kutu: [60, 540, 960, 520], opts: '{ seed: 1, value: 167829, locale: L, duration: 2.2 }',
    baslik: ['ODOMETRE', 'ODOMETER'], not: ['Haneler soldan sağa sırayla durur.', 'Digits stop one by one, left to right.'] },
  { ad: 'prompt-terminal', g: 'promptTerminal', bas: 6.0, sure: 3.6, ofs: 0.2, kutu: [60, 450, 960, 760], opts: '{ seed: 1, locale: L, duration: 3 }',
    baslik: ['PROMPT TERMİNALİ', 'PROMPT TERMINAL'], not: ['Komut harf harf yazılır, çıktı satır satır akar.', 'The command types out, the output streams in.'] },
  { ad: 'rope-swing', g: 'ropeSwing', bas: 9.6, sure: 4.4, ofs: -1.2, kutu: [60, 550, 960, 540], opts: '{ seed: 1, locale: L, duration: 6 }',
    baslik: ['KANCA İPİ', 'ROPE SWING'], not: ['Kancayı tut, sallan, bırak: oyun kayıttan oynar.', 'Hold, swing, release: the game plays from a recording.'] },
  { ad: 'status-orb', g: 'statusOrb', bas: 14.0, sure: 3.6, ofs: 0, kutu: [140, 430, 800, 800], opts: "{ seed: 1, locale: L, label: true, duration: 3.6, states: [[0, 'listening'], [0.9, 'thinking'], [1.8, 'searching'], [2.7, 'done']] }",
    baslik: ['DURUM KÜRESİ', 'STATUS ORB'], not: ['Dinliyor, düşünüyor, arıyor, bitti.', 'Listening, thinking, searching, done.'] },
  { ad: 'katki-isi', g: 'katkiIsi', bas: 17.6, sure: 3.4, ofs: 0.2, kutu: [60, 520, 960, 600], opts: '{ seed: 1, locale: L, duration: 2.8 }',
    baslik: ['KATKI ISISI', 'CONTRIBUTION HEAT'], not: ['Zamanla dolan katkı ızgarası (örnek veri).', 'A contribution grid that fills over time (sample data).'] },
  { ad: 'ilerleme-halkasi', g: 'ilerlemeHalkasi', bas: 21.0, sure: 3.2, ofs: 0.2, kutu: [140, 430, 800, 800], opts: '{ seed: 1, locale: L, value: 72, duration: 2.2 }',
    baslik: ['İLERLEME HALKASI', 'PROGRESS RING'], not: ['Yüzde dolan halka.', 'A ring that fills to a percentage.'] },
  { ad: 'kod-diff', g: 'kodDiff', bas: 24.2, sure: 3.6, ofs: 0.2, kutu: [60, 450, 960, 760], opts: '{ seed: 1, locale: L, duration: 3 }',
    baslik: ['KOD DIFF', 'CODE DIFF'], not: ['Eklenen satır yazılır, silinen üstü çizilir.', 'Added lines type out, removed lines get struck through.'] },
];
const HOOK = { bas: 0, sure: 2.6 }, KAPANIS = { bas: 27.8, sure: 2.2 };

const oku = (yol) => { try { return JSON.parse(readFileSync(join(kok, yol), 'utf8')); } catch { return null; } };
const bin = (n, dil) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, dil === 'tr' ? '.' : ',');
const ondalik = (x, nd, dil) => (dil === 'tr' ? x.toFixed(nd).replace('.', ',') : x.toFixed(nd));

// Sahne altyazısı: yalnız olcum.json'da bulunan sayılar
function sayilar(ad, dil) {
  const o = oku(`components/${ad}/olcum.json`);
  if (!o) return '';
  const parca = [];
  if (o.boyut && o.boyut.js_bayt) parca.push(dil === 'tr' ? `${bin(o.boyut.js_bayt, dil)} bayt` : `${bin(o.boyut.js_bayt, dil)} bytes`);
  const p = o.performans || {};
  const ms = p.seek_js_ms ? p.seek_js_ms.ort : p.seek_ort_ms;
  if (typeof ms === 'number') parca.push(`seek ${ondalik(ms, 2, dil)} ms`);
  const ax = o.erisilebilirlik && o.erisilebilirlik.taramalar;
  if (ax && ax.length) parca.push(dil === 'tr' ? `axe ${ax.reduce((a, t) => a + t.ihlal, 0)} ihlal` : `axe ${ax.reduce((a, t) => a + t.ihlal, 0)} violations`);
  return parca.join(' · ');
}

// Kapanış sayıları: çapraz motor kombinasyonları ve iki işçili render kare eşitliği
function kapanis(dil) {
  const out = [];
  const cm = oku('deneme/CAPRAZ-MOTOR.json');
  if (cm) {
    let n = 0, ok = 0, motor = 0, parca = 0;
    for (const o of Object.values(cm.parcalar)) { parca++; motor = 0; for (const x of Object.values(o)) { motor++; n++; if (x.determinizm && x.determinizm.piksel_ileri_ters_karisik_esit && x.determinizm.durum_ileri_ters_karisik_esit && x.axe.every((a) => a.ihlal === 0) && x.konsol_hatasi.length === 0) ok++; } }
    out.push(dil === 'tr' ? `${motor} motor × ${parca} parça: ${ok}/${n} geçti` : `${motor} engines × ${parca} parts: ${ok}/${n} passed`);
  }
  const k = oku('deneme/KANIT.json');
  if (k) {
    const v = PARCALAR.map((p) => k.parcalar[p.ad]).filter(Boolean), tam = v.filter((o) => o.C_iki_render && o.C_iki_render.ayni_kare_sayisi === o.C_iki_render.kare_sayisi[0] && o.C_iki_render.kare_sayisi[0] === o.C_iki_render.kare_sayisi[1]).length;
    out.push(dil === 'tr' ? `5 sn'lik parça kompozisyonları, 1 ve 2 işçili render: ${tam}/${v.length} parçada her kare aynı` : `5 s part compositions, 1 vs 2 render workers: every frame identical in ${tam}/${v.length} parts`);
  }
  return out.join('\n');
}

const DATA = { tr: {}, en: {} };
for (const [i, dil] of [[0, 'tr'], [1, 'en']]) {
  const T = DATA[dil];
  T.hudSol = 'frk-components';
  T.hookEtiket = dil === 'tr' ? 'CLAUDE CODE İLE' : 'BUILT WITH CLAUDE CODE';
  T.hookBaslik = 'FRK-COMPONENTS';
  T.hookNot = dil === 'tr' ? `${PARCALAR.length} arayüz parçası. Dokunulabilir, kare kare sarılır.` : `${PARCALAR.length} UI parts. Touchable, and they wind frame by frame.`;
  T.kapEtiket = dil === 'tr' ? 'AYNI DOSYA, ÜÇ İŞ' : 'ONE FILE, THREE JOBS';
  T.kapBaslik = dil === 'tr' ? 'TEK DOSYA' : 'ONE FILE';
  T.kapNot = dil === 'tr' ? 'Canlı demo · video sahnesi · kopyalanabilir kod.' : 'Live demo · video scene · copyable code.';
  T.kapSay = kapanis(dil);
  T.imza = 'FURKİ ÖZKAN · FRK-OS // 2026';
  PARCALAR.forEach((p, k) => {
    T[`p${k}.etiket`] = `// 0${k + 1} · ${p.ad}`;
    T[`p${k}.baslik`] = p.baslik[i];
    T[`p${k}.not`] = p.not[i];
    T[`p${k}.say`] = sayilar(p.ad, dil);
  });
}

const sahneHtml = PARCALAR.map((p, k) => `<div class="sahne" id="s${k + 1}">
<div class="etiket" data-m="p${k}.etiket"></div>
<div class="baslik" data-m="p${k}.baslik"></div>
<div class="kutu" id="k${k + 1}" style="left:${p.kutu[0]}px;top:${p.kutu[1]}px;width:${p.kutu[2]}px;height:${p.kutu[3]}px"></div>
<div class="not" data-m="p${k}.not"></div>
<div class="say" data-m="p${k}.say"></div>
</div>`).join('\n');

const html = `<!doctype html>
<html lang="tr" data-composition-variables='[{"id":"locale","type":"enum","label":"Dil","default":"tr","options":[{"value":"tr","label":"TR"},{"value":"en","label":"EN"}]}]'>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>frk-components — tanıtım</title>
${GSAP}
<style>
${fontFace}
html,body{margin:0;height:100%;background:#0e0d0b}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#0e0d0b;color:#f1ece2;font-family:"JetBrains Mono",monospace}
#grid{position:absolute;inset:0;background-image:linear-gradient(rgba(241,236,226,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(241,236,226,.045) 1px,transparent 1px);background-size:60px 60px}
#hud{position:absolute;left:96px;width:798px;top:120px;display:flex;justify-content:space-between;font-size:26px;color:#b9b4a8;letter-spacing:.08em;white-space:nowrap}
#hud i{font-style:normal;color:#ffc21a}
#prog{position:absolute;left:96px;width:798px;top:1790px;height:6px;background:#1a1712}
#progfill{height:100%;width:0;background:#ffc21a}
.sahne{position:absolute;inset:0;opacity:0;visibility:hidden}
#s0{opacity:1;visibility:visible}
.etiket{position:absolute;left:96px;top:236px;background:#ffc21a;color:#0e0d0b;padding:6px 16px;font-size:28px;letter-spacing:.1em;white-space:nowrap;opacity:0}
.baslik{position:absolute;left:96px;top:290px;width:800px;font:400 130px/1 "League Gothic",Impact,sans-serif;text-transform:uppercase;letter-spacing:.01em;color:#f1ece2;white-space:nowrap;opacity:0}
.hook .baslik{top:860px;font-size:150px}
.kutu{position:absolute}
.not{position:absolute;left:96px;top:1260px;width:798px;font-size:36px;line-height:1.35;color:#f1ece2;opacity:0}
.say{position:absolute;left:96px;top:1420px;width:798px;font-size:26px;line-height:1.5;color:#b9b4a8;white-space:pre-line;opacity:0}
.hook .not{top:1060px}
.kap .baslik{top:520px;font-size:200px}
.kap .not{top:760px}
.kap .say{top:900px}
#imza{position:absolute;left:96px;top:1560px;font-size:30px;letter-spacing:.1em;color:#ffc21a;opacity:0}
</style>
</head>
<body>
<div id="root" data-composition-id="vitrin-tanitim" data-start="0" data-duration="${SURE}" data-width="1080" data-height="1920">
<div id="grid"></div>
<div id="hud"><span data-m="hudSol"></span><span id="tc">00:00</span></div>
<div id="prog"><div id="progfill"></div></div>
<div class="sahne hook" id="s0">
<div class="etiket" data-m="hookEtiket"></div>
<div class="kutu" id="k0" style="left:60px;top:300px;width:960px;height:540px"></div>
<div class="baslik" data-m="hookBaslik"></div>
<div class="not" data-m="hookNot"></div>
</div>
${sahneHtml}
<div class="sahne kap" id="s${PARCALAR.length + 1}">
<div class="etiket" data-m="kapEtiket"></div>
<div class="baslik" data-m="kapBaslik"></div>
<div class="not" data-m="kapNot"></div>
<div class="say" data-m="kapSay"></div>
<div id="imza" data-m="imza"></div>
</div>
</div>
${PARCALAR.map((p) => `<script src="${p.ad}.js"></script>`).join('\n')}
<script>
(function () {
  var DATA = ${JSON.stringify(DATA).replace(/</g, '\\u003c')};
  var hf = window.__hyperframes, V = (hf && hf.getVariables && hf.getVariables()) || {};
  var L = V.locale === 'en' ? 'en' : 'tr', T = DATA[L];
  var m = document.querySelectorAll('[data-m]');
  for (var i = 0; i < m.length; i++) m[i].textContent = T[m[i].getAttribute('data-m')] || '';

  var C = [
    { id: 'k0', g: 'odometer', bas: 0, ofs: 0.15, opts: { seed: 3, value: ${PARCALAR.length}, locale: L, duration: 1.5 } },
${PARCALAR.map((p, k) => `    { id: 'k${k + 1}', g: '${p.g}', bas: ${p.bas}, ofs: ${p.ofs}, opts: ${p.opts} }`).join(',\n')}
  ];
  for (var c = 0; c < C.length; c++) { C[c].inst = FRKComponents[C[c].g].mount(document.getElementById(C[c].id), C[c].opts); C[c].son = -1; }

  var tc = document.getElementById('tc'), fill = document.getElementById('progfill');
  function guncelle(t) {
    for (var i = 0; i < C.length; i++) {
      var s = C[i], l = Math.min(Math.max(t - s.bas - s.ofs, 0), s.inst.duration);
      if (l !== s.son) { s.inst.seek(l); s.son = l; }
    }
    var sn = Math.floor(t), mm = ('0' + Math.floor(sn / 60)).slice(-2), ss = ('0' + (sn % 60)).slice(-2);
    tc.textContent = mm + ':' + ss;
    fill.style.width = (t / ${SURE} * 100).toFixed(3) + '%';
  }
  guncelle(0);

  window.__timelines = window.__timelines || {};
  if (window.gsap) {                                      // GSAP yoksa (çevrimdışı açılış) kayıt atlanır; sahneler ilk karede kalır
    gsap.config({ force3D: false });                    // 3B dönüşüm ↔ 2B geçişi katman/raster geçmişi yaratıyordu
    var P = { t: 0 }, tl = gsap.timeline({ paused: true });
    var SC = [
      { id: 's0', bas: ${HOOK.bas}, bit: ${HOOK.bas + HOOK.sure}, ilk: true, ogeler: ['#s0 .etiket', '#s0 .baslik', '#s0 .not'] },
${PARCALAR.map((p, k) => `      { id: 's${k + 1}', bas: ${p.bas}, bit: ${(p.bas + p.sure).toFixed(1)}, ogeler: ['#s${k + 1} .etiket', '#s${k + 1} .baslik', '#s${k + 1} .not', '#s${k + 1} .say'] }`).join(',\n')},
      { id: 's${PARCALAR.length + 1}', bas: ${KAPANIS.bas}, bit: ${SURE}, son: true, ogeler: ['#s${PARCALAR.length + 1} .etiket', '#s${PARCALAR.length + 1} .baslik', '#s${PARCALAR.length + 1} .not', '#s${PARCALAR.length + 1} .say', '#imza'] }
    ];
    SC.forEach(function (s) {
      var el = document.getElementById(s.id);
      if (!s.ilk) tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none', immediateRender: false }, s.bas);
      if (!s.son) tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, ease: 'none', immediateRender: false }, s.bit - 0.2);
      s.ogeler.forEach(function (sel, k) {
        tl.fromTo(sel, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', immediateRender: false }, s.bas + 0.12 + k * 0.12);
      });
    });
    tl.fromTo(P, { t: 0 }, { t: ${SURE}, duration: ${SURE}, ease: 'none', onUpdate: function () { guncelle(P.t); } }, 0);
    window.__timelines['vitrin-tanitim'] = tl;
  }
})();
</script>
</body>
</html>
`;

mkdirSync(join(d, 'fonts'), { recursive: true });
for (const p of PARCALAR) copyFileSync(join(kok, 'components', p.ad, p.ad + '.js'), join(d, p.ad + '.js'));
for (const f of FONTS) copyFileSync(join(kok, 'assets', 'fonts', f + '.woff2'), join(d, 'fonts', f + '.woff2'));
writeFileSync(join(d, 'index.html'), html);
writeFileSync(join(d, 'vars-tr.json'), '{"locale":"tr"}\n');
writeFileSync(join(d, 'vars-en.json'), '{"locale":"en"}\n');
console.log('hazır: vitrin-tanitim', existsSync(join(d, 'index.html')) ? '(index.html yazıldı)' : '');
console.log(JSON.stringify({ tr: DATA.tr['p0.say'], kapanis: DATA.tr.kapSay }));
