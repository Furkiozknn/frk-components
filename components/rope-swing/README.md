# Kanca İpi / Rope Swing

**TR** — Kancayı tut, sarkaç gibi salın, doğru anda bırak ve fırla: tek dosyalık, kütüphanesiz, sabit adımlı canvas oyunu. Girdi kaydını baştan oynatan `seek(t)` sayesinde aynı dosya canlı demo, HyperFrames sahnesi ve kopyalanabilir kod olarak çalışır.
**EN** — Hold to hook, swing like a pendulum, release at the right moment and fling: a single-file, dependency-free, fixed-timestep canvas game. Because `seek(t)` replays the recorded input from the start, the same file works as a live demo, a HyperFrames scene and copyable code.

## Kullanım / Usage

```html
<div id="stage" style="width:640px;aspect-ratio:16/9"></div>
<script src="rope-swing.js"></script>
<script>
  const inst = FRKComponents.ropeSwing.mount(document.getElementById('stage'), {
    locale: 'tr',     // 'tr' | 'en': arayüz metinleri / UI strings
    seed: 1,          // yalnız arka plan yıldızları / background stars only
    duration: 6,      // sn / seconds
    // inputs: [[adım, 1|0], ...]   kayıtlı girdi; verilmezse otopilot / recorded input; default is the autopilot
  });
  inst.play();        // otopilotu oynat / play the autopilot
  inst.seek(2.5);     // herhangi bir ana git / jump to any time
</script>
```

Kutunun boyutu önceden verilmiş olmalı; canvas kutuyu doldurur ve boyut değişince yeniden çizer. / The host needs a predefined size; the canvas fills it and redraws on resize.

## Kontroller / Controls

| Girdi / Input | Sonuç / Result |
|---|---|
| Boşluk ya da Enter basılı (oyun alanı odakta) / Space or Enter held (play area focused) | Kanca: menzildeki en uygun noktaya takılır; bırakınca fırlar / hook the best point in reach; release to fling |
| Fare ya da dokunma basılı / pointer held | Aynı / same |
| `P` | Oynat/duraklat / play-pause |
| `Esc` | Duraklat / pause |

İlk girdi otopilotun geri kalanını siler ve yerine oyuncunun girdisini kaydeder (devralma). / The first input drops the rest of the autopilot and records the player's own input (takeover).

## Seçenekler / Options

| Seçenek / Option | Varsayılan / Default | Anlamı / Meaning |
|---|---|---|
| `locale` | `'tr'` | Arayüz dili / UI language |
| `seed` | `1` | Arka plan yıldızları; fizik tohumdan bağımsız / background stars; physics ignores the seed |
| `duration` | `6` | Toplam süre (sn) / total seconds (autopilot finishes at 4.86 s) |
| `inputs` | otopilot / autopilot | `[[adım, basılı], ...]`, adım = `round(t × 120)` / step = `round(t × 120)` |
| `level` | dahili / built-in | `{ start:[x,y,vx,vy], anchors:[[x,y],...], finishX }` |
| `reducedMotion` | otomatik / auto | `false` verilirse `prefers-reduced-motion` yok sayılır / `false` ignores it |

## Arayüz / API

