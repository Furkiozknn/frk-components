// HyperFrames deneme projelerini üretir: node deneme/hazirla.mjs [parca ...]
// Her parça için deneme/<parca>/ içine index.html (kompozisyon), vars-tr.json, vars-en.json yazar; bileşen JS'ini ve
// yazı tipi dosyalarını components/ ve assets/'ten kopyalar. Kopyalar türevdir, commit edilmez (.gitignore).
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const SURE = 5;                                           // saniye; son kare SURE - 1/fps
const GSAP = '<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js" integrity="sha384-sG0Hv1tP1lZCk9KQmrIbY/XNwi+OY84GQqhMscbnsoBFqAz8KNCil1kvfL3Hbbk2" crossorigin="anonymous"></script>';
const FONTS = ['league-gothic-latin-400-normal', 'league-gothic-latin-ext-400-normal', 'jetbrains-mono-latin-400-normal', 'jetbrains-mono-latin-ext-400-normal'];
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const fontFace = FONTS.map((f) => {
  const fam = f.startsWith('league') ? 'League Gothic' : 'JetBrains Mono';
  return `@font-face{font-family:"${fam}";src:url(fonts/${f}.woff2) format("woff2");unicode-range:${f.includes('-ext-') ? EXT : LATIN}}`;
}).join('\n');

// Parça ayarları: global ad, tuval, bileşen seçenekleri (kodda L = dil), t kayması (t0, sn)
const PARCALAR = {
  'odometer': { g: 'odometer', w: 1080, h: 1080, t0: 0, opts: '{ seed: 1, value: 167829, locale: L, duration: 3.6 }' },
  'prompt-terminal': { g: 'promptTerminal', w: 1080, h: 1080, t0: 0, opts: '{ seed: 1, locale: L, duration: 4.5 }' },
  'rope-swing': { g: 'ropeSwing', w: 1920, h: 1080, t0: 0.3, opts: '{ seed: 1, locale: L, duration: 6 }' },
  'status-orb': { g: 'statusOrb', w: 1080, h: 1080, t0: 0, opts: "{ seed: 1, locale: L, label: true, duration: 5, states: [[0, 'listening'], [1, 'thinking'], [2, 'searching'], [3, 'done']] }" },
  'katki-isi': { g: 'katkiIsi', w: 1080, h: 1080, t0: 0, opts: '{ seed: 1, locale: L, duration: 4.5 }' },
  'ilerleme-halkasi': { g: 'ilerlemeHalkasi', w: 1080, h: 1080, t0: 0, opts: '{ seed: 1, locale: L, value: 72, duration: 3 }' },
};

function sayfa(ad, p) {
  return `<!doctype html>
<html lang="tr" data-composition-variables='[{"id":"locale","type":"enum","label":"Dil","default":"tr","options":[{"value":"tr","label":"TR"},{"value":"en","label":"EN"}]}]'>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${p.w}, height=${p.h}" />
<title>${ad} — frk-components</title>
${GSAP}
<style>
${fontFace}
html,body{margin:0;height:100%;background:#0e0d0b}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#0e0d0b}
#sahne{position:absolute;inset:0}
</style>
</head>
<body>
<div id="root" data-composition-id="${ad}" data-start="0" data-duration="${SURE}" data-width="${p.w}" data-height="${p.h}">
<div id="sahne"></div>
</div>
<script src="${ad}.js"></script>
<script>
(function () {
  var hf = window.__hyperframes, V = (hf && hf.getVariables && hf.getVariables()) || {};
  var L = V.locale === 'en' ? 'en' : 'tr';
  var inst = FRKComponents.${p.g}.mount(document.getElementById('sahne'), ${p.opts});
  window.__timelines = window.__timelines || {};
  if (window.gsap) {                                      // GSAP yoksa (çevrimdışı açılış) kayıt atlanır; bileşen yine çalışır
    var P = { t: 0 };
    window.__timelines['${ad}'] = gsap.timeline({ paused: true })
      .fromTo(P, { t: 0 }, { t: ${SURE}, duration: ${SURE}, ease: 'none', onUpdate: function () { inst.seek(P.t + ${p.t0}); } }, 0);
  }
})();
</script>
</body>
</html>
`;
}

const istenen = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PARCALAR);
for (const ad of istenen) {
  const p = PARCALAR[ad];
  if (!p) throw new Error('bilinmeyen parça: ' + ad);
  const d = join(kok, 'deneme', ad);
  mkdirSync(join(d, 'fonts'), { recursive: true });
  copyFileSync(join(kok, 'components', ad, ad + '.js'), join(d, ad + '.js'));
  for (const f of FONTS) copyFileSync(join(kok, 'assets', 'fonts', f + '.woff2'), join(d, 'fonts', f + '.woff2'));
  writeFileSync(join(d, 'index.html'), sayfa(ad, p));
  writeFileSync(join(d, 'vars-tr.json'), '{"locale":"tr"}\n');
  writeFileSync(join(d, 'vars-en.json'), '{"locale":"en"}\n');
  console.log('hazır:', ad);
}
