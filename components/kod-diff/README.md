# Kod diff / Code diff

**TR** — Eklenen satırların harf harf yazıldığı, silinen satırların kırmızıyla işaretlenip çizildiği ya da çöktüğü, tek dosyalık, kütüphanesiz kod farkı animasyonu. "Claude Code ile" videoları için tasarlandı. Aynı dosya canlı demo, HyperFrames sahnesi ve kopyalanabilir kod olarak çalışır. Varsayılan değişiklik **örnektir**, gerçek bir oturum kaydı değildir; başlıkta "örnek diff" yazar.
**EN** — A single-file, dependency-free code-diff animation: added lines type out character by character, removed lines are marked red and then struck through or collapsed. Made for "built with Claude Code" videos. The same file works as a live demo, a HyperFrames scene and copyable code. The default change is a **sample**, not a recorded session; the title says "sample diff".

## Kullanım / Usage

```html
<div id="stage" style="width:560px;height:560px"></div>
<script src="kod-diff.js"></script>
<script>
  const inst = FRKComponents.kodDiff.mount(document.getElementById('stage'), {
    locale: 'tr',     // 'tr' | 'en' — başlık ve erişilebilirlik metni / title and accessible label
    seed: 1,          // yazış ritmi tohumu / typing-rhythm seed
    mode: 'diff',     // 'diff': silinen satır üstü çizili kalır · 'apply': silinen satır çöker / removed lines stay struck through · removed lines collapse
    duration: 5,      // isteğe bağlı: tüm zamanları bu süreye ölçekler / optional: scales the whole timeline
    title: 'src/f.js',
    diff: [           // isteğe bağlı: kendi değişikliğin / optional: your own change
      { k: 'ctx', text: 'function f() {' },
      { k: 'del', text: '  return 1;' },
      { k: 'add', text: '  return 2;' },
      { k: 'ctx', text: '}' },
    ],
  });
  inst.play();
  inst.seek(2.5);
</script>
```

Kutunun boyutu önceden verilmiş olmalı; yazı tipi `cols` sütun sığacak şekilde hesaplanır. / The host needs a predefined size; the font fits `cols` columns.

## Seçenekler / Options

| Seçenek / Option | Varsayılan / Default | Anlamı / Meaning |
|---|---|---|
| `diff` | örnek / sample | Satırlar: `{ k, text }`; `k` = `ctx` (olduğu gibi), `del` (silinir), `add` (yazılır). Ardışık `del`/`add` satırları bir blok olur / lines; consecutive `del`/`add` lines form a block |
| `mode` | `'diff'` | `'apply'`: silinen satırlar çöker, son kare uygulanmış dosyadır / removed lines collapse, the last frame is the applied file |
| `locale` | `'tr'` | Başlık ve `aria-label` dili / title and `aria-label` language |
| `seed` | `1` | Harf aralıkları tohumdan; aynı tohum aynı kare / per-letter gaps come from it; same seed, same frame |
| `duration` | doğal süre / natural | Verilirse zaman çizelgesi bu süreye ölçeklenir / scales the timeline to this length |
| `title` | `'src/hero.js · örnek diff'` | Başlık çubuğu metni / title-bar text |
| `cols` | `44` | Genişliğe sığacak sütun sayısı / columns to fit in the width |
| `reducedMotion` | otomatik / auto | `false` verilirse `prefers-reduced-motion` yok sayılır / `false` ignores it |

Renk ve yazı tipi: `--frk-kd-bg`, `--frk-kd-fg`, `--frk-kd-dim`, `--frk-kd-add`, `--frk-kd-del`, `--frk-kd-bar`, `--frk-kd-font`. / Colours and font via CSS variables.

## Arayüz / API

- `mount(el, opts)` → `{ seek(t), play(), pause(), destroy(), duration }`
- `seek(t)` **saf**: aynı `t` her zaman aynı kareyi üretir, çağrı sırasından bağımsız. Başlıktaki `+A −D` sayaçları o ana kadar yazılan ve işaretlenen satırlardır. / **pure**: same `t`, same frame, regardless of call order. The `+A −D` counters in the title bar are the lines typed and marked so far.
- Olaylar / Events on `el`: `frk:ready` (`{duration, added, removed}`), `frk:tick` (`{t}`), `frk:end` (`{t}`).
- `play()` zamanı `requestAnimationFrame` damgasından alır; `prefers-reduced-motion: reduce` altında son kareyi gösterir. / `play()` takes time from the `requestAnimationFrame` timestamp; under `prefers-reduced-motion: reduce` it shows the final frame.
- Erişilebilirlik / Accessibility: kutu `role="img"`; `aria-label` dosya adını, eklenen ve silinen satır sayısını ve satırların metnini söyler; çizim `aria-hidden`. Renk tek başına taşıyıcı değil: `+` / `-` işareti ve üstü çizili yazı da var. / the host is `role="img"`; `aria-label` states the file, the counts and the text of the changed lines; the drawing is `aria-hidden`. Colour is not the only cue: there is a `+` / `-` sign and strike-through too.

