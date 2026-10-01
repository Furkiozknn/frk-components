# Odometre / Odometer

**TR** — Haneleri soldan sağa sırayla duran, tek dosyalık, kütüphanesiz sayaç. Aynı dosya canlı demo, HyperFrames sahnesi ve kopyalanabilir kod olarak çalışır.
**EN** — A single-file, dependency-free odometer whose digits stop one by one, left to right. The same file works as a live demo, a HyperFrames scene and copyable code.

## Kullanım / Usage

```html
<div id="stage" style="width:560px;height:560px"></div>
<script src="odometer.js"></script>
<script>
  const inst = FRKComponents.odometer.mount(document.getElementById('stage'), {
    value: 167829,   // sayı / number
    locale: 'tr',    // 'tr' → 167.829 · 'en' → 167,829
    seed: 1,         // tohum: hanelerin tur sayısı ve duruş payı / seed: turns and stop jitter per digit
    duration: 2.4,   // sn, oturma darbesi dahil toplam süre / seconds, including the settle pulse
  });
  inst.play();       // canlı oynat / live playback
  inst.seek(1.2);    // herhangi bir ana git / jump to any time
</script>
```

Kutunun boyutu önceden verilmiş olmalı; yazı boyutu kutuya sığacak şekilde hesaplanır. / The host element needs a predefined size; the font size is fitted to it.

## Seçenekler / Options

| Seçenek / Option | Varsayılan / Default | Anlamı / Meaning |
|---|---|---|
| `value` | `167829` | Gösterilecek sayı / number to show |
| `locale` | `'tr'` | Binlik ayracı `Intl.NumberFormat` ile, Latin rakamlarla / thousands separator via `Intl.NumberFormat`, Latin digits |
| `decimals` | `0` | Ondalık basamak / fraction digits |
| `prefix`, `suffix` | `''` | Sayının önüne/arkasına sabit metin / static text around the number |
| `seed` | `1` | Rastgelelik tohumu; aynı tohum aynı kare / PRNG seed; same seed, same frame |
| `duration` | `2.4` | Toplam süre (sn) / total seconds |
| `reducedMotion` | otomatik / auto | `false` verilirse `prefers-reduced-motion` yok sayılır / `false` ignores `prefers-reduced-motion` |

Renk, zemin ve yazı tipi CSS değişkenleriyle: `--frk-odo-color`, `--frk-odo-bg`, `--frk-odo-font`. / Colour, background and font via CSS variables.

## Arayüz / API

- `mount(el, opts)` → `{ seek(t), play(), pause(), destroy(), duration }`
- `seek(t)` **saf**: aynı `t` her zaman aynı kareyi üretir, çağrı sırasından bağımsız. / **pure**: same `t`, same frame, regardless of call order.
- Olaylar / Events on `el`: `frk:ready` (`{duration, text}`), `frk:tick` (`{t}`), `frk:end` (`{t}`).
- `play()` zamanı `requestAnimationFrame` damgasından alır; `prefers-reduced-motion: reduce` altında animasyon yerine son hali gösterir. / `play()` takes time from the `requestAnimationFrame` timestamp; under `prefers-reduced-motion: reduce` it shows the final state instead of animating.
- Erişilebilirlik / Accessibility: kutu `role="img"` ve son değeri `aria-label` olarak taşır; dönen şeritler `aria-hidden`. / the host is `role="img"` with the final value as `aria-label`; the spinning strips are `aria-hidden`.

## Ölçümler / Measurements

Hepsi `araclar/olc.mjs` koşusundan, `olcum.json` dosyasında; zamanlama değerleri koşudan koşuya oynar, güncel değerler `olcum.json`'da. Başsız Chromium 153, bu makine, masaüstü; telefon ve Safari/Firefox **ölçülmedi**. / All from the `araclar/olc.mjs` run, stored in `olcum.json`. Headless Chromium 153, this machine, desktop; phone, Safari and Firefox **not measured**.

