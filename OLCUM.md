# Ölçümler

Bu tablo `node araclar/olcum-md.mjs` ile her parçanın `olcum.json` dosyasından üretilir; elle yazılmaz. `olcum.json` dosyaları `node araclar/olc.mjs components/<parça>/demo.html` koşusunun çıktısıdır.

Ortam: Chromium 153.0.8010.12, başsız, bu makine (Windows 11, masaüstü görünüm 900×1100). **Ölçülmedi:** gerçek telefon, Safari, Firefox, düşük güçlü cihaz. "Kare aralığı" başsız Chromium'un rAF ritmidir (60 Hz); bileşenin kendi maliyeti "seek ort." sütunudur.

| Parça | JS (bayt) | gzip (bayt) | FCP (ms) | LCP (ms) | seek ort./en çok (ms) | kare aralığı ort./p95 (ms) | axe ihlali | DOM determinizmi | piksel determinizmi | tohum | reduced-motion son kare | klavye | konsol hatası |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| katki-isi | 9.452 | 3.728 | 48 | 100 | 0,119 / 0,7 | 16,57 / 17,7 | 0 | evet | evet | evet | evet | evet | 0 |
| odometer | 7.206 | 2.923 | 80 | 200 | 0,029 / 0,3 | 16,52 / 17,7 | 0 | evet | evet | evet | evet | evet | 0 |
| prompt-terminal | 9.904 | 3.810 | 32 | 52 | 0,013 / 0,1 | 16,65 / 17,8 | 0 | evet | evet | evet | evet | evet | 0 |
| rope-swing | 15.172 | 5.531 | 44 | 80 | 0,123 / 1,5 | 16,6 / 18 | 0 | evet | evet | evet | evet | evet | 0 |
| status-orb | ölçülmedi | | | | | | | | | | | | |

Notlar: `rope-swing` canvas olduğundan "DOM determinizmi" sütunu onda oyun durumunun (JSON) ileri/ters/karışık karşılaştırmasıdır, "seek" sütunu yalnız JS tarafıdır (canvas boşaltma ayrıca `olcum.json`'da); ölçümü `b1` oturumunun kendi betiğiyle alınmıştır.

Hedefler (TASARIM.md §6): JS ≤ 51.200 bayt, LCP ≤ 2500 ms, ortalama kare ≤ 16,7 ms, axe ihlali 0.

## Yöntem

- **Boyut:** `fs` ile ham bayt ve gzip (seviye 9). Yalnız `.js` dosyası; `demo.html` ve yazı tipleri dışarıda.
- **İlk boyama:** `demo.html` `file://` ile açılır, `first-contentful-paint` ve `largest-contentful-paint`.
- **Determinizm:** 7 zaman noktası ileri, geri ve karışık sırayla `seek` edilir, `#stage` DOM'u karşılaştırılır; üç karede araya başka kareler çizilerek ekran görüntüsü iki kez alınır ve bayt bayt karşılaştırılır; aynı tohumla iki mount aynı, farklı tohumla farklı kare üretmeli.
- **Kare maliyeti:** 600 `seek` çağrısının ortalama ve en yüksek süresi; `play()` ile tam bir oynatmada `frk:tick` aralıkları.
- **Erişilebilirlik:** axe-core 4.13.0, `t = 0`, `1,2`, `2,4` karelerinde.
- **Klavye:** gerçek tuş basışlarıyla: Tab sırası, Enter/Boşluk, `R`, kaydırıcı okları.
- **reduced-motion:** `reducedMotion: 'reduce'` bağlamında açılışta son kare görünür ve 600 ms sonra değişmez.
- **Kaynak taraması:** JS dosyasında `Math.random`, `Date.now`, `performance.now`, `new Date` aranır (hiçbirinin bulunmaması beklenir).
