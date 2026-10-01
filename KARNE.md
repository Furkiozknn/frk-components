# Karne — frk-components ↔ rakipler

Bu dosya `node araclar/karne.mjs` ile üretilir; sayılar elle yazılmaz. Rakip sütunu `D:\Claude Projeleri\raporlar\2026-10-02-rakip-analizi-bilesen-vitrinleri.md` raporundaki "Ölçütler ve hedefler" tablosundan alıntıdır (rapor 2026-10-01 ölçümüdür, burada yeniden doğrulanmadı). Bizim sütunumuz 7 parçanın `olcum.json` dosyalarından, dosya boyutlarından ve kaynak taramalarından gelir. Ortam: başsız Chromium/Firefox/WebKit, Windows, bu makine. Ölçemediğimiz hücrede "ölçülmedi" yazar.

**Parçalar:** `ilerleme-halkasi`, `katki-isi`, `kod-diff`, `odometer`, `prompt-terminal`, `rope-swing`, `status-orb`.

| Ölçüt | En iyi rakip (rapordan, kanıtıyla) | Bizim ölçülmüş değerimiz | Fark |
| --- | --- | --- | --- |
| **Demo açılış hızı / boyut** | Ship Notes: demo başına 9,9–50,2 KB ham HTML+JS (`gh api` ağacı), statik Pages. Diğerlerinin demoları ölçülmedi. | Bileşen JS 8,3 KB–15,2 KB; demo.html + JS 14,9 KB–22,5 KB (7 parça). Yazı tipleri ayrı ve paylaşılan: 44,7 KB (4 woff2). İlk boyama (başsız Chromium, file://, bu makine): LCP en çok 252 ms (hedef ≤ 2500). | Boyut: demo.html + JS tamamı Ship Notes aralığının üst sınırının (50,2 KB) altında; en küçüğümüz 14,9 KB (rakibin en küçüğü 9,9 KB). Not: rakip raporunda KB tanımı yok; burada 1 KB = 1024 bayt. LCP: rakipte ölçülmedi, fark hesaplanamaz. |
| **Bağımlılık sayısı** | Ship Notes: 0, tek dosya. Uiverse: saf CSS/Tailwind. Diğerleri React + Tailwind + Motion/GSAP. | Çalışma zamanı bağımlılığı 0: 7/7 parçada JS ve demo.html içinde harici URL yok; her parça tek JS dosyası. HyperFrames kompozisyonunda (deneme/) GSAP CDN etiketi var, bileşen dosyalarında yok. Demolar paylaşılan yazı tipi dosyalarını yükler. | Eşit (0 = 0). "Tek dosya" bileşen JS'i için doğru; demo sayfası yazı tipi dosyalarını ayrıca yükler. |
| **Mobil** | Ship Notes: 390 px Chromium testi beyanı, telefonda parçacık azaltma; gerçek telefon, Safari ve Firefox testi yok (README). Diğerleri ölçülmedi. | 7/7 parçada 390 px mobil emülasyonu (Chromium, dokunmatik): yatay taşma yok 7/7, en küçük dokunma hedefi 44 px. Çapraz motor: 21/21 parça × motor kombinasyonu temiz (chromium 153.0.8010.12, firefox 155.0, webkit 26.6; Playwright, Windows, başsız; WebKit Safari değildir). Gerçek iOS Safari, Android Chrome, gerçek dokunmatik cihaz: **ölçülmedi**. | Rakipte yalnız Chromium beyanı var; bizde Firefox ve WebKit motoru da ölçüldü (Safari değil). Gerçek telefonda ikimizde de ölçülmedi. |
| **Erişilebilirlik** | Ship Notes (Pull Lamp: klavye + reduced-motion beyanı), 21st.dev (Radix temelli beyan). Hiçbirinde ölçülmüş axe/Lighthouse sonucu görülmedi. | axe-core 4.13.0: 7 parça × birkaç kare = 21 taramada 0 ihlal. reduced-motion'da açılışta son kare 7/7. Klavye (gerçek tuş basışlarıyla, parçaya özgü kural) 7/7 geçti; ayrıntı olcum.json. Lighthouse: **ölçülmedi**. Ekran okuyucu ile gerçek dinleme: **ölçülmedi**. | Rakipte ölçülmüş sonuç bulunamadı (rapor: 9 README taraması); bizde ölçülmüş. Bu, rakibin erişilebilir olmadığı anlamına gelmez, ölçmediğimiz anlamına gelir. |
| **Video uyumu** | HyperFrames kataloğu: 405 öğe, registry-item.json (dimensions, duration, preview.video, params). React Bits: Background Studio'da video dışa aktarma. Ship Notes: gerçek zamanlı fizik, uyumsuz. | 8 parçanın HyperFrames kompozisyonu, 14 render (TR+EN, 30 fps, 150 kare); b1 raporu: lint ve check 0 bulgu. Kare determinizmi kanıtı (deneme/KANIT.json): 8 parçada: A (düz Chromium, ileri/ters/karışık/tekrar aynı) 7/8; B (HyperFrames snapshot ↔ düz Chromium bayt eşitliği) 7/8; C (1 işçi ↔ 2 işçi render, 150 kare) 8/8. HeyGen registry-item.json şemasına uyum: **yok** (yazılmadı). Kaynak taramasında yasak çağrı (`Math.random`, `Date.now`, `performance.now`, `new Date`) yok: 7/7. | Ölçek: 8 ↔ 405 öğe. Rakip raporu katalog öğesinde ölçüm/yapım kaydı alanı olmadığını söylüyor; kare determinizmi kanıtı araştırılmadı: ölçülmedi. Şema uyumu bizde yok; kataloğa PR ikinci aşamada, Furki'ye sorulur. Aynı dosya hem canlı demo hem render olarak çalışıyor. |
| **"Nasıl yapıldı" katmanı** | Rauno Freiberg: $249, 23 bölüm, indirilebilir kaynak. Emil Kowalski: animations.dev (13.000+ tamamlayan beyanı, 15 AI skill/prompt), skills deposu 42.665★. Codrops: makale + demo + kod. | 7/7 parçada RECETE.md, 7/7 tanesinde "Prompt kaydı" bölümü; ücretsiz, depoda. Prompt kaydı, oturumdaki ham girdilerdir (başlatan mesaj ve YONLENDIRME.md içindeki ilgili madde); ayrı bir sohbet dökümü değildir. Yolda bulunan hataları anlatan bölüm: 7/7. | Kapsam ve öğretici değer kıyası **ölçülmedi** (rakip içerikleri taranmadı, kalite sayıya dökülmedi). Fark yalnız: bizde her parçanın kendi yapım kaydı ücretsiz ve parçanın yanında. |
| **Dil (TR/EN)** | Yok: Türkçe vitrin bulunamadı; incelenen tüm ürün ve fiyat sayfaları yalnız İngilizce. | README TR+EN 7/7; demoda TR·EN düğmesi 7/7; kök index.html TR·EN; tanıtım render'ları TR ve EN (14 dosya). | Rakipte yok; bizde var. Türkçe ücretli pazar kanıtı yok: ölçülmedi. |
| **Lisans netliği** | MIT + LICENSE: Magic UI, Cult UI, Motion Primitives, Animata, Kokonut, Fancy, Ship Notes. Belirsiz: React Bits (Commons Clause), Codrops, Rauno interfaces, Hover. | Kökte LICENSE (MIT): var. İlk satırda SPDX-License-Identifier: MIT taşıyan JS 7/7. Pro/ücretli ayrım yok. | LICENSE'ta eşit. Dosya başına SPDX başlığı bizde ölçüldü; rakiplerde dosya başlıkları taranmadı: **ölçülmedi**. |

## Hedeflerimize karşı durum

| Hedef (rapordan) | Ölçüm | Durum |
| --- | --- | --- |
| Demo başına ≤ 50 KB ham | en büyük demo.html + JS 22,5 KB | karşılandı |
| LCP ≤ 2,5 sn | en yüksek 252 ms (başsız Chromium, yerel dosya; gerçek ağ ve cihaz değil) | karşılandı |
| 0 çalışma zamanı bağımlılığı, tek dosya | 7/7 parçada harici URL yok | karşılandı |
| axe-core 0 ihlal | 0 ihlal / 21 tarama | karşılandı |
| prefers-reduced-motion, klavye | reduced-motion 7/7; klavye 7/7 | karşılandı |
| 390 px + gerçek iOS Safari ve Android Chrome | 390 px emülasyon 7/7; gerçek telefon ölçülmedi | kısmen |
| Zamanı dışarıdan alan, HyperFrames'te kare kare render | determinizm 7/7, render kanıtı 8 parçada; HeyGen şeması yok | kısmen |
| Her parçada prompt kaydı + ölçüm tablosu | RECETE 7/7, olcum.json 7/7 | karşılandı |
| TR + EN | README 7/7 | karşılandı |
| MIT, her dosyada SPDX | SPDX 7/7, LICENSE var | karşılandı |

Rapordaki kural: bağımlılık ve boyutta Ship Notes'a eşit, video kontratında HeyGen'e eşit ol; geri kalanda (ölçüm, yapım kaydı, TR/EN) ayrış. Durum: boyut ve bağımlılıkta eşitlik **ölçüldü**; video kontratında kare determinizmi kanıtlandı ama HeyGen `registry-item.json` şeması ve kataloğun ölçeği (405 öğe) bizde yok, yani **eşit değiliz**; ölçüm, yapım kaydı ve TR/EN'de ayrışma ölçülmüş verilerle yazılı.

## Dikkat

- Rakip tarafı bir günlük, tek kişilik tarama; rakiplerin kendi demolarını biz ölçmedik. "Rakipte ölçülmedi" "rakip kötü" demek değildir.
- Bizim ölçümlerimiz kendi parçalarımız ve kendi araçlarımızla alındı (n = 7, tek makine, başsız tarayıcılar). Gerçek telefon, Safari, düşük güçlü cihaz, donanım GPU, Linux/macOS, ses ölçülmedi.
- Boyut kıyasında Ship Notes aralığı raporda "ham HTML+JS" diye geçer; KB tanımı yazılı değil.