- `mount(el, opts)` → `{ seek(t), play(), pause(), destroy(), duration, input(down), setInputs(list), playing, inputs, state }`
- `seek(t)` **saf**: aynı `t` ve aynı girdi listesi her zaman aynı kareyi üretir; geriye atlamak baştan yeniden simüle eder (≤ 720 adım). / **pure**: same `t` and same input list, same frame; seeking backwards re-simulates from step 0 (≤ 720 steps).
- `input(true|false)` oyuncu girdisi; `setInputs(null)` otopilota, `setInputs([])` boş kayda döner; `inputs` kaydı JSON olarak verir (başka bir örnekte `opts.inputs` ile birebir tekrarlanır). / player input; `setInputs(null)` restores the autopilot; `inputs` returns the record as JSON (replayable via `opts.inputs`).
- Olaylar / Events on `el`: `frk:ready` (`{duration}`), `frk:tick` (`{t, x, y}`), `frk:end` (`{t}`), `frk:hook` (`{t, ax, ay}`), `frk:release` (`{t, speed}`), `frk:finish` (`{t}`).
- Çekirdek DOM'suz: `FRKComponents.ropeSwing.createSim(level)` yalnız aritmetikle çalışır (`+ − × ÷ √`; `sin`, `cos`, `hypot` yok), Node'da da yüklenir. / The core has no DOM and uses arithmetic only, so it also loads in Node.
- `play()` zamanı `requestAnimationFrame` damgasından alır, `performance.now()` okumaz; `prefers-reduced-motion: reduce` altında animasyon yerine son kareyi gösterir. Kullanıcı girdisi (klavye, dokunma) o tercihte de oyunu başlatır. / `play()` takes time from the `requestAnimationFrame` timestamp; under reduced motion it shows the final frame, while user input still starts the game.
- Erişilebilirlik / Accessibility: oyun alanı `role="application"` + `aria-label`, odaklanabilir, kullanım ipucu `aria-describedby`; canvas `aria-hidden`; kanca/bırakma/bitiş olayları görünmez bir `role="status"` bölgesine yazılır. / the play area is a focusable `role="application"` with a label and a hint; the canvas is `aria-hidden`; hook/release/finish go to a hidden status region.

## Fizik / Physics

Sabit adım 1/120 sn; yerçekimi 1100 px/sn², kanca menzili 240 px, sönüm 0,10/sn, bırakma çarpanı ×1,10 (hız ≥ 380 px/sn iken), hız tavanı 900 px/sn. Halat sert kısıttır: gerildiğinde konum çembere izdüşürülür ve dışa doğru hız atılır. Menzil, bırakma çarpanı, eşik, tavan ve sönüm değerleri `Furkiozknn/kanca` oyunundaki ayarlardan alındı; yerçekimi ve adım uzunluğu farklı, yani bu bir port değil yeniden yazım. / Fixed 1/120 s step; gravity 1100 px/s², reach 240 px, damping 0.10/s, release bonus ×1.10 above 380 px/s, speed cap 900 px/s. The rope is a hard constraint. Reach, bonus, threshold, cap and damping come from the settings of the `kanca` game; gravity and step differ, so this is a rewrite, not a port.

Otopilot kaydı `deneme/araclar/rope-bot.mjs` ile üretilir (ışın araması); 7 kancayla 4,86 sn'de bitirir ve hiç düşmez. / The autopilot record comes from `deneme/araclar/rope-bot.mjs` (beam search): 7 hooks, finishes at 4.86 s, never falls.

## Ölçümler / Measurements

Hepsi `deneme/araclar/olc-parca.mjs` koşusundan, `olcum.json` dosyasında. Başsız Chromium 153, bu makine, masaüstü; telefon, Safari ve Firefox **ölçülmedi**. / All from the `deneme/araclar/olc-parca.mjs` run, stored in `olcum.json`. Headless Chromium 153, this machine, desktop; phone, Safari and Firefox **not measured**.

