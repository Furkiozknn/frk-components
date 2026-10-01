# Katkı ısısı / Contribution heat

**TR** — GitHub katkı ızgarası gibi zamanla dolan, tek dosyalık, kütüphanesiz ısı haritası (canvas 2D). Hücreler sol-üstten sağ-alta doğru bir dalga halinde dolar, sayaç aynı anda yükselir. Aynı dosya canlı demo, HyperFrames sahnesi ve kopyalanabilir kod olarak çalışır. Varsayılan veri tohumdan üretilen **örnek veridir**; görüntünün sağ üstünde "ÖRNEK VERİ" yazar.
**EN** — A single-file, dependency-free heat map (canvas 2D) that fills over time like the GitHub contribution grid. Cells fill in a diagonal wave from top-left to bottom-right while the counter climbs. The same file works as a live demo, a HyperFrames scene and copyable code. The default data is **sample data** generated from the seed; the picture says "SAMPLE DATA" at the top right.

## Kullanım / Usage

```html
<div id="stage" style="width:560px;height:560px"></div>
<script src="katki-isi.js"></script>
<script>
  const inst = FRKComponents.katkiIsi.mount(document.getElementById('stage'), {
    locale: 'tr',    // 'tr' | 'en'
    seed: 1,         // örnek verinin ve dalga payının tohumu / seed of the sample data and wave jitter
    weeks: 20,       // sütun sayısı; her sütun 7 gün / columns, 7 days each
    duration: 4,     // sn, son hücre ve bekleme dahil / seconds, including the last cell and hold
    // data: [...]   // kendi verin: weeks × 7 sayı, hafta hafta (hafta, gün sırası). Verilirse "örnek veri" etiketi çıkmaz.
  });
  inst.play();
  inst.seek(2);
</script>
```

Kutunun boyutu önceden verilmiş olmalı (kare ya da yatay); çizim kutuya göre ölçeklenir ve DPR'ye uyar. / The host needs a predefined size; the drawing scales to it and follows DPR.

## Seçenekler / Options

| Seçenek / Option | Varsayılan / Default | Anlamı / Meaning |
|---|---|---|
| `locale` | `'tr'` | Etiket dili ve sayı biçimi / label language and number format |
| `seed` | `1` | Örnek veri ve dalga payı; aynı tohum aynı kare / sample data and wave jitter; same seed, same frame |
| `weeks` | `20` | Hafta sayısı / number of weeks |
| `duration` | `4` | Toplam süre (sn) / total seconds |
| `data` | örnek / sample | `weeks × 7` katkı sayısı; düzey sınırları en büyük değerin %25/50/75'i / counts; level cut-offs at 25/50/75 % of the max |
| `bg` | `#0e0d0b` | Zemin rengi / background colour |
| `reducedMotion` | otomatik / auto | `false` verilirse `prefers-reduced-motion` yok sayılır / `false` ignores it |

## Arayüz / API

- `mount(el, opts)` → `{ seek(t), play(), pause(), destroy(), duration, total }`
- `seek(t)` **saf**: aynı `t` her zaman aynı kareyi üretir, çağrı sırasından bağımsız. Sayaç, o ana kadar dolan hücrelerin toplamıdır. / **pure**: same `t`, same frame, regardless of call order. The counter is the sum of the cells filled so far.
- Olaylar / Events on `el`: `frk:ready` (`{duration, total}`), `frk:tick` (`{t}`), `frk:end` (`{t}`).
- `play()` zamanı `requestAnimationFrame` damgasından alır; `prefers-reduced-motion: reduce` altında son kareyi gösterir. / `play()` takes time from the `requestAnimationFrame` timestamp; under `prefers-reduced-motion: reduce` it shows the final frame.
- Erişilebilirlik / Accessibility: kutu `role="img"`; `aria-label` hafta sayısını, toplamı, en yoğun günü ve (varsa) "Örnek veri" ibaresini söyler; canvas `aria-hidden`. / the host is `role="img"`; `aria-label` states the weeks, the total, the busiest day and, when applicable, the sample-data notice; the canvas is `aria-hidden`.

## Ölçümler / Measurements

