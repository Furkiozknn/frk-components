# Odometre — nasıl yapıldı / how it was made

## Kaynak

FRK-OS günlük video üreticisindeki `odometre` sayı sahnesinden türedi (`sosyal/uret/sahne.js`, `odometre(s, i)`): her hane kendi şeridinde döner, soldan sağa sırayla durur. Orada GSAP zaman çizelgesi hareketi sürüyordu ve şerit bir kez hedefe kadar uzatılıyordu. Burada GSAP yok; konum, `t` zamanından saf bir fonksiyonla hesaplanıyor. Böylece aynı dosya hem canlı demo hem HyperFrames sahnesi olabiliyor.

## Prompt kaydı

Oturumda bu parçayı doğuran ham yönlendirme (`YONLENDIRME.md` §2, düzenlenmeden):

```
Parça 1: odometre. Pakette şunlar olsun:
- tek JS dosyası;
- demo.html;
- README.md (TR + EN);
- RECETE.md: bu parçayı yapmak için kullandığın promptlar ve adımlar.

Ölç:
- dosya boyutu;
- seek determinizmi: aynı t aynı kareyi üretmeli; iki kez çizip karşılaştır;
- klavye ve reduced-motion desteği.

Sayıları koşunun çıktısından yaz.
```

Döngüyü başlatan komut:

```
/loop 15m YONLENDIRME.md'yi oku ve sıradaki adımı yap, DURUM.md'yi güncelle
```

Başka prompt yok: kod bu iki girdiden, `TASARIM.md` sözleşmesi ve yukarıdaki kaynak sahne okunarak yazıldı. Ara düzeltmeler (aşağıda "Yol boyunca bulunan hatalar") ölçüm çıktısına bakılarak yapıldı.

## Adımlar

1. `TASARIM.md` §1–3 sözleşmesi: `mount(el, opts)` → `{seek, play, pause, destroy}`, `frk:` olayları.
2. `odometer.js`: haneleri `Intl.NumberFormat` ile biçimlendir (`-u-nu-latn`), her sayısal hane için 0–9 + 0 şeridi kur, her hane için durma anı ve tur sayısı üret.
3. `seek(t)`: her şeridin konumunu `ease-out-cubic(t / durma)` ile baştan hesapla; son hane durunca kısa bir "oturma" ölçeği.
4. `demo.html`: FRK-OS kimliği (siyah/krem/sarı, League Gothic, JetBrains Mono), oynat/duraklat, baştan, TR/EN, zaman kaydırıcısı, değer kutusu.
5. `araclar/olc.mjs`: Playwright + axe-core ile ölçüm; çıktı `olcum.json`.
6. Ölçümde çıkan hataları düzelt, tekrar koş.

## Kararlar

- **Saf `seek(t)`.** Hiçbir yerde önceki duruma bakılmıyor. İleri, geri, rastgele atlama aynı kareyi verir; HyperFrames'in kare kare yakalaması buna dayanır.
- **Rastgelelik yalnız `opts.seed`'den.** `mulberry32` ile her hane için tur sayısı (1–2) ve durma payı üretiliyor. Tohum yalnız görünümü değiştirir, son değeri değil.
- **Saat okunmuyor.** `play()` zamanı `requestAnimationFrame`'in verdiği damgadan alır. Kaynak taraması `Math.random`, `Date.now`, `performance.now` ve `new Date` aramasında hiçbirini bulmuyor (`olcum.json` → `yasak_cagri_taramasi`).
- **`duration` oturma darbesi dahil toplam süre.** Hanelerin hiçbiri `duration − 0,35 sn`'yi aşmıyor; `t = duration` karesi her zaman temiz son kare (ölçek 1, tüm haneler hedefte).
- **Şerit modulo 10.** Şeritte 11 hücre var (0…9, 0). Konum `% 10` alındığı için tur sayısından bağımsız tek kısa şerit yetiyor; 9'dan 0'a geçiş görünmez.
- **Yazı boyutu `fit()` ile.** Kutuya göre ölçülüyor; yalnız yerleşim, zamanla ilgisi yok. Yazı tipi geç yüklenirse `document.fonts.ready` sonrası yeniden ölçülür.
- **`prefers-reduced-motion`.** Yalnız `play()` etkilenir: animasyon yerine son kare. `seek(t)` ortamdan bağımsız kalır, çünkü video yakalama ona dayanıyor.
- **Erişilebilirlik.** Kutu `role="img"` ve son değer `aria-label`; dönen şeritler `aria-hidden`. Ekran okuyucu 40 rakam okumuyor.

## Yol boyunca bulunan hatalar

1. **Son hane hedefe oturmuyordu.** İlk sürümde durma anına ±%3 rastgele pay ekleniyordu; payı pozitif çıkan son hane `t = duration`'da henüz bitmemiş oluyordu. Ölçüm `0` değerini `10` okuyunca ortaya çıktı. Çözüm: pay yalnız erken yönde (`− rnd × 0,04`) ve `duration` oturma payını içeriyor.
2. **`performance.now()` doğrudan okunuyordu.** Kuralın harfi "doğrudan okunmaz"; şimdi rAF damgası kullanılıyor.
3. **Ölçüm betiğinde klavye testi yanlıştı.** Düğme durumunu bileşene doğrudan `pause()` çağırarak bozuyordu; test gerçek tuş basışlarıyla yeniden yazıldı.

## Kullanım

```js
const inst = FRKComponents.odometer.mount(el, { seed: 1, value: 167829, locale: 'tr' });
inst.seek(1.2);
```

## Olaylar

| Olay | Ne zaman | detail |
|---|---|---|
| `frk:ready` | `mount` içinde ilk `seek(0)` sonrası | `{ duration, text }` |
| `frk:tick` | her `seek` sonrası | `{ t }` |
| `frk:end` | `t`, `duration`'ı geçtiği ilk `seek`'te | `{ t }` |

## Sınırlar

- Ölçümler başsız Chromium 153, bu makine, masaüstü. Telefon, Safari ve Firefox **ölçülmedi**.
- HyperFrames'te render **bu dosyada denenmedi**; sonuç `deneme/` altında ayrıca yazılacak.
