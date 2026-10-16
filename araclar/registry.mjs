// HyperFrames registry manifests: node araclar/registry.mjs [--denetle]
//
// WHY. KARNE.md's one "not equal" row against HyperFrames was the catalogue contract:
// every one of its 405 items ships a registry-item.json (name, type, dimensions,
// duration, files, preview), ours shipped none. This script writes one per part,
// next to its composition: deneme/<part>/registry-item.json.
//
// Nothing in a manifest is typed by hand. Each value is read from a file that
// already exists: dimensions and duration from the composition's #root data-*
// attributes, the files from what the composition actually loads (its component
// <script src> and its @font-face urls), the English title and summary from the
// root README's parts table and gallery, the preview from the committed renders.
//
// Every manifest is validated against the upstream schema, vendored unchanged as
// araclar/registry-item.schema.json (heygen-com/hyperframes, Apache-2.0,
// docs/schema/registry-item.json at 3a7fcd10e036ff0f5837821bb1143ca529934fae).
//
//   node araclar/registry.mjs            writes the manifests, then validates them
//   node araclar/registry.mjs --denetle  writes nothing: exit 1 if a manifest is
//                                        missing, stale or invalid
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SEMA = JSON.parse(readFileSync(join(kok, 'araclar', 'registry-item.schema.json'), 'utf8'));
const URI = /^[a-z][a-z0-9+.-]*:\/\/?[^\s]+$/i;

// --- a small JSON Schema reader: exactly the keywords the upstream schema uses ---------
const tipTut = (t, v) =>
  t === 'object' ? v !== null && typeof v === 'object' && !Array.isArray(v)
    : t === 'array' ? Array.isArray(v)
      : t === 'integer' ? Number.isInteger(v)
        : t === 'number' ? typeof v === 'number' && Number.isFinite(v)
          : typeof v === t;

/** Returns a list of "path: problem" strings; empty means valid. */
export function dogrula(sema, v, yol = '$') {
  const h = [];
  if (sema.type && !tipTut(sema.type, v)) return [`${yol}: ${sema.type} olmalı`];
  if (sema.const !== undefined && v !== sema.const) h.push(`${yol}: ${JSON.stringify(sema.const)} olmalı`);
  if (sema.enum && !sema.enum.includes(v)) h.push(`${yol}: şunlardan biri olmalı: ${sema.enum.join(', ')}`);
  if (typeof v === 'string') {
    if (sema.minLength !== undefined && v.length < sema.minLength) h.push(`${yol}: boş olamaz`);
    if (sema.pattern && !new RegExp(sema.pattern, 'u').test(v)) h.push(`${yol}: desen ${sema.pattern} tutmuyor`);
    if (sema.format === 'uri' && !URI.test(v)) h.push(`${yol}: URI değil`);
  }
  if (typeof v === 'number') {
    if (sema.minimum !== undefined && v < sema.minimum) h.push(`${yol}: en az ${sema.minimum}`);
    if (sema.exclusiveMinimum !== undefined && v <= sema.exclusiveMinimum) h.push(`${yol}: ${sema.exclusiveMinimum}'dan büyük olmalı`);
  }
  if (Array.isArray(v)) {
    if (sema.minItems !== undefined && v.length < sema.minItems) h.push(`${yol}: en az ${sema.minItems} öğe`);
    if (sema.items) v.forEach((x, i) => h.push(...dogrula(sema.items, x, `${yol}[${i}]`)));
  }
  if (tipTut('object', v)) {
    for (const k of sema.required || []) if (!(k in v)) h.push(`${yol}: zorunlu alan eksik: ${k}`);
    for (const [k, x] of Object.entries(v)) {
      if (sema.properties && sema.properties[k]) h.push(...dogrula(sema.properties[k], x, `${yol}.${k}`));
      else if (sema.additionalProperties === false) h.push(`${yol}: tanımsız alan: ${k}`);
    }
  }
  if (sema.not && dogrula(sema.not, v, yol).length === 0) h.push(`${yol}: yasak biçim (not)`);
  if (sema.anyOf && !sema.anyOf.some((s) => dogrula(s, v, yol).length === 0)) h.push(`${yol}: anyOf seçeneklerinin hiçbiri tutmuyor`);
  for (const s of sema.allOf || []) h.push(...dogrula(s, v, yol));
  if (sema.if) {
    const dal = dogrula(sema.if, v, yol).length === 0 ? sema.then : sema.else;
    if (dal) h.push(...dogrula(dal, v, yol));
  }
  return h;
}

// --- reading the facts each manifest is built from --------------------------------------
const metin = (p) => readFileSync(p, 'utf8');

/** EN title and summary per part, from the root README (parts table + gallery captions). */
function readmeBilgisi() {
  const r = metin(join(kok, 'README.md'));
  const ozet = {};
  for (const m of r.matchAll(/^\| \[`([a-z0-9-]+)`\]\([^)]*\) \| (.+?) \| [^|]+ \|$/gm)) {
    const parcalar = m[2].split(' / ');
    ozet[m[1]] = parcalar[parcalar.length - 1].trim();
  }
  const baslik = {};
  for (const m of r.matchAll(/<a href="components\/([a-z0-9-]+)\/demo\.html">.*?<sub>([^<]+)<br>/g)) {
    const p = m[2].split(' / ');
    baslik[m[1]] = p[p.length - 1].trim();
  }
  return { ozet, baslik };
}

