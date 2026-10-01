# deneme — HyperFrames sonucu

Altı parça (`odometer`, `prompt-terminal`, `rope-swing`, `status-orb`, `katki-isi`, `ilerleme-halkasi`) için 5 saniyelik HyperFrames kompozisyonu yazıldı, denetlendi ve render edildi. Sayıların hepsi bu klasördeki betiklerin koşusundan: `kos.mjs` (lint/check/snapshot/render), `kanit.mjs` (determinizm, `KANIT.json`), `araclar/olc-parca.mjs` (canvas parçaların ölçümü). Makine: Windows 11, 8 GB RAM, HyperFrames 0.8.85, Chromium 153.

## Nasıl çalışıyor

- `node deneme/hazirla.mjs` her parça için `deneme/<parca>/index.html` (kompozisyon), `vars-tr.json`, `vars-en.json` üretir; bileşen JS'ini ve yazı tiplerini `components/` ve `assets/`'ten kopyalar (kopyalar türevdir, commit edilmez). Aynı bileşen dosyası demoda da kopyalanabilir kod olarak da burada da kullanılır.
- Kompozisyon: `<div id="root" data-composition-id=… data-duration="5" data-width data-height>` (1080×1080; rope-swing 1920×1080), GSAP 3.14.2 CDN etiketi (SRI'lı), bileşen harici `<script src>`. Köprü proxy tween'dir; `if (window.gsap)` ile korunur, GSAP yoksa bileşen yine çalışır:

```js
window.__timelines['odometer'] = gsap.timeline({ paused: true })
  .fromTo(P, { t: 0 }, { t: 5, duration: 5, ease: 'none', onUpdate: function () { inst.seek(P.t + t0); } }, 0);
```

- Dil: kökte `data-composition-variables` (`locale`), render `--variables-file vars-tr.json|vars-en.json`; bileşen `window.__hyperframes.getVariables()` okur. TR ve EN karelerinin gerçekten farklı çıktığı odometre (`167.829` / `167,829`) ve status-orb (`bitti` / `done`) karelerinde gözle görüldü.
- Süre kuralı: `data-duration` yarı açık aralıktır (son kare `D − 1/fps`); animasyon `D`'den önce biter: odometre 3,6 sn, prompt-terminal 4,5 sn, katki-isi 4,5 sn, status-orb 3 sn'de son durum. rope-swing 0,3 sn kaydırılmış (otopilot 4,86 sn'de bitirir; video 0,3–5,3 sn'lik simülasyon aralığını gösterir).
- Komutlar (bu makinede `npx hyperframes` değil, eklentinin başlatıcısı): `node …/hyperframes/skills/hyperframes/scripts/plugin-cli.mjs lint|check|snapshot|render` proje klasöründen; `--no-browser-gpu`, işçi ≤ 2. Render günlükleri düşük bellek profilini ("screenshot capture") seçti.

## Sonuçlar

| Parça | Tuval | `lint` | `check` (lint / runtime / layout / motion / contrast) | render TR | render EN |
|---|---|---|---|---|---|
| odometer | 1080×1080 | 0 | 0 / 0 / 0 / 0 / 0 | 9,1 sn, 1,03 MB | 7,9 sn, 1,03 MB |
| prompt-terminal | 1080×1080 | 0 | 0 / 0 / 0 / 0 / 0 | 7,1 sn, 0,33 MB | 8,0 sn, 0,31 MB |
| rope-swing | 1920×1080 | 0 | 0 / 0 / 0 / 0 / 0 | 8,4 sn, 0,75 MB | 8,5 sn, 0,76 MB |
| status-orb | 1080×1080 | 0 | 0 / 0 / 0 / 0 / 0 | 9,7 sn, 4,49 MB | 9,2 sn, 4,50 MB |
| katki-isi | 1080×1080 | 0 | 0 / 0 / 0 / 0 / 0 | 7,2 sn, 0,30 MB | 7,8 sn, 0,33 MB |
| ilerleme-halkasi | 1080×1080 | 0 | 0 / 0 / 0 / 0 / 0 | 10,3 sn, 0,56 MB | 9,0 sn, 0,56 MB |

`check` kontrast denetimi yalnız DOM metnine bakar: odometre 5/5, prompt-terminal 25/25 örnek geçti. Canvas parçalarda (rope-swing, status-orb, katki-isi) denetlenecek DOM metni yok; orada 0/0, "geçti" değil "görmedi" demek. rope-swing ve status-orb canvas metin renklerinin zemin `#0e0d0b` üstündeki WCAG oranı ayrıca hesaplandı: `#b9b4a8` HUD 9,40:1, `#f1ece2` 16,50:1, `#ffc21a` 12,01:1, `#19d3e6` 10,64:1, `#ff7a1a` 7,45:1, `#ff4d6d` 6,04:1 (hepsi ≥ 4,5:1). katki-isi'nin canvas renkleri ayrıca hesaplanmadı.

Hepsi H.264, 30 fps, 150 kare, 5,000 sn (`ffprobe`). Render süresi = HyperFrames'in `totalElapsedMs`'i (yakalama ~6–8 sn, kodlama ~1–1,6 sn). `check` sayıları `log/check.txt`, render günlükleri `log/render-*.txt`.

## Seek determinizmi kanıtı (`KANIT.json`)

Üç ayrı soru, hepsi kare karşılaştırmasıyla:

- **A. Aynı `t`, farklı geliş yolu.** Kompozisyon düz Chromium'da açılır; HyperFrames'in yaptığı gibi `tl.totalTime(t, false)` ile 7 zamana (0, 0,4, 1,2, 2,5, 3,3, 4,1, 4,8 sn) ileri, ters ve karışık sırada gidilir; kök öğenin ekran görüntüleri SHA-256 ile karşılaştırılır.
- **B. HyperFrames karesi ↔ düz Chromium karesi.** `snapshot` PNG'si ile aynı `t`'nin düz Chromium PNG'si bayt bayt karşılaştırılır (1,2 / 2,5 / 4,8 sn).
- **C. İki render.** Aynı kompozisyon `--workers 2` ve `--workers 1` ile render edilir; çözülmüş 150 karenin MD5'leri karşılaştırılır.

| Parça | A: ileri = ters | A: ileri = karışık | A: aynı `t` tekrar | B: bayt eşit | C: aynı kare |
|---|---|---|---|---|---|
| odometer | evet | evet | evet | 3/3 | 150/150 |
| prompt-terminal | evet | evet | evet | 3/3 | 150/150 |
| rope-swing | evet | evet | evet | 3/3 | 150/150 |
| status-orb | evet | evet | evet | 3/3 | 150/150 |
| katki-isi | evet | evet | evet | 3/3 | 150/150 |
| ilerleme-halkasi | evet | evet | evet | 3/3 | 150/150 |

Bu tablo, odometre düzeltildikten sonraki koşudan. İlk koşuda odometre A'da 1/7 zamanda (yalnız `t = 3,3` sn, oturma darbesi aralığı) geliş yoluna bağlı çıkmıştı: 2,5 → 3,3 ile 4,1 → 3,3 farklı piksel veriyordu (PSNR 55,48 dB, sub-piksel kenar yumuşatma), bir C koşusunda 149/150 kare aynıydı (fark 2. karede, 93 dB). `will-change: transform` kaldırmak ve `translate3d` yerine `translateY` kullanmak farkı gidermedi; bileşen sahibi oturma darbesini `row`'daki `transform: scale()` yerine `font-size` yüzdesiyle yapınca fark kayboldu. Bu, kare karşılaştırmasının bir bileşende gerçek bir geçmiş bağımlılığı yakaladığı örnek.

## Yol boyunca bulunanlar

1. **`check` odometrede layout hatası verdi.** (Ayrı bir bulgu olarak oturma darbesi geçmiş bağımlılığı yukarıda.) League Gothic'te "2" rakamı 156 px, sütun `1ch` = 152 px olduğu için 4 px taşıyordu; ekran dışı şerit rakamları `canvas_overflow` uyarısı üretiyordu. Bileşen sahibi sütun genişliğini en geniş rakama göre ölçecek ve şeride `data-layout-ignore` verecek şekilde düzeltti; sonra `check` 0 bulgu verdi.
2. **Yalnız ekran okuyucu için gizlenen metinler `clipped_text` hatası verdi** (rope-swing ipucu/durum bölgesi, status-orb durum bölgesi). Öğelere `data-layout-ignore`, tam kenarlı rope-swing canvas'ına `data-layout-allow-overflow` eklendi.
3. **Canvas metninde unicode-range yazı tipi alt kümeleri tembel yükleniyor.** `İ`, `ş`, `ü` gibi latin-ext harfler ilk çizimde yedek yazı tipiyle çıkıyor, alt küme gelince değişiyordu (rope-swing "BİTTİ", status-orb "düşünüyor"); A testinde "ilk ziyaret farklı, sonrakiler aynı" olarak göründü. `document.fonts.load(font)` yalnız boşluk karakterini yükler. Çözüm: `document.fonts.load(font, çizilecek-bütün-metin)` ile alt kümeyi önceden yüklemek; düzeltmeden sonra dört sıralamanın hepsi aynı, B 3/3.
4. **Düz tarayıcıda açılış.** HyperFrames `window.__timelines` kayıt nesnesini kendisi kurar; düz tarayıcıda kurmaz, bu yüzden köprüden önce `window.__timelines = window.__timelines || {}` gerekti. `html, body { height: 100% }` olmadan kök öğe 0 yükseklikte kalıyor.
5. **`lint` harici yerel JS'i taramıyor.** `odometer.js` içindeki doğrudan `requestAnimationFrame(` çağrısı `lint` hatası vermedi; yine de rope-swing ve status-orb dolaylı erişim (`global['requestAnimationFrame']`) kullanıyor, çünkü kompozisyona satır içi gömülürse HyperFrames bunu hata sayar.

## Çapraz motor (`CAPRAZ-MOTOR.json`)

`araclar/capraz-motor.mjs` her parçanın `demo.html`'ini Playwright'ın üç motorunda açar: Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6 (Playwright'ın Windows yapısı; **Safari değildir**). Başsız, bu makine, masaüstü. Üç motor × altı parça = 18 kombinasyonun hepsinde:

- Kendi içinde determinizm: 8 zaman noktası × ileri / ters / karışık sırada ekran görüntüleri ve durum aynı.
- axe-core: 3 karede 0 ihlal. Konsol/sayfa hatası yok.
- `prefers-reduced-motion: reduce`: açılışta son kare, 600 ms sonra değişmiyor.
- rope-swing fizik durumu (konum, hız, kanca, sayaçlar; 8 zamanda tam hassasiyetli JSON) Firefox ve WebKit'te Chromium ile **bit düzeyinde aynı**; çekirdek yalnız `+ − × ÷ √` kullandığı için beklenen buydu, şimdi üç motorda ölçüldü. status-orb durum adları da aynı.

Motorlar arası piksel eşitliği iddia edilmez: yazı tipi rasterı, kenar yumuşatma ve metin motoru farklı. Chromium'a göre PSNR (aynı boyutlu karelerde): odometer 24,5–27,8 dB, prompt-terminal 17,6–34,5 dB, katki-isi 28,9–42,7 dB, rope-swing Firefox 42,4–50,4 dB, status-orb Firefox 49,1–51,4 dB, ilerleme-halkasi Firefox 37,1–38,8 dB. WebKit'te rope-swing, status-orb ve ilerleme-halkasi karelerinin yüksekliği 2 px farklı çıktı (648×365 ↔ 648×367, 480×480 ↔ 480×482), PSNR hesaplanamadı.

## Ölçülmedi / sınırlar

- Yalnız bu makinede (Windows, GPU'suz yazılım yakalama, düşük bellek profili) koşuldu; Linux/macOS ve donanım GPU modu denenmedi. Gerçek Safari/iOS, Android Chrome ve gerçek dokunmatik cihaz ölçülmedi.
- Yalnız 5 sn'lik kompozisyonlar; uzun render, ses, hareket bulanıklığı (`--motion-blur`; açılırsa örnekleme seek'leri olayları bastırır ve köprü sessizce çalışmaz) denenmedi.
- GSAP CDN'den geliyor: ilk render ağ (ya da önbellek) ister. GSAP'siz yol (`data-no-timeline` + `hf-seek` olayı) yalnız kod okumayla incelendi, denenmedi.
- `check`/render sonuçları o günün bileşen dosyalarıyla; bileşen değişirse `node deneme/hazirla.mjs && node deneme/kos.mjs hepsi tumu` yeniden koşulmalı.
- Gerçek bir videonun (ses, geçişler, gerçek içerik) kalitesi bu denemenin konusu değil: amaç aynı dosyanın kare kare sarılabildiğini göstermek.

## Yeniden üretmek için

```
node deneme/hazirla.mjs                     # kompozisyonları ve türev kopyaları üret
node deneme/kos.mjs hepsi tumu              # check + snapshot + render (TR), kilitli
node deneme/kos.mjs hepsi render-en         # EN render
node deneme/kanit.mjs                       # determinizm kanıtı → deneme/KANIT.json
node deneme/araclar/olc-parca.mjs components/rope-swing/demo.html   # canvas parça ölçümü
```
