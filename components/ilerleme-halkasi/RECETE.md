# İlerleme Halkası — nasıl yapıldı / how it was made

## Kaynak

Boşluk kendi parça takımımızdaydı: beş parça (odometre, terminal, kanca ipi, durum küresi, katkı ısısı) sayı, metin, hareket, durum ve zamana yayılmış veri gösteriyordu; tek değerli bir oran/ilerleme göstergesi yoktu. Tasarım sıfırdan: Canvas 2D, FRK-OS jetonları; değer çizelgesi ve devralma modeli rope-swing ve status-orb'daki kayıt modelinin aynısı.

## Prompt kaydı

Bu parçayı doğuran ham girdiler, düzenlenmeden. Oturumu başlatan iki mesaj:

```
CLAUDE.md ve YONLENDIRME.md'yi oku, başla
```

```
10m YONLENDIRME.md'yi oku ve sıradaki adımı yap, DURUM.md'yi güncelle
```

Önerinin kendisi `DURUM-b1.md`'ye yazıldı (parça 6 `ilerleme-halkasi`); gözetim oturumunun onay mesajı (SendMessage):

```
2. Parça 6 ilerleme-halkasi: senin önerin, onaylandı.
```

`YONLENDIRME.md`'nin 02.10.2026 01:05 sürümünden:

```
2. Parça 6: `ilerleme-halkasi` (senin önerin). Yüzde dolan halka, Canvas 2D, sarılabilir; paketi diğerleri gibi.
```

