# Durum — genel özet (yazar: YEDEK, terminal oturumu)

Sahip: `components/odometer/`, `components/prompt-terminal/`, `components/katki-isi/`, `araclar/`, `assets/`, `index.html`, `README.md`, `OLCUM.md`, `.gitignore`, bu dosya. b1'in durumu: `DURUM-b1.md`.

## 02.10.2026 ~00:40 [YEDEK]

**Bitti**
- `TASARIM.md` (b1 ≤80 satıra indirecek), Parça 1 `odometer`, Parça 2 `prompt-terminal`: her biri tek JS + `demo.html` + `README.md` (TR+EN) + `RECETE.md` + `olcum.json`.
- Kök `index.html` (FRK-OS, mobil; parçalar iframe'siz doğrudan mount), `README.md` (TR+EN), `OLCUM.md` (araclar/olcum-md.mjs ile `olcum.json`'lardan üretilir), `.gitignore`.
- Git: yerel depo + özel (private) GitHub deposu `Furkiozknn/frk-components`; her parçadan sonra push.

**Ölçümler** (başsız Chromium 153, bu makine, masaüstü; ayrıntı `OLCUM.md`)
- odometer: JS 7.206 bayt (gzip 2.923), seek ort. 0,034 ms, axe 0 ihlal, DOM ve piksel determinizmi geçti.
- prompt-terminal: JS 9.904 bayt (gzip 3.810), seek ort. 0,02 ms, axe 0 ihlal, DOM ve piksel determinizmi geçti.
- **Ölçülmedi:** gerçek telefon, Safari, Firefox; HyperFrames render (b1'de); özel `script` yolu (prompt-terminal) ve negatif/ondalık değer (odometer).

**Yol boyunca düzeltilen hatalar:** odometrede son hane `t = duration`'da hedefe oturmuyordu (ölçüm `0`'ı `10` okuyunca bulundu); iki bileşende `performance.now()` doğrudan okunuyordu (b1 buldu, rAF damgasına çevrildi); ölçüm betiğinde iki test hatası (klavye durumu, reduced-motion yuvarlama).

**b1 özeti** (`DURUM-b1.md`'den): `rope-swing` yazılıyor (global ad `FRKComponents.ropeSwing`, 16:9 canvas, otopilotlu); `status-orb` sırada; HyperFrames köprüsü kod okumayla doğrulandı, render henüz koşmadı; kendi ölçüm betiği `deneme/araclar/` altında. b1 dosyaları şimdilik commit dışı (`rope-swing/`, `deneme/`, `DURUM-b1.md`): "hazır" mesajı gelince ya da sonraki turda WIP olarak commit edilecek.

**Sıradaki:** Parça 5 `katki-isi` (zamanla dolan, sarılabilir katkı ısı haritası; demo verisi "örnek veri" etiketli); sonra index'e rope-swing/status-orb/katki-isi kartları ve `OLCUM.md` yenileme.

**Takılma yok.** Ağır işler `.agir-is.kilit` ile sıralanıyor.
