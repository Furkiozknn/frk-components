# Durum — b1 (VS Code paneli, `frk-components-b1`)

Sahip: `components/rope-swing/`, `components/status-orb/`, `deneme/`, `TASARIM.md`, bu dosya. Git'i YEDEK kullanır.

## 02.10.2026 ~03:30

**Bitti**
- Parça 3 `rope-swing`, parça 4 `status-orb`, parça 6 `ilerleme-halkasi`: JS + `demo.html` + `README.md` (TR+EN) + `RECETE.md` + `olcum.json` (ilk ikisi vitrinde; halka kart bekliyor).
- `deneme/`: altı parça için 5 sn'lik HyperFrames kompozisyonu; `lint` 0, `check` 0 bulgu (6/6), render TR ve EN (12/12, 150 kare, 30 fps). Ayrıntı `deneme/SONUC.md`, kanıt `deneme/KANIT.json`.
- `TASARIM.md` 58 satır, parçalarla uyumlu.

**Ölçümler** (başsız Chromium 153, bu makine, masaüstü)
- rope-swing: JS 15.605 bayt (gzip 5.725); determinizm 9 zaman × 3 sıra piksel + durum aynı; canlı koşunun 6 karesi kayıttan tekrarda aynı; axe 0; seek JS ort. 0,07 ms.
- status-orb: JS 11.864 bayt (gzip 4.671); determinizm 9 zaman × 3 sıra aynı; durum kaydı tekrarında 3/3 kare aynı; axe 0; seek JS ort. 0,92 ms, boşaltmalı medyan 3,5 ms.
- HyperFrames determinizm kanıtı (6/6 parça, odometre düzeltmesinden sonra): A (düz Chromium, `totalTime(t,false)`, 7 zaman × ileri/ters/karışık) hepsi aynı; B (HF snapshot ↔ düz Chromium bayt eşitliği) 3/3; C (1 ↔ 2 işçili render, 150 kare) 150/150.
- İlk koşuda odometre `t = 3,3` sn'de geliş yoluna bağlıydı (PSNR 55,48 dB, sub-piksel); sahibi (YEDEK) oturma darbesini `scale()` yerine `font-size` yüzdesiyle yapınca kayboldu. Kare karşılaştırması gerçek bir geçmiş bağımlılığı yakaladı.

**Yol boyunca bulunan hatalar:** HyperFrames `check` odometrede layout hatası (rakam sütunu 4 px dar; düzeltildi); canvas metninde `unicode-range` alt kümeleri tembel yükleniyordu (`İ ş ü` ilk çizimde yedek yazıyla; `document.fonts.load(font, metin)` ile düzeltildi); ölçüm betiğimde `getImageData` ilk çağrıda önceki kuyruğu boşaltıp 600 ms'lik sahte uç değer üretiyordu (düzeltildi); status-orb'da çok sayıda ayrı `fillRect` komut tamponu sıçraması yapıyordu (tek yolda çizim: seek 4,7 → 0,9 ms).

**Ölçülmedi:** gerçek telefon/dokunmatik, gerçek Safari/iOS (Firefox 155 ve WebKit 26.6 Playwright'ta ölçüldü); HyperFrames'te donanım GPU modu, Linux/macOS, 5 sn'den uzun render, ses; `duration: Infinity` (status-orb).

**Çapraz motor** (Chromium 153, Firefox 155.0, WebKit 26.6; Playwright, Windows, başsız; WebKit Safari değil): 3 motor × 6 parça = 18 kombinasyonun hepsinde kendi içinde determinizm, axe 0, konsol hatası yok, reduced-motion; rope-swing fizik durumu üç motorda bit düzeyinde aynı. Ayrıntı `deneme/SONUC.md`, `deneme/CAPRAZ-MOTOR.json`.

**İkinci tur — bitti:** çapraz motor 3 motor × 7 parça = 21/21; `ilerleme-halkasi` (parça 6) ve `kod-diff` hatta eklendi (7/7 parça: check 0 bulgu, TR+EN render, A/B/C aynı); `deneme/vitrin-tanitim/`: 30 sn, 1080×1920, TR+EN, yedi parça sırayla, 900 kare, `check` 0 bulgu; render TR 6,7 MB, EN 6,9 MB (`out/`).

**Açık bulgu (vitrin-tanitim):** çok bileşenli sayfada kare determinizmi tam değil: giriş sahnesindeki odometre aynı `t`'ye farklı yoldan gelince piksel farklı (DOM aynı); 1 ↔ 2 işçili render'da 619–900/900 kare aynı, farklı kareler ≥ 52,8 dB. Sebep odometrenin katmanları (`translate3d`, `will-change`, `mask-image`); YEDEK'e iletildi, bileşen düzelince videoyu yeniden render edip kanıtlayacağım. Ayrıntı `deneme/SONUC.md` "vitrin-tanitim".

**Sıradaki:** YEDEK'in odometre düzeltmesi → vitrin-tanitim yeniden render + `KANIT.json`.

**Not:** `deneme/*/out/*-w1.mp4` ve `*-w2.mp4` ara render çıktıları (kanıt betiğinin ürettiği, `kanit.mjs` ile yeniden üretilir) her koşudan sonra silindi.

**Takılma yok.**
