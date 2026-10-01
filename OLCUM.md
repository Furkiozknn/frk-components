# Ölçümler

Bu tablo `node araclar/olcum-md.mjs` ile her parçanın `olcum.json` dosyasından üretilir; elle yazılmaz. `olcum.json` dosyaları `node araclar/olc.mjs components/<parça>/demo.html` koşusunun çıktısıdır.

Ortam: Chromium 153.0.8010.12, başsız, bu makine (Windows 11, masaüstü görünüm 900×1100). **Ölçülmedi:** gerçek telefon, Safari, Firefox, düşük güçlü cihaz. "Kare aralığı" başsız Chromium'un rAF ritmidir (60 Hz); bileşenin kendi maliyeti "seek ort." sütunudur.

| Parça | JS (bayt) | gzip (bayt) | FCP (ms) | LCP (ms) | seek ort./en çok (ms) | kare aralığı ort./p95 (ms) | axe ihlali | DOM determinizmi | piksel determinizmi | tohum | reduced-motion son kare | klavye | konsol hatası |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| katki-isi | 9.966 | 3.950 | 32 | 72 | 0,132 / 1,2 | 16,58 / 17,7 | 0 | evet | evet | evet | evet | evet | 0 |
| odometer | 8.236 | 3.322 | 124 | 204 | 0,021 / 0,7 | 16,61 / 17,7 | 0 | evet | evet | evet | evet | evet | 0 |
| prompt-terminal | 10.102 | 3.907 | 36 | 56 | 0,017 / 0,2 | 16,65 / 17,9 | 0 | evet | evet | evet | evet | evet | 0 |
| rope-swing | 15.605 | 5.725 | 48 | 92 | 0,07 / 0,9 | 16,62 / 17,8 | 0 | evet | evet | evet | evet | evet | 0 |
| status-orb | 11.864 | 4.671 | 36 | 80 | 0,924 / 3,1 | 16,56 / 17,9 | 0 | evet | evet | evet | evet | bkz. olcum.json | 0 |

Notlar: `rope-swing` ve `status-orb` canvas olduklarından "DOM determinizmi" sütunu onlarda oyun/durum kaydının (JSON) ileri/ters/karışık karşılaştırmasıdır, "seek" sütunu yalnız JS tarafıdır (canvas boşaltma ayrıca `olcum.json`'da); ölçümleri `b1` oturumunun kendi betiğiyle alınmıştır.

Hedefler (TASARIM.md §6): JS ≤ 51.200 bayt, LCP ≤ 2500 ms, ortalama kare ≤ 16,7 ms, axe ihlali 0.

## Yöntem

- **Boyut:** `fs` ile ham bayt ve gzip (seviye 9). Yalnız `.js` dosyası; `demo.html` ve yazı tipleri dışarıda.
- **İlk boyama:** `demo.html` `file://` ile açılır, `first-contentful-paint` ve `largest-contentful-paint`.
- **Determinizm:** 7 zaman noktası ileri, geri ve karışık sırayla `seek` edilir, `#stage` DOM'u (canvas varsa `toDataURL` ile pikseli) karşılaştırılır; son faz dahil 7 zaman noktasında ekran görüntüsü 4 farklı önceki durumdan (başa, ortaya, süre sonrasına, sona yakın bir ana atlayarak) gelinerek alınır ve bayt bayt karşılaştırılır; aynı tohumla iki mount aynı, farklı tohumla farklı kare üretmeli.
- **Kare maliyeti:** 600 `seek` çağrısının ortalama ve en yüksek süresi; `play()` ile tam bir oynatmada `frk:tick` aralıkları.
- **Erişilebilirlik:** axe-core 4.13.0, `t = 0`, `1,2`, `2,4` karelerinde.
- **Klavye:** gerçek tuş basışlarıyla: Tab sırası, Enter/Boşluk, `R`, kaydırıcı okları.
- **reduced-motion:** `reducedMotion: 'reduce'` bağlamında açılışta son kare görünür ve 600 ms sonra değişmez.
- **Kaynak taraması:** JS dosyasında `Math.random`, `Date.now`, `performance.now`, `new Date` aranır (hiçbirinin bulunmaması beklenir).