`araclar/olc.mjs` koşusundan, `olcum.json` dosyasında; zamanlama değerleri koşudan koşuya oynar, güncel değerler `olcum.json`'da. Başsız Chromium 153, bu makine, masaüstü; telefon, Safari ve Firefox **ölçülmedi**. / From the `araclar/olc.mjs` run, stored in `olcum.json`. Headless Chromium 153, this machine, desktop; phone, Safari and Firefox **not measured**.

| Ölçüt / Metric | Sonuç / Result |
|---|---|
| `katki-isi.js` | 9.966 bayt, gzip 3.950 bayt (hedef ≤ 51.200) / 9,966 bytes, gzip 3,950 (target ≤ 51,200) |
| `demo.html` | 6.845 bayt / bytes |
| Determinizm / Determinism | 7 zaman noktası × ileri, geri, karışık sıra: DOM ve canvas pikselleri (`toDataURL`) aynı; 7 zaman noktasında (son faz dahil), her biri 4 farklı önceki durumdan (başa, ortaya, süre sonrasına, sona yakın bir ana atlayarak) gelinince alınan ekran görüntüleri bayt bayt aynı; aynı tohum aynı, farklı tohum farklı / 7 times × forward, reverse, shuffled: identical DOM and canvas pixels (`toDataURL`); screenshots at 7 times (incl. the final phase), each reached from 4 different previous states (jumping to the start, the middle, past the end and near the end), are byte-identical; same seed same, different seed differs |
| Örnek veri etiketi / sample notice | Veri verilmezse TR ve EN `aria-label` "Örnek veri" / "Sample data" ile başlar; veri verilince başlamaz; verilen verinin toplamı 21 (beklenen 21) / without `data` the TR and EN `aria-label` start with the notice; with `data` it does not; total of the given data 21 (expected 21) |
| `seek` maliyeti / cost | ort. 0,132 ms, en çok 1,2 ms (600 çağrı). Hücreler tek yolda toplu çizilmeden önce ort. 0,65–1,07 ms ve en çok 55–96 ms'ydi (üç koşu) / avg 0.132 ms, max 1.2 ms (600 calls). Before batching the cells into shared paths it was avg 0.65–1.07 ms and max 55–96 ms (three runs) |
| Canlı kare aralığı / live frame gap | ort. 16,58 ms, p95 17,7 ms, 217 kare (hedef 16,7) / avg 16.58 ms, p95 17.7 ms, 217 frames |
| İlk boyama / first paint | FCP 32 ms, LCP 72 ms (hedef ≤ 2500) |
| axe-core 4.13.0 | 0 ihlal: t = 0, 1,2, 2,4 / 0 violations at t = 0, 1.2, 2.4 |
| Klavye / keyboard | Tab sırası oynat → baştan → dil → kaydırıcı → tohum; Enter ve Boşluk oynat/duraklatı değiştirir; R baştan; kaydırıcı okları sarar ve oynatmayı durdurur / Tab order play → restart → language → slider → seed; Enter and Space toggle play/pause; R restarts; slider arrows scrub and pause |
| `prefers-reduced-motion` | Açılışta son kare (`t = 4`), 600 ms sonra değişmiyor; normalde oynuyor / final frame on load, unchanged 600 ms later; plays normally otherwise |

## Sınırlar / Limits

- Yalnız Chromium'da ölçüldü. `roundRect` yoksa köşeler düz çizilir (denenmedi). / Measured in Chromium only. Without `roundRect` the corners are drawn square (not tried).
- Gerçek bir katkı geçmişini (GitHub API) çekmez; `data` ile kendi sayılarını ver. / It does not fetch real contribution history; pass your own numbers via `data`.
- Ay ve gün etiketleri yoktur; `data` tarih taşımaz. / There are no month or weekday labels; `data` carries no dates.
- Canvas yazısı için yazı tipleri sayfadan gelir; yazı tipi geç yüklenirse `document.fonts.ready` sonrası yeniden çizilir. / Canvas text uses the page's fonts; if they load late the canvas redraws after `document.fonts.ready`.

Yazı tipi dosyaları (League Gothic, JetBrains Mono) SIL Open Font License altındadır. / The font files are under the SIL Open Font License.
