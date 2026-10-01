# Prompt terminal

**TR** — Komutun harf harf yazıldığı, çıktının satır satır aktığı tek dosyalık, kütüphanesiz terminal. Aynı dosya canlı demo, HyperFrames sahnesi ve kopyalanabilir kod olarak çalışır. Varsayılan senaryo **örnektir**, gerçek bir oturum kaydı değildir.
**EN** — A single-file, dependency-free terminal where a command types out character by character and the output streams line by line. The same file works as a live demo, a HyperFrames scene and copyable code. The default script is a **sample**, not a recorded session.

## Kullanım / Usage

```html
<div id="stage" style="width:560px;height:560px"></div>
<script src="prompt-terminal.js"></script>
<script>
  const inst = FRKComponents.promptTerminal.mount(document.getElementById('stage'), {
    locale: 'tr',   // 'tr' | 'en' — hangi varsayılan senaryo / which default script
    seed: 1,        // yazış ritmi tohumu / typing-rhythm seed
    duration: 5,    // isteğe bağlı: tüm zamanları bu süreye ölçekler / optional: scales the whole timeline
    script: [       // isteğe bağlı: kendi senaryon / optional: your own script
      { k: 'cmd',   text: 'fix the flaky test' },
      { k: 'think', text: 'Thinking…', done: 'Thought', dur: 1.1 },
      { k: 'out',   text: 'Reading tests/login.spec.js' },
      { k: 'out',   text: 'Done', accent: true },
    ],
  });
  inst.play();
  inst.seek(2.5);
</script>
```

Kutunun boyutu önceden verilmiş olmalı; yazı boyutu `cols` sütun sığacak şekilde hesaplanır. / The host element needs a predefined size; the font size fits `cols` columns.

## Seçenekler / Options

| Seçenek / Option | Varsayılan / Default | Anlamı / Meaning |
|---|---|---|
| `locale` | `'tr'` | Varsayılan senaryonun dili / language of the default script |
| `seed` | `1` | Aynı tohum aynı kare; harf aralıkları ve duraksamalar tohumdan gelir / same seed, same frame; per-letter gaps and hesitations come from it |
| `duration` | doğal süre / natural | Verilirse zaman çizelgesi bu süreye ölçeklenir / scales the timeline to this length |
| `script` | örnek / sample | Adımlar: `cmd` (harf harf yazılır), `think` (dönen gösterge, bitince `done` metni), `out` (hızlı akar; `accent`, `dim` renk verir) |
| `prompt` | `'› '` | Komut öneki / command prefix |
| `title` | `'claude · frk-components'` | Pencere başlığı / window title |
| `cols` | `44` | Genişliğe sığacak sütun sayısı / columns to fit in the width |
| `reducedMotion` | otomatik / auto | `false` verilirse `prefers-reduced-motion` yok sayılır / `false` ignores it |

Renk ve yazı tipi: `--frk-pt-bg`, `--frk-pt-fg`, `--frk-pt-accent`, `--frk-pt-dim`, `--frk-pt-bar`, `--frk-pt-font`. / Colours and font via CSS variables.

## Arayüz / API

- `mount(el, opts)` → `{ seek(t), play(), pause(), destroy(), duration }`
- `seek(t)` **saf**: aynı `t` her zaman aynı kareyi üretir, çağrı sırasından bağımsız. / **pure**: same `t`, same frame, regardless of call order.
- Olaylar / Events on `el`: `frk:ready` (`{duration, text}`), `frk:tick` (`{t}`), `frk:end` (`{t}`).
- `play()` zamanı `requestAnimationFrame` damgasından alır; `prefers-reduced-motion: reduce` altında son kareyi gösterir. / `play()` takes time from the `requestAnimationFrame` timestamp; under `prefers-reduced-motion: reduce` it shows the final frame.
- Erişilebilirlik / Accessibility: kutu `role="img"`, tam metin `aria-label`; çizim `aria-hidden`. / the host is `role="img"` with the full transcript as `aria-label`; the drawing is `aria-hidden`.
- Yalnız Latin-ext karakterler kullanılır (`›`, `•`, `-\|/`), böylece gömülü yazı tipiyle her makinede aynı çizilir. / Only Latin-ext glyphs (`›`, `•`, `-\|/`) are used, so it renders the same on every machine with the bundled font.