| Ölçüt / Metric | Sonuç / Result |
|---|---|
| `odometer.js` | 8.532 bayt, gzip 3.461 bayt (hedef ≤ 51.200) / 8,532 bytes, gzip 3,461 (target ≤ 51,200) |
| `demo.html` | 6.702 bayt / bytes |
| Determinizm / Determinism | 7 zaman noktası × ileri, geri, karışık sıra: DOM aynı; 7 zaman noktasında (son faz dahil), her biri 4 farklı önceki durumdan (başa, ortaya, süre sonrasına, sona yakın bir ana atlayarak) gelinince alınan ekran görüntüleri bayt bayt aynı; aynı tohum aynı, farklı tohum farklı / 7 times × forward, reverse, shuffled: identical DOM; screenshots at 7 times (incl. the final phase), each reached from 4 different previous states (jumping to the start, the middle, past the end and near the end), are byte-identical; same seed same, different seed differs |
| Çok bileşenli sayfa / multi-component page | `b1`'in 7 bileşenli HyperFrames tanıtım sayfasında (iki odometre örneği dahil) 7 zaman noktası × 7 farklı önceki durum: ekran görüntüsü bayt bayt aynı / on `b1`'s 7-component HyperFrames promo page (two odometer instances included), 7 times × 7 different previous states: byte-identical screenshots |
| Son değer / Final value | 10 durum (0, 7, 10, 167.829 tr/en, 999.999, 1,234,567, eksi ve ondalık: -5,5 · 1,234.56 · 0,05): görünen hane dizisi `aria-label` ile aynı, son karede ölçek 1 / 10 cases (incl. negative and fraction values): visible digits equal `aria-label`, scale 1 on the final frame |
| `seek` maliyeti / cost | ort. 0,035 ms, en çok 0,6 ms (600 çağrı) / avg 0.035 ms, max 0.6 ms (600 calls) |
| Canlı kare aralığı / live frame gap | ort. 16,59 ms, p95 17,9 ms, 145 kare (hedef 16,7) / avg 16.59 ms, p95 17.9 ms, 145 frames |
| İlk boyama / first paint | FCP 184 ms, LCP 184 ms (hedef ≤ 2500) |
| axe-core 4.13.0 | 0 ihlal: t = 0, 1,2, 2,4 / 0 violations at t = 0, 1.2, 2.4 |
| Klavye / keyboard | Tab sırası oynat → baştan → dil → kaydırıcı → değer; Enter ve Boşluk oynat/duraklatı değiştirir; R baştan; kaydırıcı okları ileri-geri sarar ve oynatmayı durdurur / Tab order play → restart → language → slider → value; Enter and Space toggle play/pause; R restarts; slider arrows scrub and pause playback |
| `prefers-reduced-motion` | Açılışta son kare (`t = 2.4`), 600 ms sonra değişmiyor; normalde oynuyor / final frame on load, unchanged 600 ms later; plays normally otherwise |

## Sınırlar / Limits

- Basamakların üst/alt kenar solması hücre saydamlığıyla yapılır (`mask-image` ve `will-change` yok); saydam zeminde de çalışır. / The top/bottom fade of the digits uses per-cell opacity (no `mask-image` or `will-change`); it works on transparent backgrounds too.
- Yalnız Chromium'da ölçüldü; `mask-image` ve `ResizeObserver` kullanılıyor, eski tarayıcılar ölçülmedi. / Measured in Chromium only; `mask-image` and `ResizeObserver` are used, older browsers not measured.
- Rakamlar Latin (`-u-nu-latn`); Arapça-Hint rakamları için hane şeridi yok. / Latin digits only.
- Eksi işareti, ayraçlar, önek ve sonek sabit durur; ondalık haneler döner. / Sign, separators, prefix and suffix stay static; fraction digits spin.

Yazı tipi dosyaları (League Gothic, JetBrains Mono) SIL Open Font License altındadır; `demo.html` onları `../../assets/fonts/` altından yükler. / The League Gothic and JetBrains Mono files are under the SIL Open Font License.
