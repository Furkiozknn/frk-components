# Durum — genel özet (yazar: YEDEK, terminal oturumu)

Sahip: `components/odometer/`, `components/prompt-terminal/`, `components/katki-isi/`, `araclar/`, `assets/`, `index.html`, `README.md`, `OLCUM.md`, `LICENSE`, `.gitignore`, bu dosya. b1'in durumu: `DURUM-b1.md`, HyperFrames sonucu: `deneme/SONUC.md`.

## 02.10.2026 00:57 [YEDEK]

**YONLENDIRME.md'deki bütün maddeler bitti** (02.10 00:05 sürümü; o tarihten sonra değişmedi). Hepsi GitHub'da, private `Furkiozknn/frk-components`, `main` ile senkron.

**Parçalar (5/5, hepsi vitrinde):** `odometer`, `prompt-terminal`, `katki-isi` (YEDEK); `rope-swing`, `status-orb` (b1). Her biri tek JS + `demo.html` + `README.md` (TR+EN) + `RECETE.md` + `olcum.json`. Kök: `index.html` (FRK-OS, mobil), `README.md`, `OLCUM.md` (olcum.json'lardan üretilir), `LICENSE` (MIT, kanca deposundaki metin), `TASARIM.md` (58 satır, b1).

**Ölçümler** (başsız Chromium 153, bu makine, masaüstü; tablo `OLCUM.md`'de, zamanlama değerleri koşudan koşuya oynar)
- Beş parçada da axe 0 ihlal, konsol hatası yok, `Math.random`/`Date.now`/`performance.now`/`new Date` kaynakta yok, reduced-motion'da son kare.
- JS boyutu 8,2–15,6 KB (hedef ≤ 50 KB). `seek` ortalaması 0,016–0,92 ms; hiçbir parçada kare bütçesi (16,7 ms) aşılmıyor.
- Piksel determinizmi: odometre, prompt-terminal, katki-isi için 7 zaman noktası (son faz dahil) × 4 farklı önceki durum bayt bayt aynı; rope-swing ve status-orb için b1'in betiği (durum JSON'u + piksel) aynı.

**HyperFrames (b1, `deneme/SONUC.md`):** beş parça × TR/EN = 10 render (150 kare, 30 fps), `lint` 0 ve `check` 0 bulgu; determinizm kanıtı 5/5 parçada tam: düz Chromium'da ileri/ters/karışık aynı, HyperFrames snapshot'ı ile düz Chromium bayt eşit (3/3), 1 işçi ↔ 2 işçi render'ın 150/150 karesi aynı. Render videoları `deneme/<parça>/out/` içinde (commit'te).

**Yol boyunca bulunan ve düzeltilen hatalar**
- odometre: son hane `t = duration`'da hedefe oturmuyordu; oturma darbesi `transform: scale()` yüzünden pikselde önceki kareye bağlıydı (b1'in HyperFrames kanıtı buldu, `font-size` darbesiyle giderildi); rakam sütunu bir rakama dar kalıyordu (`check` buldu).
- katki-isi: 140 ayrı `roundRect` çağrısı `seek`'te 55–96 ms sıçrama yapıyordu, toplu yolla 0,7 ms.
- canvas/DOM metninde `unicode-range` alt kümeleri tembel yükleniyordu (`İ ş ü` ilk çizimde yedek yazı tipiyle çıkabiliyordu); metin önceden yükleniyor.
- vitrinde rope-swing satırı `NaN ms` / "tutarsız" yazıyordu (farklı `olcum.json` biçimi); düzeltildi.
- `performance.now()` doğrudan okunuyordu; rAF zaman damgasına çevrildi.
- Ölçüm betiğinde birkaç test hatası (klavye durumu, reduced-motion yuvarlama, canvas pikseli karşılaştırmada yoktu, son faz zamanları denenmiyordu).

**Devam eden:** b1 Firefox 155 ve WebKit 26.6 ile çapraz motor koşusu yapıyor (kilit onda); sonucu gelince `OLCUM.md` ve README'ye işlenecek.

**Ölçülmedi:** gerçek telefon/dokunmatik cihaz, düşük güçlü cihaz, HyperFrames'te donanım GPU modu, Linux/macOS, 5 sn'den uzun render, ses. `deneme/<parça>/` türev kopyaları (gitignore'da) SPDX başlığı eklenmeden önceki `odometer.js`/`prompt-terminal.js`/`katki-isi.js` ile üretildi; fark yalnız bir yorum satırı.

**Sıradaki:** çapraz motor sonucunu işlemek. Yeni parça açmak YONLENDIRME'de yok: b1 `ilerleme-halkasi` (yüzde dolan halka) önerdi, karar gözetim oturumunun.

**Takılma yok.**
