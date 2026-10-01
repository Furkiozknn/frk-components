# Kod diff — nasıl yapıldı / how it was made

## Kaynak

Önceki parçaların sözleşmesi aynen alındı: `mount` / `seek` / `play` / `pause` / `destroy`, `frk:` olayları, rAF damgasıyla zaman. Görünüm, "Claude Code ile" videolarında sık geçen birleşik diff'ten (iki sayı sütunu, `+` / `-` işareti, satır zemini) esinlendi; dosya `prompt-terminal`'in zaman planı (`plan`) ve harf harf yazma mantığını yeniden kullanır, ama çıktı satırları yerine kod satırlarını çizer.

## Prompt kaydı

Oturumda bu parçayı doğuran ham yönlendirme (`YONLENDIRME.md`, 02.10.2026 01:05 "İKİNCİ TUR", YEDEK madde 3, düzenlenmeden):

```
3. Parça 7: `kod-diff`. Sarılabilir kod farkı animasyonu: satır ekleme ve silme vurgusu, yazma efekti. "Claude Code ile" videoları için.
```

Döngüyü başlatan komut:

```
/loop 15m YONLENDIRME.md'yi oku ve sıradaki adımı yap, DURUM.md'yi güncelle
```

Başka prompt yok: kod bu yönlendirmeden, önceki parçalardan ve `TASARIM.md` sözleşmesinden yazıldı.

## Adımlar

1. Örnek diff: `ctx` (olduğu gibi), `del` (silinir), `add` (yazılır) satırlarından oluşan 11 satırlık küçük bir JS değişikliği. Gerçek bir oturum kaydı değil; başlıkta "örnek diff" yazar.
2. Zaman planı (`plan`): ardışık `del`/`add` satırları bir blok olur. Blokta önce silinecek satırlar 0,14 sn arayla işaretlenir (0,2 sn'lik zemin geçişi), 0,35 sn beklenir, sonra silme gerçekleşir (üstü çizilir ya da çöker), sonra eklenen satırlar sırayla harf harf yazılır. Harf aralığı `1/55 sn × (0,6 … 1,4)` (tohumdan); girinti anında gelir.
3. `seek(t)`: her satırın durumu yalnız `t`'den hesaplanır (işaretli mi, üstü çizili mi, ne kadar yazıldı, çökme oranı); başlıktaki `+A −D` sayaçları da aynı hesaptan çıkar.
4. İmleç, yazılan satırın sonunda; yazarken sabit, beklerken `floor(t × 2)` ile yanıp söner.
5. `demo.html`: önceki demolarla aynı kontroller (`#stage`, `#play`, `#t`, `#v` = tohum, `window.inst`) ve bir mod seçici.

## Kararlar

- **Saf `seek(t)`, saat yok, ham rastgelelik yok.** Kaynak taraması `Math.random`, `Date.now`, `performance.now`, `new Date` aramasında hiçbirini bulmuyor.
- **İki mod.** Varsayılan `diff`: silinen satırlar kırmızıyla işaretlenir, sonra üstü çizili ve soluk kalır; düzen sabittir (eklenecek satırlar gizli ama yerini tutar). `apply`: silinen satırlar çöker (yükseklik 0'a iner), eklenen satırlar yerine yazılır; son kare uygulanmış dosyadır.
- **Renk tek başına taşıyıcı değil.** Eklenen satır `+` ve sarı, silinen satır `-` ve mercan; işaret sütunu ve üstü çizili yazı renkten bağımsız okunur. Mercan (`#ff4d6d`) ve sarı (`#ffc21a`) zeminde 4,5:1'in üstünde.
- **Satır kaydırma yok.** `white-space: pre`: uzun satır kırılmaz, kesilir. Satır yüksekliği sabit olduğu için çökme matematiği ve düzen basit kalıyor; sınırı `cols` (varsayılan 44 sütun) belirliyor.
- **`duration` ölçeği.** Doğal süre diff'ten çıkar (varsayılan 5,28 sn); HyperFrames'in sabit `data-duration`'ı için `duration: 5` verilirse bütün zamanlar orantılı sıkışır.
- **Yazı tipi alt kümeleri önceden yükleniyor.** `document.fonts.load` ile çizilecek metin; Türkçe başlıkta `ş`, `ö` yedek yazı tipiyle parlamasın.
- **Erişilebilirlik.** Kutu `role="img"`; `aria-label` dosya adını, eklenen ve silinen satır sayısını ve satırların metnini söyler; çizim `aria-hidden`.

## Yol boyunca bulunan hatalar

1. **DOM metni geçmişe bağlıydı.** İlk ölçümde piksel karşılaştırması geçti ama `dom_ileri_geri_karisik_esit` `false` çıktı: satırların `style` özniteliği tek tek özellik atanarak yazılıyordu ve özelliklerin sırası ilk yazılış sırasına bağlı kalıyordu (aynı değerler, farklı metin). Stil, satır başına tek seferde ve sabit sırayla `cssText` olarak yazılıyor; ölçüm yeniden koşuldu, DOM ve piksel eşit.

## Kullanım

```js
const inst = FRKComponents.kodDiff.mount(el, { seed: 1, locale: 'tr', mode: 'apply', duration: 5 });
inst.seek(2.5);
```

Kendi diff'in:

```js
FRKComponents.kodDiff.mount(el, { diff: [
  { k: 'ctx', text: 'function f() {' },
  { k: 'del', text: '  return 1;' },
  { k: 'add', text: '  return 2;' },
  { k: 'ctx', text: '}' },
], title: 'src/f.js' });
```

## Olaylar

| Olay | Ne zaman | detail |
|---|---|---|
| `frk:ready` | `mount` içinde ilk `seek(0)` sonrası | `{ duration, added, removed }` |
| `frk:tick` | her `seek` sonrası | `{ t }` |
| `frk:end` | `t`, `duration`'ı geçtiği ilk `seek`'te | `{ t }` |

## Sınırlar

- Ölçümler başsız Chromium 153, bu makine, masaüstü. Telefon ve Safari **ölçülmedi**; çapraz motor (Firefox/WebKit) koşusu bu parçayı kapsamıyor.
- Özel `diff` yolu ölçüm koşusunda denenmedi; yalnız varsayılan örnek (`diff` ve `apply` modları) denendi.
- HyperFrames'te render **bu parça için denenmedi**; `deneme/` altı `b1` oturumunun işi.
