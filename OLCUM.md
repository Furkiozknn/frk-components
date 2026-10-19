# Ölçümler

Bu tablo `node araclar/olcum-md.mjs` ile her parçanın `olcum.json` dosyasından üretilir; elle yazılmaz. `olcum.json` dosyaları `node araclar/olc.mjs components/<parça>/demo.html` koşusunun çıktısıdır.

Ortam: Chromium 153.0.8010.12, başsız, bu makine (Windows 11, masaüstü görünüm 900×1100). **Ölçülmedi:** gerçek telefon, Safari, Firefox, düşük güçlü cihaz. "Kare aralığı" başsız Chromium'un rAF ritmidir (60 Hz); bileşenin kendi maliyeti "seek ort." sütunudur.

| Parça | JS (bayt) | gzip (bayt) | FCP (ms) | LCP (ms) | seek ort./en çok (ms) | kare aralığı ort./p95 (ms) | axe ihlali | DOM determinizmi | piksel determinizmi | tohum | reduced-motion son kare | klavye | konsol hatası |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ilerleme-halkasi | 10.665 | 4.164 | 48 | 96 | 0,07 / 0,4 | 16,66 / 17,8 | 0 | evet | evet | evet | evet | evet | 0 |
| katki-isi | 9.966 | 3.950 | 32 | 72 | 0,138 / 1,3 | 16,56 / 17,8 | 0 | evet | evet | evet | evet | evet | 0 |
| kod-diff | 12.655 | 4.688 | 144 | 252 | 0,024 / 1,1 | 16,65 / 18 | 0 | evet | evet | evet | evet | evet | 0 |
| odometer | 8.532 | 3.461 | 184 | 184 | 0,035 / 0,6 | 16,59 / 17,9 | 0 | evet | evet | evet | evet | evet | 0 |
| prompt-terminal | 10.102 | 3.907 | 36 | 56 | 0,015 / 0,2 | 16,64 / 17,7 | 0 | evet | evet | evet | evet | evet | 0 |
| rope-swing | 15.605 | 5.725 | 32 | 52 | 0,067 / 0,9 | 16,66 / 17,9 | 0 | evet | evet | evet | evet | evet | 0 |
| status-orb | 18.242 | 6.948 | 140 | 292 | 2,411 / 7,4 | 16,65 / 18,1 | 0 | evet | evet | evet | evet | evet | 0 |

Notlar: `rope-swing` ve `status-orb` canvas olduklarından "DOM determinizmi" sütunu onlarda oyun/durum kaydının (JSON) ileri/ters/karışık karşılaştırmasıdır, "seek" sütunu yalnız JS tarafıdır (canvas boşaltma ayrıca `olcum.json`'da); ölçümleri `b1` oturumunun kendi betiğiyle alınmıştır.

Hedefler (TASARIM.md §6): JS ≤ 51.200 bayt, LCP ≤ 2500 ms, ortalama kare ≤ 16,7 ms, axe ihlali 0.

## Çapraz motor (Chromium · Firefox · WebKit)

Kaynak: deneme/CAPRAZ-MOTOR.json (b1 oturumunun betiği deneme/araclar/capraz-motor.mjs). chromium 153.0.8010.12, firefox 155.0, webkit 26.6; Playwright, Windows, başsız. **WebKit burada Playwright'ın Windows yapısıdır, Safari değildir.** Gerçek Safari/iOS, Android Chrome ve gerçek dokunmatik cihaz **ölçülmedi**.

| Parça | chromium 153.0.8010.12 | firefox 155.0 | webkit 26.6 |
|---|---|---|---|
| ilerleme-halkasi | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR 37,1–38,8 dB | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR hesaplanamadı (kare boyutu 480x480 ↔ 480x482) |
| katki-isi | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR 39,6–42,7 dB | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR 28,9–33,6 dB |
| kod-diff | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR 23,8–26,7 dB | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR 24,4–27,2 dB |
| odometer | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR 25,7–27,5 dB | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR 26–28,4 dB |
| prompt-terminal | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR 23,6–34,5 dB | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>PSNR 17,6–34 dB |
| rope-swing | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>durum JSON Chromium ile aynı<br>PSNR 42,4–50,4 dB | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>durum JSON Chromium ile aynı<br>PSNR hesaplanamadı (kare boyutu 648x365 ↔ 648x367) |
| status-orb | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>durum JSON Chromium ile aynı<br>PSNR 49,1–51,4 dB | determinizm evet<br>axe 0<br>konsol hatası 0<br>reduced-motion evet<br>durum JSON Chromium ile aynı<br>PSNR hesaplanamadı (kare boyutu 480x480 ↔ 480x482) |

Determinizm her motorun kendi içindedir (8 zaman noktası, ileri/ters/karışık sırada piksel ve durum aynı). Motorlar arası piksel eşitliği beklenmez ve yoktur (yazı tipi ve kenar yumuşatma farkı); PSNR yalnız farkın büyüklüğünü gösterir. Kare boyutu iki motorda 2 px farklı çıktığında PSNR hesaplanamadı.

## Yöntem

- **Boyut:** `fs` ile ham bayt ve gzip (seviye 9). Yalnız `.js` dosyası; `demo.html` ve yazı tipleri dışarıda.
- **İlk boyama:** `demo.html` `file://` ile açılır, `first-contentful-paint` ve `largest-contentful-paint`.
- **Determinizm:** 7 zaman noktası ileri, geri ve karışık sırayla `seek` edilir, `#stage` DOM'u (canvas varsa `toDataURL` ile pikseli) karşılaştırılır; son faz dahil 7 zaman noktasında ekran görüntüsü 4 farklı önceki durumdan (başa, ortaya, süre sonrasına, sona yakın bir ana atlayarak) gelinerek alınır ve bayt bayt karşılaştırılır; aynı tohumla iki mount aynı, farklı tohumla farklı kare üretmeli.
- **Kare maliyeti:** 600 `seek` çağrısının ortalama ve en yüksek süresi; `play()` ile tam bir oynatmada `frk:tick` aralıkları.
- **Erişilebilirlik:** axe-core 4.13.0, `t = 0`, `1,2`, `2,4` karelerinde.
- **Klavye:** gerçek tuş basışlarıyla: Tab sırası, Enter/Boşluk, `R`, kaydırıcı okları.
- **reduced-motion:** `reducedMotion: 'reduce'` bağlamında açılışta son kare görünür ve 600 ms sonra değişmez.
- **Kaynak taraması:** JS dosyasında `Math.random`, `Date.now`, `performance.now`, `new Date` aranır (hiçbirinin bulunmaması beklenir).