Başka prompt yok. Paket yapısı ve ölçüm istekleri için ilk turun "Pakette şunlar olsun / Ölç" listesi geçerliydi (odometre ve kanca ipi RECETE.md'lerinde ham haliyle var).

## Adımlar

1. Sözleşmeyi hazır parçalardan al: `mount`, `seek` saf, `frk:` olayları, rAF damgası, dolaylı rAF, reduced-motion, tohum yalnız süslerde.
2. Değer modeli: çizelge `[[t, hedef, süre], ...]`. Başlangıç değerleri önceki olaylardan hesaplanır (`starts`), `valueAt(t)` son olaydan `power3.out` ile gider. Yeni olay eklemek geçmişi değiştirmez; bu, canlı koşunun kayıttan birebir tekrarının şartı.
3. Çizim (1000×1000 mantıksal): zemin parıltısı (değerle büyür), iz halkası, %5 çentikler, sarı yay (yuvarlak uçlu, geniş saydam parıltı), uçta krem nokta ve tohumlu kıvılcımlar (4 saydamlık kümesi, her biri tek yol), ortada League Gothic yüzde ve mono etiket.
4. Erişilebilirlik: `role="progressbar"`; `aria-valuenow` hedef değer (kare başına değil), `aria-valuetext`; %100'e varınca `role="status"` bölgesi bir kez söyler.
5. `demo.html`: odometre düzeni (FRK-OS, TR/EN, zaman kaydırıcısı) + hedef kaydırıcısı (`change` olayında `setValue`).
6. `deneme/araclar/olc-parca.mjs`'e bu parçanın dalları: değer kaydı tekrarı, tamamlanma olayı, `progressbar` özellikleri, klavye, reduced-motion'da değer değişimi.

Ölçümü yeniden koşmak için:

```
node deneme/araclar/olc-parca.mjs components/ilerleme-halkasi/demo.html
```

## Kararlar

- **Olay çizelgesi, anahtar kare listesi değil.** İlk fikir `[[t, değer], ...]` anahtar kareleriydi; ama bir anahtar kare eklemek önceki parçanın eğrisini değiştirir (geçmiş kareler kayar). Olay = "`t`'de mevcut değerden hedefe `süre` sn'de git" deyince geçmiş sabit kalıyor.
- **`aria-valuenow` hedef değer.** Her karede güncellenen bir `progressbar` ekran okuyucuyu boğar; animasyon yalnız görsel, değer hedefi anlatıyor. Tamamlanma ayrıca bir kez duyuruluyor.
- **Yüzde biçimi elle.** TR `%72`, EN `72%`: `Intl` yerine iki satır; motorlar arası aynı metin.
- **Tohum yalnız kıvılcımlarda.** Yay ve sayı tohumdan bağımsız.
- **Saat okunmuyor.** `play()` zamanı rAF damgasından alır; erişim `global['requestAnimationFrame']` ile dolaylı. Kaynak taraması `Math.random`, `Date.now`, `performance.now`, `new Date` ve doğrudan `requestAnimationFrame(` aramasında hiçbirini bulmuyor.
- **Canvas metni için yazı tipi alt kümeleri önceden yüklenir** (`document.fonts.load(font, bütün metin)`); aksi halde ilk çizimde yedek yazı tipi çıkabiliyor (status-orb ve rope-swing'de görüldü).
- **Reduced-motion = hedef değer sabit.** `play()` son kareyi gösterir; `setValue` geçişsiz.

## Yol boyunca bulunan hatalar

1. **Demo, bileşen `mount` içinde olay yayınlarken `window.inst` hâlâ `null` iken kırıldı.** `frk:tick` dinleyicisi `window.inst.duration` okuyordu; `ready`/ilk `tick` `mount` dönmeden yayımlanıyor. Dinleyici korumalı hale getirildi (diğer demolarda `inst` yalnız olay ayrıntısından okunuyordu).
2. **Tamamlanma duyurusu boş çıktı.** `frk:done` yayımlandıktan sonra canlı bölgeye yazılıyordu; olay dinleyicisi metni okuduğunda henüz boştu. Önce yaz, sonra yay.
3. **Canlı kare ölçümü yanlış çıkıyordu.** `getImageData` okumalarından sonra aynı sayfada oynatma ilk kareden sonra 0,5–1,3 sn takılıyordu (canvas yazılımsal moda geçiyor); 144 yerine 30–100 kare sayıldı. Ölçüm betiği canlı oynatmayı taze sayfada, okumalardan önce ölçecek şekilde düzeltildi (146 kare, en uzun aralık 19 ms).
4. **İlk görsel parıltı yay çevresinde bir çerçeve gibi görünüyordu.** Geniş saydam yay `0,14` alfa ile kahverengi bir halo çiziyordu; alfa `0,07`'ye indirildi, kıvılcımlar büyütüldü.

## Kullanım

```js
const inst = FRKComponents.ilerlemeHalkasi.mount(el, { value: 72, locale: 'tr' });
inst.play();
inst.setValue(35);              // uygulama değeri değiştirir
const kayit = inst.values;      // [[t, hedef, süre], ...]
FRKComponents.ilerlemeHalkasi.mount(baskaEl, { values: kayit }).seek(1.2);
```

## Olaylar

| Olay | Ne zaman | detail |
|---|---|---|
| `frk:ready` | `mount` içinde ilk `seek(0)` sonrası | `{ duration }` |
| `frk:tick` | her `seek` sonrası | `{ t, value }` |
| `frk:end` | `t`, `duration`'ı geçtiği ilk `seek`'te | `{ t }` |
| `frk:done` | değer ilk kez %100'e vardığında (yalnız ileri giderken) | `{ t }` |

## Sınırlar

- Ölçümler başsız Chromium 153, bu makine, masaüstü. Telefon, gerçek dokunmatik ve gerçek Safari **ölçülmedi**.
- Değer tam sayıya yuvarlanır; ondalık yok. Tek halka.
- Çapraz motor koşusu (Chromium 153, Firefox 155.0, WebKit 26.6; Playwright, Windows, başsız) bu parçada da geçti: kendi içinde determinizm, axe 0, konsol hatası yok, reduced-motion. Gerçek Safari/iOS ölçülmedi.
- HyperFrames: 5 sn'lik 1080×1080 kompozisyon `deneme/ilerleme-halkasi/` altında; `check` 0 bulgu, TR+EN render, aynı `t` aynı kare kanıtı (`deneme/SONUC.md`, `deneme/KANIT.json`). Canvas metni HyperFrames kontrast denetiminin dışında kalır.
