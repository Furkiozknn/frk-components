# Durum — genel özet (yazar: YEDEK, terminal oturumu)

Sahip: `components/odometer/`, `components/prompt-terminal/`, `components/katki-isi/`, `araclar/`, `assets/`, `index.html`, `README.md`, `OLCUM.md`, `.gitignore`, bu dosya. b1'in durumu: `DURUM-b1.md`.

## 02.10.2026 00:25 [YEDEK]

**Bitti** (hepsi GitHub'da, private `Furkiozknn/frk-components`, `main` ile senkron)
- `TASARIM.md` (b1 ≤80 satıra indirecek), Parça 1 `odometer`, Parça 2 `prompt-terminal`, Parça 5 `katki-isi`: her biri tek JS + `demo.html` + `README.md` (TR+EN) + `RECETE.md` + `olcum.json`.
- Kök `index.html` (FRK-OS; masaüstü 1280 ve mobil 390'da yatay taşma yok, axe 0 ihlal, konsol hatası yok), `README.md` (TR+EN), `OLCUM.md` (`araclar/olcum-md.mjs` ile `olcum.json`'lardan üretilir), `.gitignore`.
- `rope-swing` (b1, hazır ve ölçülmüş) commit'lendi, vitrine 16:9 kart eklendi; vitrinde mobil kaydırma için yalnız `tema.css`'te canvas `touch-action:pan-y` (bileşen dosyasına dokunulmadı).

**Ölçümler** (başsız Chromium 153, bu makine, masaüstü; tablo `OLCUM.md`'de, zamanlama değerleri koşudan koşuya oynar)
- odometer: JS 7.206 bayt (gzip 2.923); prompt-terminal: 9.904 (3.810); katki-isi: 8.827 (3.529). Üçünde axe 0 ihlal, DOM ve piksel determinizmi geçti, `Math.random`/`Date.now`/`performance.now`/`new Date` yok.
- katki-isi `seek` en çok 55,2 ms: 600 çağrıda tek seferlik sıçrama, nedeni araştırılmadı.
- **Ölçülmedi:** gerçek telefon, Safari, Firefox; HyperFrames render (b1'de); prompt-terminal'de özel `script` yolu; odometrede negatif/ondalık değer.

**Yol boyunca düzeltilen hatalar:** odometrede son hane `t = duration`'da hedefe oturmuyordu (ölçüm `0`'ı `10` okuyunca bulundu); iki bileşende `performance.now()` doğrudan okunuyordu (b1 buldu, rAF damgasına çevrildi); ölçüm betiğinde üç test hatası (klavye durumu, reduced-motion yuvarlama, canvas pikseli karşılaştırmada yoktu).

**b1 özeti** (`DURUM-b1.md`'den): `rope-swing` ölçülmüş WIP (JS 15.170 bayt, kendi ölçüm betiği `deneme/araclar/`); `status-orb`, `deneme/` HyperFrames render'ları ve `TASARIM.md` (≤80 satır) sırada.

**Sıradaki:** b1 "hazır" deyince `status-orb` kartını index'e ekleyip push; `OLCUM.md` yenileme; `TASARIM.md` yeni sürümü gelince ayrı commit. Beklerken: `index.html` ilk-kare davranışı (görünmeyen kartlar `t = 0` karesinde bekliyor) gözden geçirilebilir.

**Takılma yok.** Ağır işler `.agir-is.kilit` ile sıralanıyor.
