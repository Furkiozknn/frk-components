// Her parçanın olcum.json dosyasından OLCUM.md tablosunu üretir: node araclar/olcum-md.mjs
// Sayılar elle yazılmaz; olc.mjs koşusunun çıktısıdır.
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const dizin = join(kok, 'components');
const tr = (x, d = 3) => new Intl.NumberFormat('tr', { maximumFractionDigits: d }).format(x);
const kb = (b) => tr(b / 1024, 1);
const rows = [];
const uyari = [];
for (const ad of readdirSync(dizin).sort()) {
  const f = join(dizin, ad, 'olcum.json');
  if (!existsSync(f)) { rows.push({ ad, yok: true }); continue; }
  rows.push({ ad, m: JSON.parse(readFileSync(f, 'utf8')) });
}
const ok = (v) => (v ? 'evet' : 'HAYIR');
const tablo = [
  '| Parça | JS (bayt) | gzip (bayt) | FCP (ms) | LCP (ms) | seek ort./en çok (ms) | kare aralığı ort./p95 (ms) | axe ihlali | DOM determinizmi | piksel determinizmi | tohum | reduced-motion son kare | klavye | konsol hatası |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
];
for (const r of rows) {
  if (r.yok) { tablo.push(`| ${r.ad} | ölçülmedi | | | | | | | | | | | | |`); continue; }
  const m = r.m, d = m.determinizm, k = m.klavye, p = m.performans;
  const axe = m.erisilebilirlik.taramalar.reduce((s, x) => s + x.ihlal, 0);
  const dom = d.dom_ileri_geri_karisik_esit ?? d.durum_ileri_ters_karisik_esit;          // rope-swing: oyun durumu (JSON) karşılaştırması
  const pix = d.piksel_ayni_t_iki_cizim_esit ?? [d.piksel_ileri_ters_karisik_esit];
  const sAvg = p.seek_ort_ms ?? p.seek_js_ms?.ort, sMax = p.seek_max_ms ?? p.seek_js_ms?.maks;
  const klavye = k.oynat_enter
    ? k.oynat_enter[2] && k.r_bastan_oynatir && k.kaydirici_oynatmayi_durdurur && k.tab_sirasi.slice(0, 5).every((x) => x !== 'BODY')
    : k.bosluk_basili ? k.bosluk_basili.hooked && !k.bosluk_birakildi.hooked && k.p_ikinci_basis_oynuyor : null;
  if (sMax > 16.7) uyari.push(`- \`${r.ad}\`: seek en çok ${tr(sMax, 1)} ms; tek kare bütçesi (16,7 ms) aşılıyor${p.seek_js_ms?.p95 != null ? ` (p95 ${tr(p.seek_js_ms.p95, 1)} ms)` : ''}. Ortalama kare aralığı yine de ${tr(p.kare_araligi_ort_ms, 2)} ms.`);
  tablo.push(`| ${r.ad} | ${tr(m.boyut.js_bayt, 0)} | ${tr(m.boyut.js_gzip_bayt, 0)} | ${tr(m.ilk_boyama.fcp_ms, 0)} | ${tr(m.ilk_boyama.lcp_ms, 0)} | ${tr(sAvg)} / ${tr(sMax, 1)} | ${tr(p.kare_araligi_ort_ms, 2)} / ${tr(p.kare_araligi_p95_ms, 1)} | ${axe} | ${ok(dom)} | ${ok(pix.every(Boolean))} | ${ok(d.tohum_ayni_ayni && d.tohum_farkli_farkli)} | ${ok(m.reduced_motion.son_kare_gosterildi && m.reduced_motion.animasyon_yok)} | ${klavye === null ? 'bkz. olcum.json' : ok(klavye)} | ${m.konsol_hatasi.length} |`);
}
const tarayici = [...new Set(rows.filter((r) => r.m).map((r) => r.m.tarayici))].join(', ');
const md = `# Ölçümler

Bu tablo \`node araclar/olcum-md.mjs\` ile her parçanın \`olcum.json\` dosyasından üretilir; elle yazılmaz. \`olcum.json\` dosyaları \`node araclar/olc.mjs components/<parça>/demo.html\` koşusunun çıktısıdır.

Ortam: ${tarayici}, başsız, bu makine (Windows 11, masaüstü görünüm 900×1100). **Ölçülmedi:** gerçek telefon, Safari, Firefox, düşük güçlü cihaz. "Kare aralığı" başsız Chromium'un rAF ritmidir (60 Hz); bileşenin kendi maliyeti "seek ort." sütunudur.

${tablo.join('\n')}

Notlar: \`rope-swing\` ve \`status-orb\` canvas olduklarından "DOM determinizmi" sütunu onlarda oyun/durum kaydının (JSON) ileri/ters/karışık karşılaştırmasıdır, "seek" sütunu yalnız JS tarafıdır (canvas boşaltma ayrıca \`olcum.json\`'da); ölçümleri \`b1\` oturumunun kendi betiğiyle alınmıştır.${uyari.length ? '\n\n**Kare bütçesi uyarıları:**\n' + uyari.join('\n') : ''}

Hedefler (TASARIM.md §6): JS ≤ 51.200 bayt, LCP ≤ 2500 ms, ortalama kare ≤ 16,7 ms, axe ihlali 0.

## Yöntem

- **Boyut:** \`fs\` ile ham bayt ve gzip (seviye 9). Yalnız \`.js\` dosyası; \`demo.html\` ve yazı tipleri dışarıda.
- **İlk boyama:** \`demo.html\` \`file://\` ile açılır, \`first-contentful-paint\` ve \`largest-contentful-paint\`.
- **Determinizm:** 7 zaman noktası ileri, geri ve karışık sırayla \`seek\` edilir, \`#stage\` DOM'u (canvas varsa \`toDataURL\` ile pikseli) karşılaştırılır; son faz dahil 7 zaman noktasında ekran görüntüsü 4 farklı önceki durumdan (başa, ortaya, süre sonrasına, sona yakın bir ana atlayarak) gelinerek alınır ve bayt bayt karşılaştırılır; aynı tohumla iki mount aynı, farklı tohumla farklı kare üretmeli.
- **Kare maliyeti:** 600 \`seek\` çağrısının ortalama ve en yüksek süresi; \`play()\` ile tam bir oynatmada \`frk:tick\` aralıkları.
- **Erişilebilirlik:** axe-core 4.13.0, \`t = 0\`, \`1,2\`, \`2,4\` karelerinde.
- **Klavye:** gerçek tuş basışlarıyla: Tab sırası, Enter/Boşluk, \`R\`, kaydırıcı okları.
- **reduced-motion:** \`reducedMotion: 'reduce'\` bağlamında açılışta son kare görünür ve 600 ms sonra değişmez.
- **Kaynak taraması:** JS dosyasında \`Math.random\`, \`Date.now\`, \`performance.now\`, \`new Date\` aranır (hiçbirinin bulunmaması beklenir).
`;
writeFileSync(join(kok, 'OLCUM.md'), md);
console.log(md);
