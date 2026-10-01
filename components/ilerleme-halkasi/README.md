# İlerleme Halkası / Progress Ring

**TR** — Yüzde dolan halka: tek dosyalık, kütüphanesiz Canvas 2D göstergesi. Her kare yalnız `t`'den hesaplanır; `seek(t)` herhangi bir ana gider ve aynı dosya canlı demo, HyperFrames sahnesi ve kopyalanabilir kod olarak çalışır. Hedef değeri uygulama değiştirir; değişiklikler kaydedilir ve başka bir örnekte birebir tekrarlanır.
**EN** — A ring that fills to a percentage: a single-file, dependency-free Canvas 2D indicator. Every frame is computed from `t` alone, so `seek(t)` reaches any moment and the same file works as a live demo, a HyperFrames scene and copyable code. The application changes the target value; changes are recorded and replay identically in another instance.

## Kullanım / Usage

```html
<div id="stage" style="width:480px;aspect-ratio:1/1"></div>
<script src="ilerleme-halkasi.js"></script>
<script>
  const inst = FRKComponents.ilerlemeHalkasi.mount(document.getElementById('stage'), {
    value: 72,        // hedef %, 0–100 / target %
    duration: 2.4,    // sn: ilk dolma süresi / seconds: initial fill
    locale: 'tr',     // 'tr' → %72 · 'en' → 72%
    seed: 1,          // uçtaki kıvılcımlar / sparks at the head
  });
  inst.play();             // dolsun / fill
  inst.setValue(35);       // mevcut değerden 35'e yumuşakça git / glide to 35 from the current value
  inst.seek(1.2);          // herhangi bir ana git / jump to any time
</script>
```

Kutu kare olmalı ve boyutu önceden verilmiş olmalı; canvas kutuyu doldurur ve boyut değişince yeniden çizer. / The host should be square with a predefined size; the canvas fills it and redraws on resize.

## Seçenekler / Options

| Seçenek / Option | Varsayılan / Default | Anlamı / Meaning |
|---|---|---|
| `value` | `72` | Hedef yüzde / target percentage |
| `from` | `0` | Başlangıç değeri / starting value |
| `duration` | `2.4` | İlk dolma süresi (sn) / initial fill time |
| `values` | `[[0, value, duration]]` | Değer çizelgesi `[[t, hedef, süre], ...]`: `t` anında mevcut değerden hedefe `süre` sn'de gidilir / schedule: at `t`, glide from the current value to the target over `süre` seconds |
| `transition` | `0.8` | `setValue`'nun varsayılan geçiş süresi (sn) / default glide time of `setValue` |
| `locale` | `'tr'` | Etiket dili ve yüzde biçimi / label language and percent format |
| `seed` | `1` | Kıvılcım dağılımı; aynı tohum aynı kare / spark layout; same seed, same frame |
| `reducedMotion` | otomatik / auto | `false` verilirse `prefers-reduced-motion` yok sayılır / `false` ignores it |

## Arayüz / API

