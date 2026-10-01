# Durum — genel özet (yazar: YEDEK, terminal oturumu)

Sahip: `components/odometer/`, `components/prompt-terminal/`, `components/katki-isi/`, `araclar/`, `assets/`, `index.html`, `README.md`, `OLCUM.md`, `.gitignore`, bu dosya. b1'in durumu: `DURUM-b1.md`.

## 02.10.2026 00:30 [YEDEK]

**Bitti** (hepsi GitHub'da, private `Furkiozknn/frk-components`, `main` ile senkron)
- `TASARIM.md` (b1 ≤80 satıra indirecek), Parça 1 `odometer`, Parça 2 `prompt-terminal`, Parça 5 `katki-isi`: her biri tek JS + `demo.html` + `README.md` (TR+EN) + `RECETE.md` + `olcum.json`.
- Kök `index.html` (FRK-OS; masaüstü 1280 ve mobil 390'da yatay taşma yok, axe 0 ihlal, konsol hatası yok), `README.md` (TR+EN), `OLCUM.md` (`araclar/olcum-md.mjs` ile `olcum.json`'lardan üretilir), `.gitignore`.
- `rope-swing` (b1, hazır ve ölçülmüş) commit'lendi, vitrine 16:9 kart eklendi; vitrinde mobil kaydırma için yalnız `tema.css`'te canvas `touch-action:pan-y` (bileşen dosyasına dokunulmadı).

**Ölçümler** (başsız Chromium 153, bu makine, masaüstü; tablo `OLCUM.md`'de, zamanlama değerleri koşudan koşuya oynar)
- odometer: JS 7.206 bayt (gzip 2.923); prompt-terminal: 9.904 (3.810); katki-isi: 9.452 (3.728). Üçünde axe 0 ihlal, DOM ve piksel determinizmi geçti, `Math.random`/`Date.now`/`performance.now`/`new Date` yok.
- Kapatılan boşluklar: odometrede eksi ve ondalık değerler (10 durumun hepsi doğru), prompt-terminal'de özel `script` (15 adım, uzun satır, son satır kutu içinde).
- katki-isi `seek` sıçraması giderildi: 140 ayrı `roundRect` yerine toplu yol; en çok 55–96 ms → 0,7 ms, ort. 0,65 → 0,119 ms.
- **Ölçülmedi:** gerçek telefon, Safari, Firefox; HyperFrames render (b1'de).

**Yol boyunca düzeltilen hatalar:** odometrede son hane `t = duration`'da hedefe oturmuyordu (ölçüm `0`'ı `10` okuyunca bulundu); iki bileşende `performance.now()` doğrudan okunuyordu (b1 buldu, rAF damgasına çevrildi); ölçüm betiğinde üç test hatası (klavye durumu, reduced-motion yuvarlama, canvas pikseli karşılaştırmada yoktu); katki-isi'nde canvas sıçraması (yukarıda).

**b1 özeti** (`DURUM-b1.md`'den): `rope-swing` ölçülmüş WIP (JS 15.170 bayt, kendi ölçüm betiği `deneme/araclar/`); `status-orb`, `deneme/` HyperFrames render'ları ve `TASARIM.md` (≤80 satır) sırada.

**Vitrin düzeltmesi (00:20):** `index.html` rope-swing kartında ölçüm satırı `NaN ms` ve "tutarsız" yazıyordu: kart yalnız benim `olcum.json` anahtarlarımı okuyordu, rope-swing'in biçimi farklıydı. İki biçimi de okuyacak şekilde düzeltildi ve dört kartın satırları tarayıcıda doğrulandı. Ayrıca görünmeyen kartlar artık son kareyle bekliyor, ekrana girince baştan oynuyor.

**Kare bütçesi uyarısı (`OLCUM.md` üretici otomatik yazıyor):** `status-orb` `seek` JS ort. 4,711 ms, en çok 41,6 ms (p95 37,3 ms): tek karede 16,7 ms bütçesi aşılıyor, canlı kare aralığı ortalaması yine 16,57 ms. `katki-isi`'nde aynı belirti çizim çağrılarını tek yolda toplayınca 55–96 ms → 0,7 ms'ye indi; b1'e bildirildi, karar onun. 2200 parçacık zayıf cihazda ölçülmedi.

**Bitti (vitrin):** beş parça da `index.html`'de (görünmeyen kartlar son kareyle bekliyor, ekrana girince baştan oynuyor); `status-orb` b1'den hazır geldi, commit'lendi.

**Sıradaki:** b1'in `deneme/` HyperFrames render'ı bitince sonuçları (render süresi, kare karşılaştırması, ya da neden olmadığı) `DURUM.md`'ye ve README'ye işlemek; `TASARIM.md` yeni sürümü gelince ayrı commit; `OLCUM.md` yenileme. Render sırasında Chromium açılmıyor.

**Takılma yok.** Ağır işler `.agir-is.kilit` ile sıralanıyor.