/** What a composition really loads, and its declared size and length. */
export function kompozisyon(html) {
  const kokEtiket = /<div id="root"([^>]*)>/.exec(html);
  if (!kokEtiket) throw new Error('kompozisyonda #root yok');
  const nitelik = (ad) => {
    const m = new RegExp(`data-${ad}="([^"]+)"`).exec(kokEtiket[1]);
    return m ? m[1] : null;
  };
  const betikler = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/^https?:/.test(s));
  const yazitipleri = [...new Set([...html.matchAll(/url\((fonts\/[^)]+\.woff2)\)/g)].map((m) => m[1]))];
  return {
    id: nitelik('composition-id'),
    genislik: Number(nitelik('width')),
    yukseklik: Number(nitelik('height')),
    sure: Number(nitelik('duration')),
    betikler,
    yazitipleri,
  };
}

export function parcalar() {
  return readdirSync(join(kok, 'components'))
    .filter((p) => existsSync(join(kok, 'components', p, `${p}.js`)) && existsSync(join(kok, 'deneme', p, 'index.html')))
    .sort();
}

/** README fragments are lower-case phrases; a catalogue description is a sentence. */
const cumle = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/\.?$/, '.') : s);

const LISANS_DOSYASI = { 'league-gothic': 'LICENSE-league-gothic.txt', 'jetbrains-mono': 'LICENSE-jetbrains-mono.txt' };

export function manifest(p, bilgi = readmeBilgisi()) {
  const k = kompozisyon(metin(join(kok, 'deneme', p, 'index.html')));
  if (k.id !== p) throw new Error(`${p}: data-composition-id "${k.id}"`);
  const files = [{ path: 'index.html', target: `compositions/${p}.html`, type: 'hyperframes:composition' }];
  for (const s of k.betikler) {
    // The composition loads the derived copy hazirla.mjs makes; the manifest points at its source.
    if (!existsSync(join(kok, 'components', p, s))) throw new Error(`${p}: ${s} components/${p}/ altında yok`);
    files.push({ path: `../../components/${p}/${s}`, target: `compositions/${s}`, type: 'hyperframes:asset' });
  }
  const aileler = new Set();
  for (const f of k.yazitipleri) {
    const ad = f.slice('fonts/'.length);
    if (!existsSync(join(kok, 'assets', 'fonts', ad))) throw new Error(`${p}: assets/fonts/${ad} yok`);
    files.push({ path: `../../assets/${f}`, target: `compositions/${f}`, type: 'hyperframes:asset' });
    for (const aile of Object.keys(LISANS_DOSYASI)) if (ad.startsWith(aile)) aileler.add(aile);
  }
  // SIL OFL: the font licence travels with the font files.
  for (const aile of [...aileler].sort()) {
    files.push({ path: `../../assets/fonts/${LISANS_DOSYASI[aile]}`, target: `compositions/fonts/${LISANS_DOSYASI[aile]}`, type: 'hyperframes:asset' });
  }
  const item = {
    $schema: SEMA.$id,
    name: p,
    type: 'hyperframes:block',
    title: bilgi.baslik[p] || p,
    description: cumle(bilgi.ozet[p]),
    tags: ['frk-components', 'deterministic', 'seekable', 'tr-en'],
    author: 'Furkiozknn',
    license: 'MIT AND OFL-1.1',
    dimensions: { width: k.genislik, height: k.yukseklik },
    duration: k.sure,
    files,
  };
  const video = ['en', 'tr'].map((l) => `out/${p}-${l}.mp4`).find((v) => existsSync(join(kok, 'deneme', p, v)));
  if (video) item.preview = { video };
  return item;
}

const yaz = (o) => `${JSON.stringify(o, null, 2)}\n`;

function main() {
  const denetle = process.argv.includes('--denetle');
  const bilinmeyen = process.argv.slice(2).filter((a) => a !== '--denetle');
  if (bilinmeyen.length) {
    console.error(`bilinmeyen argüman: ${bilinmeyen.join(' ')} — kullanım: node araclar/registry.mjs [--denetle]`);
    process.exit(2);
  }
  const bilgi = readmeBilgisi();
  let sorun = 0;
  for (const p of parcalar()) {
    const hedef = join(kok, 'deneme', p, 'registry-item.json');
    const beklenen = yaz(manifest(p, bilgi));
    const hatalar = dogrula(SEMA, JSON.parse(beklenen));
    if (!denetle) writeFileSync(hedef, beklenen);
    const guncel = existsSync(hedef) && metin(hedef).replace(/\r\n/g, '\n') === beklenen;
    const durum = hatalar.length ? `✗ ${hatalar.length} şema hatası` : !guncel ? '✗ eski ya da yok (node araclar/registry.mjs)' : '✓ şemaya uyuyor';
    console.log(`${p.padEnd(18)} ${durum}`);
    for (const x of hatalar) console.log(`   ${x}`);
    if (hatalar.length || !guncel) sorun += 1;
  }
  process.exit(sorun ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