- `mount(el, opts)` → `{ seek(t), play(), pause(), destroy(), setValue(v, geçiş), duration, playing, value, values, state }`
- `seek(t)` **saf**: aynı `t` ve aynı `values` kaydı her zaman aynı kareyi üretir. Değer, önceki olaylar üzerinden `power3.out` ile hesaplanır; yeni olay eklemek geçmiş kareleri değiştirmez. / **pure**: same `t` and same `values` record, same frame; the value is computed from the earlier events with `power3.out`, so appending an event never changes past frames.
- `setValue(v)` o ana kadarki çizelgeyi korur, sonrasını siler ve mevcut değerden `v`'ye geçiş ekler; `values` kaydı JSON'dur ve başka bir örnekte `opts.values` ile aynı kareleri verir. / keeps the schedule up to now, drops the rest and adds a glide from the current value to `v`; `values` is JSON and replays identically via `opts.values`.
- Olaylar / Events on `el`: `frk:ready` (`{duration}`), `frk:tick` (`{t, value}`), `frk:end` (`{t}`), `frk:done` (`{t}`, değer %100'e ilk vardığında, yalnız ileri giderken / when the value first reaches 100, forward only).
- `el` üzerine `data-t` ve `data-value` yazılır. / `data-t` and `data-value` are written on `el`.
- `play()` zamanı `requestAnimationFrame` damgasından alır, `performance.now()` okumaz; `prefers-reduced-motion: reduce` altında animasyon yok: hedef değer sabit gösterilir, `setValue` geçişsiz çalışır. / `play()` takes time from the `requestAnimationFrame` timestamp; under reduced motion the target value is shown still and `setValue` switches instantly.
- Erişilebilirlik / Accessibility: kök `role="progressbar"`, `aria-label`, `aria-valuemin/max`, `aria-valuenow` = hedef değer (kare başına değişmez), `aria-valuetext` ("%72 ilerleme" / "%100 tamamlandı"); canvas `aria-hidden`; %100'e varınca görünmez `role="status"` bölgesi "%100 tamamlandı" der. / the root is a `progressbar` whose `aria-valuenow` is the target value (it does not change per frame); on reaching 100 a hidden status region announces completion.

## Ölçümler / Measurements

Hepsi `deneme/araclar/olc-parca.mjs` koşusundan, `olcum.json` dosyasında. Başsız Chromium 153, bu makine, masaüstü; telefon, Safari ve Firefox **ölçülmedi** (Firefox 155 ve WebKit 26.6 sonuçları aşağıdaki Sınırlar'da ve `deneme/SONUC.md`'de). / All from the `deneme/araclar/olc-parca.mjs` run, stored in `olcum.json`. Headless Chromium 153, this machine, desktop; phone and Safari **not measured**.

| Ölçüt / Metric | Sonuç / Result |
|---|---|
| `ilerleme-halkasi.js` | 10.665 bayt, gzip 4.164 bayt (hedef ≤ 51.200) / 10,665 bytes, gzip 4,164 (target ≤ 51,200) |
| `demo.html` | 6.951 bayt / bytes |
| Determinizm / Determinism | 9 zaman noktası × ileri, ters, karışık sıra: ekran görüntüleri ve durum aynı; 9 karenin 9'u farklı; aynı tohum aynı, farklı tohum farklı kare / 9 times × forward, reverse, shuffled: identical screenshots and state; all 9 frames differ; same seed same, different seed differs |
| Değer kaydı ↔ tekrar / value record ↔ replay | Uygulamanın 3 kez `setValue` verdiği koşunun 3 canlı karesi, kayıtla yeniden oynatılınca aynı; 8 zaman noktasında kayıttan kurulan örnek canlı örnekle aynı / 3 live frames of a run with 3 `setValue` calls are identical when replayed from the record; a record-built instance matches the live one at 8 times |
| Değer eğrisi / value curve | `t = duration`'da hedefe tam varır (72); `t = duration / 2`'de 63 (`power3.out`) / reaches the target exactly at `t = duration`; 63 at half time |
| Tamamlanma / completion | `value: 100` ileri giderken `frk:done` bir kez; canlı bölge "%100 tamamlandı" / `frk:done` fires once going forward; the live region reads "%100 tamamlandı" |
| Kare maliyeti / frame cost | `seek` JS süresi: ort. 0,07 ms, p95 0,2 ms, en çok 0,4 ms; `seek` + canvas boşaltma (`getImageData`, 240 çağrı): ort. 1,56 ms, medyan 1,5 ms, p95 2,2 ms, en çok 2,9 ms / `seek` JS time: avg 0.07 ms, p95 0.2 ms, max 0.4 ms; `seek` + canvas flush: avg 1.56 ms, median 1.5 ms, p95 2.2 ms, max 2.9 ms |
| Canlı kare aralığı / live frame gap | 146 kare (144 beklenen), ort. 16,66 ms, p95 17,8 ms, en uzun aralık 19 ms (hedef 16,7) / 146 frames (144 expected), avg 16.66 ms, p95 17.8 ms, longest gap 19 ms |
| İlk boyama / first paint | FCP 48 ms, LCP 96 ms (hedef ≤ 2500) |
| axe-core 4.13.0 | 0 ihlal: t = 0, 1,2, 2,4 / 0 violations at t = 0, 1.2, 2.4 |
| Klavye / keyboard | Tab sırası oynat → baştan → dil → zaman → hedef; hedef kaydırıcısında →→ değeri 72'den 74'e götürür (`aria-valuenow` = 74), `Home` 0'a; Boşluk oynat/duraklat; `R` baştan / Tab order play → restart → language → time → target; →→ on the target slider moves 72 → 74 (`aria-valuenow` = 74), `Home` → 0; Space toggles; `R` restarts |
| `prefers-reduced-motion` | Açılışta son kare (`t = 2,4`), 600 ms sonra değişmiyor; değer değişimi anında (35), oynatmadan; normalde oynuyor / final frame on load, unchanged 600 ms later; value change is instant (35) without playing; plays normally otherwise |
| 390 px | Yatay taşma yok, sahne 358 px, en küçük düğme 44 px yüksekliğinde / no horizontal overflow, stage 358 px, smallest button 44 px tall |

## Sınırlar / Limits

- Chromium 153, Firefox 155.0 ve WebKit 26.6'da (Playwright, Windows, başsız; WebKit Safari değildir) ölçüldü: üçünde de kendi içinde determinizm (8 zaman × 3 sıra), axe 0 ihlal, konsol hatası yok, reduced-motion'da son kare; Chromium'a göre Firefox PSNR 37,1–38,8 dB (yazı tipi/kenar yumuşatma farkı), WebKit karesi 2 px farklı yükseklikte olduğundan PSNR yok. Gerçek telefon, Safari/iOS ve gerçek dokunmatik **ölçülmedi**. / Measured in Chromium 153, Firefox 155.0 and WebKit 26.6 (Playwright, Windows, headless; WebKit is not Safari): in all three, in-engine determinism (8 times × 3 orders), 0 axe violations, no console errors, final frame under reduced motion; Firefox PSNR vs Chromium 37.1–38.8 dB; WebKit frames are 2 px taller so no PSNR. Real phone, Safari/iOS and real touch **not measured**.
- Değer tam sayıya yuvarlanarak yazılır (`decimals` yok). / The value is shown rounded to an integer (no `decimals`).
- Tek halka, tek değer; çok halkalı/iç içe gösterge yok. / One ring, one value; no multi-ring layout.
- HyperFrames: 5 sn'lik 1080×1080 kompozisyon (`deneme/ilerleme-halkasi/`), `check` 0 bulgu, TR+EN render (0,56 MB); aynı `t` aynı kare düz Chromium'da ileri/ters/karışık sırada, HyperFrames snapshot'ıyla bayt bayt ve 1 ↔ 2 işçili render'da 150/150 kare aynı (`deneme/SONUC.md`, `deneme/KANIT.json`). Canvas içindeki yüzde metnini HyperFrames kontrast denetimi görmez; renk oranları ayrıca hesaplandı. / HyperFrames: a 5 s 1080×1080 composition (`deneme/ilerleme-halkasi/`), `check` clean, TR+EN renders (0.56 MB); the same `t` gives the same frame in plain Chromium across orders, byte-equal to the HyperFrames snapshot, and 150/150 identical frames across 1 vs 2 render workers. HyperFrames' contrast audit cannot see canvas text; the colour ratios were computed separately.

MIT lisanslı (`SPDX-License-Identifier: MIT`). Yazı tipi dosyaları (League Gothic, JetBrains Mono) SIL Open Font License altındadır; `demo.html` onları `../../assets/fonts/` altından yükler. / MIT licensed. The font files are under the SIL Open Font License.
