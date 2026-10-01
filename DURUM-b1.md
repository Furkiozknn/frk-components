# Durum — b1 (VS Code paneli, `frk-components-b1`)

Sahip: `components/rope-swing/`, `components/status-orb/`, `deneme/`, `TASARIM.md`, bu dosya. Git'i YEDEK kullanır.

## 02.10.2026 ~01:15

**Bitti**
- Parça 3 `rope-swing` ve parça 4 `status-orb`: JS + `demo.html` + `README.md` (TR+EN) + `RECETE.md` + `olcum.json`; ikisi de vitrinde.
- `deneme/`: beş parça (odometer, prompt-terminal, rope-swing, status-orb, katki-isi) için 5 sn'lik HyperFrames kompozisyonu; `lint` 0, `check` 0 bulgu (5/5), render TR ve EN (10/10, 150 kare, 30 fps). Ayrıntı `deneme/SONUC.md`, kanıt `deneme/KANIT.json`.
- `TASARIM.md` 58 satır, parçalarla uyumlu.

**Ölçümler** (başsız Chromium 153, bu makine, masaüstü)
- rope-swing: JS 15.605 bayt (gzip 5.725); determinizm 9 zaman × 3 sıra piksel + durum aynı; canlı koşunun 6 karesi kayıttan tekrarda aynı; axe 0; seek JS ort. 0,07 ms.
- status-orb: JS 11.864 bayt (gzip 4.671); determinizm 9 zaman × 3 sıra aynı; durum kaydı tekrarında 3/3 kare aynı; axe 0; seek JS ort. 0,92 ms, boşaltmalı medyan 3,5 ms.
- HyperFrames determinizm kanıtı: A (düz Chromium, `totalTime(t,false)`, ileri/ters/karışık) 4/5 parçada tam aynı; B (HF snapshot ↔ düz Chromium bayt eşitliği) 5/5 parçada 3/3; C (1 ↔ 2 işçili render, 150 kare) 4/5 parçada 150/150.
- **Fark:** odometre `t = 3,3` sn'de geliş yoluna bağlı (PSNR 55,48 dB, sub-piksel) ve bir koşuda C 149/150 (2. kare, PSNR 93 dB). Sahibine (YEDEK) iletildi; `deneme/kanit.mjs odometer` yeniden üretir.

**Yol boyunca bulunan hatalar:** HyperFrames `check` odometrede layout hatası (rakam sütunu 4 px dar; düzeltildi); canvas metninde `unicode-range` alt kümeleri tembel yükleniyordu (`İ ş ü` ilk çizimde yedek yazıyla; `document.fonts.load(font, metin)` ile düzeltildi); ölçüm betiğimde `getImageData` ilk çağrıda önceki kuyruğu boşaltıp 600 ms'lik sahte uç değer üretiyordu (düzeltildi); status-orb'da çok sayıda ayrı `fillRect` komut tamponu sıçraması yapıyordu (tek yolda çizim: seek 4,7 → 0,9 ms).

**Ölçülmedi:** gerçek telefon/dokunmatik, Safari, Firefox; HyperFrames'te donanım GPU modu, Linux/macOS, 5 sn'den uzun render, ses; `duration: Infinity` (status-orb).

**Sıradaki:** YEDEK'in commit'i; odometre düzeltmesi gelince `kanit.mjs odometer` yeniden; önerilecek parça 6 (aşağıda).

**Öneri — parça 6 `ilerleme-halkasi`:** HyperFrames'te sık kullanılan "yüzde doluyor" halkası: canvas 2D, `seek(t)` ile 0 → hedef %, ortada sayı (odometre gibi basamaklı değil, tek sayı), TR/EN etiket, reduced-motion'da hedef değer sabit. Neden: dört parça sayı, metin, hareket ve durum gösteriyor; halka "ilerleme/oran" boşluğunu kapatır ve katki-isi'nden farklı olarak tek değerli, ekran okuyucuya `role="progressbar"` olarak doğal bağlanır. Tasarım henüz yazılmadı.

**Takılma yok.**