## Ölçümler / Measurements

`araclar/olc.mjs` koşusundan, `olcum.json` dosyasında; zamanlama değerleri koşudan koşuya oynar, güncel değerler `olcum.json`'da. Başsız Chromium 153, bu makine, masaüstü; telefon ve gerçek Safari **ölçülmedi**. / From the `araclar/olc.mjs` run, stored in `olcum.json`; timings vary between runs, the current values are in `olcum.json`. Headless Chromium 153, this machine, desktop; phone and real Safari **not measured**.

| Ölçüt / Metric | Sonuç / Result |
|---|---|
| `kod-diff.js` | 12.655 bayt, gzip 4.688 bayt (hedef ≤ 51.200) / 12,655 bytes, gzip 4,688 (target ≤ 51,200) |
| `demo.html` | 7.366 bayt / bytes |
| Determinizm / Determinism | 7 zaman noktası × ileri, geri, karışık sıra: DOM aynı; 7 zaman noktasında (son faz dahil), her biri 4 farklı önceki durumdan gelinince alınan ekran görüntüleri bayt bayt aynı; aynı tohum aynı, farklı tohum farklı / 7 times × forward, reverse, shuffled: identical DOM; screenshots at 7 times (incl. the final phase), each reached from 4 different previous states, are byte-identical; same seed same, different seed differs |
| `apply` modu / mode | Aynı piksel karşılaştırması `apply` modunda da aynı (7 zaman, 4 önceki durum); son karede 1 satır çökmüş, süre 5,432 sn (varsayılan modda 5,282 sn) / the same pixel comparison passes in `apply` mode; 1 row collapsed on the final frame, length 5.432 s (5.282 s in the default mode) |
| Özel `diff` / custom `diff` | 5 satırlık özel değişiklik (biri 119 karakterlik uzun satır, biri boş satır): son karede 5 satır, sayaç "+2 −1", başlık "ozel.js", uzun satır sağdan kesiliyor, hiçbir satır kutudan taşmıyor; EN `aria-label` tekil/çoğul doğru / a 5-line custom change (one 119-character line, one empty line): 5 rows on the final frame, counter "+2 −1", the long line is clipped on the right and no row overflows the box; the EN `aria-label` has correct singular/plural |
| Son kare / Final frame | 11 satır, sayaç "+4 −1"; `aria-label` "src/hero.js dosyasında 4 satır eklendi, 1 satır silindi. Ekl…" / 11 rows, counter "+4 −1" |
| `seek` maliyeti / cost | ort. 0,024 ms, en çok 1,1 ms (600 çağrı) / avg 0.024 ms, max 1.1 ms (600 calls) |
| Canlı kare aralığı / live frame gap | ort. 16,65 ms, p95 18 ms, 318 kare (hedef 16,7) / avg 16.65 ms, p95 18 ms, 318 frames |
| İlk boyama / first paint | FCP 144 ms, LCP 252 ms (hedef ≤ 2500) |
| axe-core 4.13.0 | 0 ihlal: t = 0, 1,2, 2,4 / 0 violations at t = 0, 1.2, 2.4 |
| 390 px | Chromium mobil emülasyonu: yatay taşma yok, en küçük dokunma hedefi 44 px, axe 0 ihlal / Chromium mobile emulation: no horizontal overflow, smallest touch target 44 px, axe 0 |
| Klavye / keyboard | Tab sırası oynat → baştan → dil → kaydırıcı → tohum → mod; Enter ve Boşluk oynat/duraklatı değiştirir; R baştan; kaydırıcı okları sarar ve oynatmayı durdurur / Tab order play → restart → language → slider → seed → mode; Enter and Space toggle play/pause; R restarts; slider arrows scrub and pause |
| `prefers-reduced-motion` | Açılışta son kare (`t = 5,282`), 600 ms sonra değişmiyor; normalde oynuyor / final frame on load, unchanged 600 ms later; plays normally otherwise |

## Sınırlar / Limits

- Yalnız Chromium'da ölçüldü (Firefox/WebKit çapraz motor koşusu bu parçayı kapsamıyor). / Measured in Chromium only (the cross-engine run does not cover this part).
- Satırlar kaydırılmaz ve kırılmaz: `cols` sütundan uzun satır sağdan kesilir. Özel `diff` yolu tek bir 5 satırlık örnekle denendi; başka dil ve yapıdaki kodlar denenmedi. / The custom-`diff` path was tried with one 5-line example; other languages or structures were not.
- Söz dizimi renklendirmesi yoktur. / There is no syntax highlighting.
- HyperFrames'te render **denenmedi** (`deneme/` altında bu parça için kompozisyon yok). / HyperFrames render was **not tried** (there is no composition for this part under `deneme/`).

Yazı tipi dosyası (JetBrains Mono) SIL Open Font License altındadır; `demo.html` onu `../../assets/fonts/` altından yükler. / The JetBrains Mono font file is under the SIL Open Font License.
