# Katkı ısısı — nasıl yapıldı / how it was made

## Kaynak

GitHub'ın katkı ızgarası fikri (hafta sütunları × 7 gün, 5 düzeyli renk). Önceki iki parçanın sözleşmesi aynen alındı: `mount` / `seek` / `play` / `pause` / `destroy`, `frk:` olayları, rAF damgasıyla zaman. DOM yerine tek bir `<canvas>` kullanıldı: 140 hücrelik ızgarayı her karede baştan çizmek DOM güncellemesinden ucuz ve saf bir fonksiyona daha yakın.

## Prompt kaydı

Oturumda bu parçayı doğuran ham yönlendirme (`YONLENDIRME.md`, 02.10.2026 00:05, düzenlenmeden):

```
4. YENİ, parça 5: `katki-isi`. GitHub katkı ızgarası gibi zamanla dolan, sarılabilir ısı haritası. Demo verisi "örnek veri" diye etiketlenir.
```

Başka prompt yok: kod bu yönlendirmeden, önceki iki parçadan ve `TASARIM.md` sözleşmesinden yazıldı.

## Adımlar

1. Örnek veri üreticisi: tohumlu PRNG, "ruh hali" haftadan haftaya dalgalanır, hafta sonu seyrek, bazı günler boş.
2. Düzey ataması: sıfır boş; en büyük değerin %25/50/75'ine göre 1–4.
3. Başlangıç anları: çapraz dalga (`hafta × 0,75 + gün × 0,25`), tohumdan küçük pay; hiçbiri `duration − 0,35 − 0,5` sn'yi aşmaz.
4. `draw(t)`: zemin, etiket, sayaç (başlamış hücrelerin toplamı), ızgara (boş hücre hep çizili; dolu hücre `easeOutBack` ile hafif taşarak renge geçer), gösterge.
5. `demo.html` önceki parçalarla aynı kontroller; `araclar/olc.mjs` canvas pikselini (`toDataURL`) determinizm karşılaştırmasına kattı.

## Kararlar

- **Saf `seek(t)`, saat yok, ham rastgelelik yok.** Kaynak taraması `Math.random`, `Date.now`, `performance.now`, `new Date` aramasında hiçbirini bulmuyor.
- **"ÖRNEK VERİ" pikselin içinde.** Etiket yalnız sayfa metninde değil, canvas'ın sağ üstünde de basılı; ekran görüntüsü ya da video karesi tek başına alınsa bile veri örnek olarak okunur. `data` verilirse etiket çıkmaz.
- **Sayaç hücre toplamı.** Sayaç süreye bağlı bir animasyon değil, o ana kadar dolan hücrelerin gerçek toplamı; son karede `total`'e eşit.
- **Boş hücre her zaman çizili.** Izgara `t = 0`'da da okunur; "zamanla dolan" hissi dolan hücrelerin renk ve ölçek geçişinden gelir.
- **DPR ve yeniden boyut.** `ResizeObserver` tuvali yeniden boyutlar ve aynı `t` ile yeniden çizer; olay yaymaz.
- **Erişilebilirlik.** Kutu `role="img"`, `aria-label` hafta sayısı, toplam, en yoğun gün ve (varsa) örnek veri ibaresi; canvas `aria-hidden`.

## Yol boyunca bulunan hatalar

İlk ölçümde `seek` ortalaması 0,65 ms ama en çok 55,2 ms çıktı; üç yeniden koşuda en çok 62–96 ms, her 600 çağrıda 5 sıçrama (> 5 ms). Aynı canvas üzerinde yalnız düz `fillRect`'le yapılan deneyde de 18,8 ms'lik sıçrama görüldü; 140 ayrı `roundRect` + `fill` ise ortalamayı 7 kat artırıp sıçramayı ~90 ms'ye çıkardı. Çözüm: boş zemin tek yolda, oturmuş hücreler düzeye göre en çok 4 yolda, yalnız geçişteki hücreler tek tek çizildi (görüntü aynı kaldı). Sonuç: ort. 0,119 ms, en çok 0,7 ms. Ölçüm betiğinde de bir eksik kapatıldı: DOM karşılaştırması `innerHTML` okuyordu, canvas pikselini taşımıyordu; artık `toDataURL` de karşılaştırılıyor. Değişiklikten sonra odometre ve prompt-terminal ölçümleri yeniden koşuldu; sonuçlar aynı, yalnız zamanlama değerleri koşudan koşuya oynadı.

## Kullanım

```js
const inst = FRKComponents.katkiIsi.mount(el, { seed: 1, locale: 'tr', weeks: 20, duration: 4 });
inst.seek(2);
```

## Olaylar

| Olay | Ne zaman | detail |
|---|---|---|
| `frk:ready` | `mount` içinde ilk `seek(0)` sonrası | `{ duration, total }` |
| `frk:tick` | her `seek` sonrası | `{ t }` |
| `frk:end` | `t`, `duration`'ı geçtiği ilk `seek`'te | `{ t }` |

## Sınırlar

- Ölçümler başsız Chromium 153, bu makine, masaüstü. Telefon, Safari ve Firefox **ölçülmedi**.
- HyperFrames'te render **bu dosyada denenmedi**; `deneme/` altı `b1` oturumunun işi.