| Ölçüt / Metric | Sonuç / Result |
|---|---|
| `rope-swing.js` | 15.170 bayt, gzip 5.530 bayt (hedef ≤ 51.200) / 15,170 bytes, gzip 5,530 (target ≤ 51,200) |
| `demo.html` | 7.393 bayt / bytes |
| Determinizm / Determinism | 9 zaman noktası × ileri, ters, karışık sıra: ekran görüntüleri ve durum JSON'u aynı; aynı tohum aynı, farklı tohum farklı kare / 9 times × forward, reverse, shuffled: identical screenshots and state JSON; same seed same, different seed differs |
| Canlı oyun ↔ kayıt / live play ↔ record | Oyuncu girdisiyle (6 olay) oynanan koşunun 6 karesi, kaydedilen girdiyle yeniden oynatılınca aynı / 6 frames of a live run (6 events) are identical when replayed from the recorded input |
| `seek` maliyeti / cost | JS: ort. 0,075 ms, p95 0,2 ms, en çok 1,0 ms (240 çağrı). JS + canvas boşaltma (`getImageData`): ort. 0,526 ms, medyan 0,3 ms, p95 0,6 ms, en çok 39,7 ms / JS: avg 0.075 ms, p95 0.2 ms, max 1.0 ms (240 calls); JS + canvas flush: avg 0.526 ms, median 0.3 ms, p95 0.6 ms, max 39.7 ms |
| Canlı kare aralığı / live frame gap | ort. 16,66 ms, p95 17,8 ms, 354 kare (hedef 16,7) / avg 16.66 ms, p95 17.8 ms, 354 frames |
| İlk boyama / first paint | FCP 32 ms, LCP 60 ms (hedef ≤ 2500) |
| axe-core 4.13.0 | 0 ihlal: t = 0, 3, 6 / 0 violations at t = 0, 3, 6 |
| Klavye / keyboard | Tab sırası oyun alanı → oynat → baştan → otopilot → kendin oyna → dil → kaydırıcı; Boşluk basılı = kanca takıldı, bırakınca bırakıldı; `P` oynat/duraklat, `Esc` duraklat / Tab order play area → play → restart → autopilot → play yourself → language → slider; Space held hooks, release unhooks; `P` toggles, `Esc` pauses |
| Fare / pointer | Canvas'ta basılı tutunca girdi kaydı ve oynatma başlar (Playwright faresiyle) / holding on the canvas records input and starts playing (Playwright mouse) |
| `prefers-reduced-motion` | Açılışta son kare (`t = 6`), 600 ms sonra değişmiyor; Boşluk yine de oyunu başlatır; normalde oynuyor / final frame on load, unchanged 600 ms later; Space still starts the game; plays normally otherwise |
| 390 px | Yatay taşma yok, sahne 358 px, en küçük düğme 44 px yüksekliğinde / no horizontal overflow, stage 358 px, smallest button 44 px tall |

## Sınırlar / Limits

- Yalnız Chromium'da ölçüldü. Gerçek dokunmatik cihaz denenmedi; dokunma yolu işaretçi olaylarıyla (fare) sınandı. / Chromium only. No real touch device; the touch path was tested through pointer events (mouse).
- Oynanış hissi ve zorluk **ölçülmedi**: otopilot bir bot, insan testi yapılmadı. / Game feel and difficulty are **not measured**: the autopilot is a bot, no human test.
- Fizik `sin`/`cos`/`hypot` kullanmaz, yalnız `+ − × ÷` ve `Math.sqrt`; ama `Math.sqrt` için tam yuvarlama şartname garantisi yok, Safari/Firefox'ta bit düzeyinde aynılık **denenmedi**. / The physics avoids `sin`/`cos`/`hypot` and uses only `+ − × ÷` and `Math.sqrt`; the spec does not guarantee correctly rounded `Math.sqrt`, and bit-level equality in Safari/Firefox was **not tested**.
- Düşen oyuncu başa döner, süre durmaz; kontrol noktası, kırılgan/hareketli nokta ve rüzgâr yok. / A fallen player respawns at the start and time keeps running; no checkpoints, breakable/moving points or wind.
- HyperFrames'te render `deneme/` altında ayrıca yazılacak. / HyperFrames rendering will be reported separately under `deneme/`.

MIT lisanslı (`SPDX-License-Identifier: MIT`). Yazı tipi dosyaları (League Gothic, JetBrains Mono) SIL Open Font License altındadır; `demo.html` onları `../../assets/fonts/` altından yükler. / MIT licensed. The font files are under the SIL Open Font License.