## Ölçümler / Measurements

`araclar/olc.mjs` koşusundan, `olcum.json` dosyasında; zamanlama değerleri koşudan koşuya oynar, güncel değerler `olcum.json`'da. Başsız Chromium 153, bu makine, masaüstü; telefon, Safari ve Firefox **ölçülmedi**. / From the `araclar/olc.mjs` run, stored in `olcum.json`. Headless Chromium 153, this machine, desktop; phone, Safari and Firefox **not measured**.

| Ölçüt / Metric | Sonuç / Result |
|---|---|
| `prompt-terminal.js` | 10.102 bayt, gzip 3.907 bayt (hedef ≤ 51.200) / 10,102 bytes, gzip 3,907 (target ≤ 51,200) |
| `demo.html` | 6.803 bayt / bytes |
| Determinizm / Determinism | 7 zaman noktası × ileri, geri, karışık sıra: DOM aynı; 7 zaman noktasında (son faz dahil), her biri 4 farklı önceki durumdan (başa, ortaya, süre sonrasına, sona yakın bir ana atlayarak) gelinince alınan ekran görüntüleri bayt bayt aynı; aynı tohum aynı, farklı tohum farklı / 7 times × forward, reverse, shuffled: identical DOM; screenshots at 7 times (incl. the final phase), each reached from 4 different previous states (jumping to the start, the middle, past the end and near the end), are byte-identical; same seed same, different seed differs |
| Son kare / Final frame | TR (7,476 sn) ve EN (7,35 sn) varsayılan senaryolarında son karede görünen 6 satır `aria-label` metniyle aynı; `duration: 5` verilince süre 5 sn ve metin yine tam / the 6 visible rows on the final frame equal the `aria-label` text for TR (7.476 s) and EN (7.35 s); with `duration: 5` the length is 5 s and the text is still complete |
| Özel senaryo / custom script | 15 adım, biri 119 karakterlik uzun satır: son karede 15 satırın tamamı var, son satır kutunun içinde, süre 9,265 sn / 15 steps incl. one 119-character line: all 15 rows present on the final frame, the last row is inside the box, length 9.265 s |
| `seek` maliyeti / cost | ort. 0,015 ms, en çok 0,2 ms (600 çağrı) / avg 0.015 ms, max 0.2 ms (600 calls) |
| Canlı kare aralığı / live frame gap | ort. 16,64 ms, p95 17,7 ms, 450 kare (hedef 16,7) / avg 16.64 ms, p95 17.7 ms, 450 frames |
| İlk boyama / first paint | FCP 36 ms, LCP 56 ms (hedef ≤ 2500) |
| axe-core 4.13.0 | 0 ihlal: t = 0, 1,2, 2,4 / 0 violations at t = 0, 1.2, 2.4 |
| Klavye / keyboard | Tab sırası oynat → baştan → dil → kaydırıcı → tohum; Enter ve Boşluk oynat/duraklatı değiştirir; R baştan; kaydırıcı okları sarar ve oynatmayı durdurur / Tab order play → restart → language → slider → seed; Enter and Space toggle play/pause; R restarts; slider arrows scrub and pause |
| `prefers-reduced-motion` | Açılışta son kare (`t = 7,476`), 600 ms sonra değişmiyor; normalde oynuyor / final frame on load, unchanged 600 ms later; plays normally otherwise |

## Sınırlar / Limits

- Yalnız Chromium'da ölçüldü; eski tarayıcılar ve Safari/Firefox ölçülmedi. / Measured in Chromium only.
- Kendi `script`'inle uzun satırlar kaydırılmaz, alt alta sarılır ve üstten taşan satırlar kesilir; son satırlar hep görünür. / With a custom `script`, long lines wrap and lines overflowing at the top are clipped; the newest lines always stay visible.

Yazı tipi dosyası (JetBrains Mono) SIL Open Font License altındadır; `demo.html` onu `../../assets/fonts/` altından yükler. / The JetBrains Mono font file is under the SIL Open Font License.
