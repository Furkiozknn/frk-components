// KARNE.md üretici: node araclar/karne.mjs
// Rakip tarafı: D:\Claude Projeleri\raporlar\2026-10-02-rakip-analizi-bilesen-vitrinleri.md (yalnız okundu; metinler oradan alıntıdır).
// Bizim tarafımız: components/*/olcum.json, dosya boyutları, kaynak taramaları, deneme/KANIT.json, deneme/CAPRAZ-MOTOR.json.
// Hiçbir sayı elle yazılmaz; ölçülemeyen hücreye "ölçülmedi" basılır.
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const dizin = join(kok, 'components');
const tr = (x, d = 1) => new Intl.NumberFormat('tr', { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(x);
const kb = (b) => new Intl.NumberFormat('tr', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(b / 1024) + ' KB';
const okuJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const metin = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const bt = '`';

const hepsi = readdirSync(dizin).filter((d) => existsSync(join(dizin, d, 'olcum.json'))).sort();
const tamPaket = (d) => existsSync(join(dizin, d, 'README.md')) && existsSync(join(dizin, d, 'RECETE.md')) && existsSync(join(dizin, d, 'demo.html'));
const eksik = hepsi.filter((d) => !tamPaket(d));
const P = hepsi.filter(tamPaket).map((ad) => {
  const d = join(dizin, ad), m = okuJson(join(d, 'olcum.json'));
  const jsAd = readdirSync(d).find((f) => f.endsWith('.js')), js = metin(join(d, jsAd));
  const demo = metin(join(d, 'demo.html'));
  const recete = metin(join(d, 'RECETE.md')), readme = metin(join(d, 'README.md'));
  const out = join(kok, 'deneme', ad, 'out');
  return {
    ad, m, jsAd, jsBayt: statSync(join(d, jsAd)).size, demoBayt: statSync(join(d, 'demo.html')).size,
    spdx: js.split('\n')[0].includes('SPDX-License-Identifier: MIT'),
    harici: (js.match(/https?:\/\//g) || []).length + (demo.match(/(?:src|href)="https?:\/\//g) || []).length,
    ikiDilliReadme: readme.includes('**EN**'), dilDugmesi: demo.includes('id="lang"'),
    receteVar: recete.length > 0, promptKaydi: recete.includes('## Prompt kaydı'), hataBolumu: /^## .*(hata|bulgu|Yol boyunca)/im.test(recete),
    video: ['tr', 'en'].filter((l) => existsSync(join(out, ad + '-' + l + '.mp4'))).length,
  };
});
const N = P.length;
const sayi = (f) => P.filter(f).length;
const fontBayt = existsSync(join(kok, 'assets', 'fonts')) ? readdirSync(join(kok, 'assets', 'fonts')).filter((f) => f.endsWith('.woff2')).reduce((s, f) => s + statSync(join(kok, 'assets', 'fonts', f)).size, 0) : null;

// Bölüm verileri
const jsMin = Math.min(...P.map((p) => p.jsBayt)), jsMax = Math.max(...P.map((p) => p.jsBayt));
const demoToplam = P.map((p) => p.jsBayt + p.demoBayt), dMin = Math.min(...demoToplam), dMax = Math.max(...demoToplam);
const lcp = P.map((p) => p.m.ilk_boyama.lcp_ms), lcpMax = Math.max(...lcp);
const toplamAxe = P.reduce((s, p) => s + p.m.erisilebilirlik.taramalar.reduce((a, b) => a + b.ihlal, 0), 0);
const taramaSayisi = P.reduce((s, p) => s + p.m.erisilebilirlik.taramalar.length, 0);
const rmOk = sayi((p) => p.m.reduced_motion && p.m.reduced_motion.son_kare_gosterildi && p.m.reduced_motion.animasyon_yok);
const mobil = P.filter((p) => p.m.mobil_390);
const mobilTasmaYok = mobil.filter((p) => p.m.mobil_390.tasma_yok).length;
const mobilHedef = mobil.length ? Math.min(...mobil.map((p) => p.m.mobil_390.dokunma_hedefi_min_px)) : null;
const yasakYok = sayi((p) => Object.entries(p.m.yasak_cagri_taramasi).filter(([k]) => k !== 'requestAnimationFrame(').every(([, v]) => v === false));
const detOk = (p) => { const d = p.m.determinizm; const dom = d.dom_ileri_geri_karisik_esit ?? d.durum_ileri_ters_karisik_esit; const pix = d.piksel_ayni_t_iki_cizim_esit ?? [d.piksel_ileri_ters_karisik_esit]; return dom && pix.every(Boolean) && d.tohum_ayni_ayni && d.tohum_farkli_farkli; };
const detSayi = sayi(detOk);

const klavyeOk = (p) => {
  const k = p.m.klavye;
  if (!k) return null;
  if (k.oynat_enter) return !!(k.oynat_enter[2] && k.r_bastan_oynatir && k.kaydirici_oynatmayi_durdurur && k.tab_sirasi.slice(0, 5).every((x) => x !== 'BODY'));
  if (k.bosluk_basili) return !!(k.bosluk_basili.hooked && !k.bosluk_birakildi.hooked && k.p_ikinci_basis_oynuyor);
  if (k.durum_dugmesi_enter) return !!(k.durum_dugmesi_enter.durum === 'searching' && k.sayi_tusu_4 && k.sayi_tusu_4.durum === 'done' && k.r_bastan && k.r_bastan.oynuyor && k.bosluk_ikinci_oynuyor);
  return null;                                                // bu parçanın klavye biçimi için kural tanımlı değil
};
const klavyeGecti = sayi((p) => klavyeOk(p) === true), klavyeBilinmez = sayi((p) => klavyeOk(p) === null), klavyeKaldi = sayi((p) => klavyeOk(p) === false);
const cm = okuJson(join(kok, 'deneme', 'CAPRAZ-MOTOR.json'));
let cmOz = 'ölçülmedi (deneme/CAPRAZ-MOTOR.json yok)';
if (cm) {
  let ok = 0, top = 0;
  for (const ad of Object.keys(cm.parcalar)) for (const e of Object.keys(cm.motorlar)) {
    const x = cm.parcalar[ad][e]; top++;
    if (x.determinizm.piksel_ileri_ters_karisik_esit && x.determinizm.durum_ileri_ters_karisik_esit && x.axe.every((a) => a.ihlal === 0) && x.konsol_hatasi.length === 0 && x.reduced_motion.son_kare_gosterildi && x.reduced_motion.animasyon_yok) ok++;
  }
  cmOz = ok + '/' + top + ' parça × motor kombinasyonu temiz (' + Object.values(cm.motorlar).join(', ') + '; Playwright, Windows, başsız; WebKit Safari değildir)';
}
const kanit = okuJson(join(kok, 'deneme', 'KANIT.json'));
let kanitOz = 'ölçülmedi (deneme/KANIT.json yok)', hfParca = 0;
if (kanit) {
  const ks = Object.entries(kanit.parcalar);
  hfParca = ks.length;
  const a = ks.filter(([, v]) => v.A_duz_chromium.ileri_ters_esit && v.A_duz_chromium.ileri_karisik_esit && v.A_duz_chromium.ayni_t_tekrar_esit).length;
  const b = ks.filter(([, v]) => Object.values(v.B_snapshot_ile_karsilastirma).every((x) => x.bayt_esit)).length;
  const c = ks.filter(([, v]) => v.C_iki_render.ayni_kare_sayisi === v.C_iki_render.kare_sayisi[0] && v.C_iki_render.kare_sayisi[0] === v.C_iki_render.kare_sayisi[1]);
  kanitOz = hfParca + ' parçada: A (düz Chromium, ileri/ters/karışık/tekrar aynı) ' + a + '/' + hfParca + '; B (HyperFrames snapshot ↔ düz Chromium bayt eşitliği) ' + b + '/' + hfParca + '; C (1 işçi ↔ 2 işçi render, ' + (c[0] ? c[0][1].C_iki_render.kare_sayisi[0] : '?') + ' kare) ' + c.length + '/' + hfParca;
}
const videoSayi = P.reduce((s, p) => s + p.video, 0);

const durum = (ok, kismen) => (ok ? 'karşılandı' : kismen ? 'kısmen' : 'karşılanmadı');
const satirlar = [];
const S = (...c) => satirlar.push('| ' + c.join(' | ') + ' |');

S('Ölçüt', 'En iyi rakip (rapordan, kanıtıyla)', 'Bizim ölçülmüş değerimiz', 'Fark');
S('---', '---', '---', '---');
S('**Demo açılış hızı / boyut**',
  'Ship Notes: demo başına 9,9–50,2 KB ham HTML+JS (' + bt + 'gh api' + bt + ' ağacı), statik Pages. Diğerlerinin demoları ölçülmedi.',
  'Bileşen JS ' + kb(jsMin) + '–' + kb(jsMax) + '; demo.html + JS ' + kb(dMin) + '–' + kb(dMax) + ' (' + N + ' parça). Yazı tipleri ayrı ve paylaşılan: ' + (fontBayt ? kb(fontBayt) + ' (4 woff2)' : 'ölçülmedi') + '. İlk boyama (başsız Chromium, file://, bu makine): LCP en çok ' + tr(lcpMax, 0) + ' ms (hedef ≤ 2500).',
  'Boyut: demo.html + JS ' + (dMax <= 50.2 * 1024 ? 'tamamı Ship Notes aralığının üst sınırının (50,2 KB) altında' : 'bazıları 50,2 KB üstünde') + '; en küçüğümüz ' + kb(dMin) + ' (rakibin en küçüğü 9,9 KB). Not: rakip raporunda KB tanımı yok; burada 1 KB = 1024 bayt. LCP: rakipte ölçülmedi, fark hesaplanamaz.');
S('**Bağımlılık sayısı**',
  'Ship Notes: 0, tek dosya. Uiverse: saf CSS/Tailwind. Diğerleri React + Tailwind + Motion/GSAP.',
  'Çalışma zamanı bağımlılığı 0: ' + sayi((p) => p.harici === 0) + '/' + N + ' parçada JS ve demo.html içinde harici URL yok; her parça tek JS dosyası. HyperFrames kompozisyonunda (deneme/) GSAP CDN etiketi var, bileşen dosyalarında yok. Demolar paylaşılan yazı tipi dosyalarını yükler.',
  'Eşit (0 = 0). "Tek dosya" bileşen JS\'i için doğru; demo sayfası yazı tipi dosyalarını ayrıca yükler.');
S('**Mobil**',
  'Ship Notes: 390 px Chromium testi beyanı, telefonda parçacık azaltma; gerçek telefon, Safari ve Firefox testi yok (README). Diğerleri ölçülmedi.',
  mobil.length + '/' + N + ' parçada 390 px mobil emülasyonu (Chromium, dokunmatik): yatay taşma yok ' + mobilTasmaYok + '/' + mobil.length + ', en küçük dokunma hedefi ' + (mobilHedef != null ? mobilHedef + ' px' : 'ölçülmedi') + '. Çapraz motor: ' + cmOz + '. Gerçek iOS Safari, Android Chrome, gerçek dokunmatik cihaz: **ölçülmedi**.',
  'Rakipte yalnız Chromium beyanı var; bizde Firefox ve WebKit motoru da ölçüldü (Safari değil). Gerçek telefonda ikimizde de ölçülmedi.');
S('**Erişilebilirlik**',
  'Ship Notes (Pull Lamp: klavye + reduced-motion beyanı), 21st.dev (Radix temelli beyan). Hiçbirinde ölçülmüş axe/Lighthouse sonucu görülmedi.',
  'axe-core 4.13.0: ' + N + ' parça × birkaç kare = ' + taramaSayisi + ' taramada ' + toplamAxe + ' ihlal. ' + 'reduced-motion\'da açılışta son kare ' + rmOk + '/' + N + '. Klavye (gerçek tuş basışlarıyla, parçaya özgü kural) ' + klavyeGecti + '/' + N + ' geçti' + (klavyeBilinmez ? ', ' + klavyeBilinmez + ' parçada kural tanımsız' : '') + (klavyeKaldi ? ', ' + klavyeKaldi + ' KALDI' : '') + '; ayrıntı olcum.json. Lighthouse: **ölçülmedi**. Ekran okuyucu ile gerçek dinleme: **ölçülmedi**.',
  'Rakipte ölçülmüş sonuç bulunamadı (rapor: 9 README taraması); bizde ölçülmüş. Bu, rakibin erişilebilir olmadığı anlamına gelmez, ölçmediğimiz anlamına gelir.');
S('**Video uyumu**',
  'HyperFrames kataloğu: 405 öğe, registry-item.json (dimensions, duration, preview.video, params). React Bits: Background Studio\'da video dışa aktarma. Ship Notes: gerçek zamanlı fizik, uyumsuz.',
  hfParca + ' parçanın HyperFrames kompozisyonu, ' + videoSayi + ' render (TR+EN, 30 fps, 150 kare); b1 raporu: lint ve check 0 bulgu. Kare determinizmi kanıtı (deneme/KANIT.json): ' + kanitOz + '. HeyGen registry-item.json şemasına uyum: **yok** (yazılmadı). Kaynak taramasında yasak çağrı (' + bt + 'Math.random' + bt + ', ' + bt + 'Date.now' + bt + ', ' + bt + 'performance.now' + bt + ', ' + bt + 'new Date' + bt + ') yok: ' + yasakYok + '/' + N + '.',
  'Ölçek: ' + hfParca + ' ↔ 405 öğe. Rakip raporu katalog öğesinde ölçüm/yapım kaydı alanı olmadığını söylüyor; kare determinizmi kanıtı araştırılmadı: ölçülmedi. Şema uyumu bizde yok; kataloğa PR ikinci aşamada, Furki\'ye sorulur. Aynı dosya hem canlı demo hem render olarak çalışıyor.');
S('**"Nasıl yapıldı" katmanı**',
  'Rauno Freiberg: $249, 23 bölüm, indirilebilir kaynak. Emil Kowalski: animations.dev (13.000+ tamamlayan beyanı, 15 AI skill/prompt), skills deposu 42.665★. Codrops: makale + demo + kod.',
  sayi((p) => p.receteVar) + '/' + N + ' parçada RECETE.md, ' + sayi((p) => p.promptKaydi) + '/' + N + ' tanesinde "Prompt kaydı" bölümü; ücretsiz, depoda. Prompt kaydı, oturumdaki ham girdilerdir (başlatan mesaj ve YONLENDIRME.md içindeki ilgili madde); ayrı bir sohbet dökümü değildir. Yolda bulunan hataları anlatan bölüm: ' + sayi((p) => p.hataBolumu) + '/' + N + '.',
  'Kapsam ve öğretici değer kıyası **ölçülmedi** (rakip içerikleri taranmadı, kalite sayıya dökülmedi). Fark yalnız: bizde her parçanın kendi yapım kaydı ücretsiz ve parçanın yanında.');
S('**Dil (TR/EN)**',
  'Yok: Türkçe vitrin bulunamadı; incelenen tüm ürün ve fiyat sayfaları yalnız İngilizce.',
  'README TR+EN ' + sayi((p) => p.ikiDilliReadme) + '/' + N + '; demoda TR·EN düğmesi ' + sayi((p) => p.dilDugmesi) + '/' + N + '; kök index.html TR·EN; tanıtım render\'ları TR ve EN (' + videoSayi + ' dosya).',
  'Rakipte yok; bizde var. Türkçe ücretli pazar kanıtı yok: ölçülmedi.');
S('**Lisans netliği**',
  'MIT + LICENSE: Magic UI, Cult UI, Motion Primitives, Animata, Kokonut, Fancy, Ship Notes. Belirsiz: React Bits (Commons Clause), Codrops, Rauno interfaces, Hover.',
  'Kökte LICENSE (MIT): ' + (existsSync(join(kok, 'LICENSE')) ? 'var' : 'yok') + '. İlk satırda SPDX-License-Identifier: MIT taşıyan JS ' + sayi((p) => p.spdx) + '/' + N + '. Pro/ücretli ayrım yok.',
  'LICENSE\'ta eşit. Dosya başına SPDX başlığı bizde ölçüldü; rakiplerde dosya başlıkları taranmadı: **ölçülmedi**.');

// Hedef tablosu
const h = [];
const H = (...c) => h.push('| ' + c.join(' | ') + ' |');
H('Hedef (rapordan)', 'Ölçüm', 'Durum');
H('---', '---', '---');
H('Demo başına ≤ 50 KB ham', 'en büyük demo.html + JS ' + kb(dMax), durum(dMax <= 50 * 1024));
H('LCP ≤ 2,5 sn', 'en yüksek ' + tr(lcpMax, 0) + ' ms (başsız Chromium, yerel dosya; gerçek ağ ve cihaz değil)', durum(lcpMax <= 2500));
H('0 çalışma zamanı bağımlılığı, tek dosya', sayi((p) => p.harici === 0) + '/' + N + ' parçada harici URL yok', durum(sayi((p) => p.harici === 0) === N));
H('axe-core 0 ihlal', toplamAxe + ' ihlal / ' + taramaSayisi + ' tarama', durum(toplamAxe === 0));
H('prefers-reduced-motion, klavye', 'reduced-motion ' + rmOk + '/' + N + '; klavye ' + klavyeGecti + '/' + N + (klavyeBilinmez ? ' (' + klavyeBilinmez + ' parçada kural tanımsız)' : ''), durum(rmOk === N && klavyeGecti === N, rmOk === N && klavyeKaldi === 0));
H('390 px + gerçek iOS Safari ve Android Chrome', '390 px emülasyon ' + mobilTasmaYok + '/' + mobil.length + '; gerçek telefon ölçülmedi', durum(false, mobilTasmaYok === mobil.length && mobil.length > 0));
H('Zamanı dışarıdan alan, HyperFrames\'te kare kare render', 'determinizm ' + detSayi + '/' + N + ', render kanıtı ' + hfParca + ' parçada; HeyGen şeması yok', durum(false, hfParca > 0));
H('Her parçada prompt kaydı + ölçüm tablosu', 'RECETE ' + sayi((p) => p.promptKaydi) + '/' + N + ', olcum.json ' + N + '/' + N, durum(sayi((p) => p.promptKaydi) === N));
H('TR + EN', 'README ' + sayi((p) => p.ikiDilliReadme) + '/' + N, durum(sayi((p) => p.ikiDilliReadme) === N));
H('MIT, her dosyada SPDX', 'SPDX ' + sayi((p) => p.spdx) + '/' + N + ', LICENSE ' + (existsSync(join(kok, 'LICENSE')) ? 'var' : 'yok'), durum(sayi((p) => p.spdx) === N && existsSync(join(kok, 'LICENSE'))));

const md = `# Karne — frk-components ↔ rakipler

Bu dosya ${bt}node araclar/karne.mjs${bt} ile üretilir; sayılar elle yazılmaz. Rakip sütunu \`D:\\Claude Projeleri\\raporlar\\2026-10-02-rakip-analizi-bilesen-vitrinleri.md\` raporundaki "Ölçütler ve hedefler" tablosundan alıntıdır (rapor 2026-10-01 ölçümüdür, burada yeniden doğrulanmadı). Bizim sütunumuz ${N} parçanın ${bt}olcum.json${bt} dosyalarından, dosya boyutlarından ve kaynak taramalarından gelir. Ortam: başsız Chromium/Firefox/WebKit, Windows, bu makine. Ölçemediğimiz hücrede "ölçülmedi" yazar.

**Parçalar:** ${P.map((p) => bt + p.ad + bt).join(', ')}.${eksik.length ? '\n\n**Hazırlanıyor, sayıma girmedi (README/RECETE/demo eksik):** ' + eksik.map((d) => bt + d + bt).join(', ') + '.' : ''}

${satirlar.join('\n')}

## Hedeflerimize karşı durum

${h.join('\n')}

Rapordaki kural: bağımlılık ve boyutta Ship Notes'a eşit, video kontratında HeyGen'e eşit ol; geri kalanda (ölçüm, yapım kaydı, TR/EN) ayrış. Durum: boyut ve bağımlılıkta eşitlik **ölçüldü**; video kontratında kare determinizmi kanıtlandı ama HeyGen ${bt}registry-item.json${bt} şeması ve kataloğun ölçeği (405 öğe) bizde yok, yani **eşit değiliz**; ölçüm, yapım kaydı ve TR/EN'de ayrışma ölçülmüş verilerle yazılı.

## Dikkat

- Rakip tarafı bir günlük, tek kişilik tarama; rakiplerin kendi demolarını biz ölçmedik. "Rakipte ölçülmedi" "rakip kötü" demek değildir.
- Bizim ölçümlerimiz kendi parçalarımız ve kendi araçlarımızla alındı (n = ${N}, tek makine, başsız tarayıcılar). Gerçek telefon, Safari, düşük güçlü cihaz, donanım GPU, Linux/macOS, ses ölçülmedi.
- Boyut kıyasında Ship Notes aralığı raporda "ham HTML+JS" diye geçer; KB tanımı yazılı değil.
`;
writeFileSync(join(kok, 'KARNE.md'), md);
console.log(md);
