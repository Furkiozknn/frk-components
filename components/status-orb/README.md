# Durum Küresi / Status Orb

**TR** — Dinliyor, düşünüyor, arıyor, bitti: tek dosyalık, kütüphanesiz, Canvas 2D parçacık göstergesi. Parçacık konumları her karede yalnız `t`'den hesaplanır; bu yüzden `seek(t)` herhangi bir ana gider ve aynı dosya canlı demo, HyperFrames sahnesi ve kopyalanabilir kod olarak çalışır. Ship Notes'un Signal Orb'undan esinlendi; WebGL yok, parçacıklar tohumlu, durum geçişleri kaydedilip birebir tekrarlanır.
**EN** — Listening, thinking, searching, done: a single-file, dependency-free Canvas 2D particle indicator. Particle positions are computed from `t` alone on every frame, so `seek(t)` reaches any moment and the same file works as a live demo, a HyperFrames scene and copyable code. Inspired by Ship Notes' Signal Orb; no WebGL, seeded particles, and state changes can be recorded and replayed exactly.

## Kullanım / Usage

```html
<div id="stage" style="width:480px;aspect-ratio:1/1"></div>
<script src="status-orb.js"></script>
<script>
  const inst = FRKComponents.statusOrb.mount(document.getElementById('stage'), {
    locale: 'tr',      // 'tr' | 'en': erişilebilir etiket / accessible label
    seed: 1,           // parçacık dağılımı / particle layout
    level: 0.5,        // 0–1, dinleme halkasının dalga genliği / wave amplitude of the listening ring
    // states: [[0,'listening'],[1.5,'thinking'],[3,'searching'],[4.5,'done']]   varsayılan kayıt / default record
  });
  inst.play();                 // kaydı oynat / play the record
  inst.setState('thinking');   // uygulama durumu seçer / the app picks a state
  inst.seek(2.5);              // herhangi bir ana git / jump to any time
</script>
```

Kutu kare olmalı ve boyutu önceden verilmiş olmalı; canvas kutuyu doldurur ve boyut değişince yeniden çizer. / The host should be square with a predefined size; the canvas fills it and redraws on resize.

## Durumlar / States

| Durum / State | Görünüm / Look | Renk / Colour |
|---|---|---|
| `listening` | dalgalanan çift halka; `level` dalga genliğini artırır / wavering double ring; `level` raises the amplitude | krem `#f1ece2` |
| `thinking` | dönen Lissajous düğümü / rotating Lissajous knot | camgöbeği `#19d3e6` |
| `searching` | dışa akan spiral kollar / outward spiral arms | turuncu `#ff7a1a` |
| `done` | düzgün halka ve onay işareti / a clean ring with a check mark | sarı `#ffc21a` |

Durumlar arasında 0,7 sn'lik pürüzsüz geçiş vardır; parçacıklar eski şekilden yenisine doğrusal gider. Geçiş de `t`'nin saf fonksiyonudur. / States blend over 0.7 s, and the blend is a pure function of `t` too.

## Seçenekler / Options

| Seçenek / Option | Varsayılan / Default | Anlamı / Meaning |
|---|---|---|
| `states` | 4 durumlu kayıt / 4-state record | `[[t, durum], ...]`, `t` artan / ascending |
| `locale` | `'tr'` | Etiket dili: "Asistan: düşünüyor" / "Assistant: thinking" |
| `seed` | `1` | Parçacık dağılımı; aynı tohum aynı kare / particle layout; same seed, same frame |
| `n` | `2200` | Parçacık sayısı / particle count |
| `level` | `0.5` | 0–1; `setLevel(v)` ile de değişir / also via `setLevel(v)` |
| `duration` | `6` | Toplam süre (sn) / total seconds |
| `label` | `false` | `true` ise durum adını canvas'a yazar (video için) / draws the state name on the canvas (for video) |
| `reducedMotion` | otomatik / auto | `false` verilirse `prefers-reduced-motion` yok sayılır / `false` ignores it |

## Arayüz / API

- `mount(el, opts)` → `{ seek(t), play(), pause(), destroy(), duration, setState(ad), setLevel(v), playing, state, states }`
- `seek(t)` **saf**: aynı `t`, aynı `states` kaydı ve aynı `level` her zaman aynı kareyi üretir; önceki kareye bakılmaz, simülasyon yok. / **pure**: same `t`, same `states` record and same `level`, same frame; no history, no simulation.
- `setState(ad)` o ana kadarki kaydı korur, sonrasını siler ve seçimi kaydeder; `states` kaydı JSON'dur ve başka bir örnekte `opts.states` ile aynı kareleri verir. / keeps the record up to now, drops the rest and records the choice; `states` is JSON and replays identically via `opts.states`.
- Olaylar / Events on `el`: `frk:ready` (`{duration}`), `frk:tick` (`{t}`), `frk:end` (`{t}`), `frk:state` (`{t, state}`, yalnız ileri giderken / forward only).
- `el` üzerine `data-t` ve `data-state` yazılır. / `data-t` and `data-state` are written on `el`.
- `play()` zamanı `requestAnimationFrame` damgasından alır, `performance.now()` okumaz; `prefers-reduced-motion: reduce` altında animasyon yok: durumun sabit pozu gösterilir, `setState` geçişsiz çalışır. / `play()` takes time from the `requestAnimationFrame` timestamp; under reduced motion there is no animation: a still pose of the state is shown and `setState` switches instantly.
- Erişilebilirlik / Accessibility: kök `role="img"` ve `aria-label="Asistan: <durum>"`; canvas `aria-hidden`; ileri giderken durum değişimi görünmez bir `role="status"` bölgesine yazılır (kare başına değil). / root is `role="img"` with `aria-label`; the canvas is `aria-hidden`; forward state changes go to a hidden `role="status"` region.

## Ölçümler / Measurements

Hepsi `deneme/araclar/olc-parca.mjs` koşusundan, `olcum.json` dosyasında. Başsız Chromium 153, bu makine, masaüstü; telefon, Safari ve Firefox **ölçülmedi**. / All from the `deneme/araclar/olc-parca.mjs` run, stored in `olcum.json`. Headless Chromium 153, this machine, desktop; phone, Safari and Firefox **not measured**.

| Ölçüt / Metric | Sonuç / Result |
|---|---|
| `status-orb.js` | 10.900 bayt, gzip 4.236 bayt (hedef ≤ 51.200) / 10,900 bytes, gzip 4,236 (target ≤ 51,200) |
| `demo.html` | 8.339 bayt / bytes |
| Determinizm / Determinism | 9 zaman noktası × ileri, ters, karışık sıra: ekran görüntüleri ve durum aynı; 9 karenin 9'u birbirinden farklı; aynı tohum aynı, farklı tohum farklı kare / 9 times × forward, reverse, shuffled: identical screenshots and state; all 9 frames differ from each other; same seed same, different seed differs |
| Durum kaydı ↔ tekrar / state record ↔ replay | Uygulamanın 3 durum seçtiği koşunun 3 canlı karesi, kayıtla yeniden oynatılınca aynı; 9 zaman noktasında kayıttan kurulan örnek canlı örnekle aynı; `level` kareyi değiştirir, geri alınca aynı kare / 3 live frames of a run with 3 state picks are identical when replayed from the record; a record-built instance matches the live one at 9 times; `level` changes the frame and reverting restores it |
| Kare maliyeti / frame cost | `seek` + canvas boşaltma (`getImageData`, 240 çağrı): ort. 4,89 ms, medyan 4,8 ms, p95 5,6 ms, en çok 13,1 ms. Yalnız JS süresi iki modlu (medyan 1 ms, p95 37,3 ms): canvas komut tamponu dolunca boşalıyor, bu yüzden boşaltmalı sayı esas alınır / `seek` + canvas flush: avg 4.89 ms, median 4.8 ms, p95 5.6 ms, max 13.1 ms. JS-only time is bimodal (median 1 ms, p95 37.3 ms) because the canvas command buffer flushes when full, so the flushed figure is the one to use |
| Canlı kare aralığı / live frame gap | ort. 16,57 ms, p95 17,6 ms, 225 kare (hedef 16,7) / avg 16.57 ms, p95 17.6 ms, 225 frames |
| İlk boyama / first paint | FCP 36 ms, LCP 88 ms (hedef ≤ 2500) |
| axe-core 4.13.0 | 0 ihlal: t = 0, 3, 6 / 0 violations at t = 0, 3, 6 |
| Klavye / keyboard | Tab sırası dinliyor → düşünüyor → arıyor → bitti → oynat → baştan → dil → kaydırıcı → seviye; Enter durum düğmesini seçer ve `aria-pressed` günceller; `4` tuşu "bitti"yi seçer ve etiket/canlı bölge "Asistan: bitti" olur; Boşluk oynat/duraklat; `R` baştan / Tab order listening → thinking → searching → done → play → restart → language → slider → level; Enter picks a state and updates `aria-pressed`; key `4` picks "done" and the label/live region become "Assistant: done"; Space toggles; `R` restarts |
| `prefers-reduced-motion` | Açılışta son durumun sabit pozu (`t = 6`), 600 ms sonra değişmiyor; durum seçimi anında, oynatmadan; normalde oynuyor / still pose of the last state on load, unchanged 600 ms later; state picks are instant without playing; plays normally otherwise |
| 390 px | Yatay taşma yok, sahne 358 px, en küçük düğme 44 px yüksekliğinde / no horizontal overflow, stage 358 px, smallest button 44 px tall |

## Sınırlar / Limits

- Yalnız Chromium'da ölçüldü; kare maliyeti GPU'suz olabilecek başsız tarayıcıda, telefon **ölçülmedi**. 2200 parçacıklı `lighter` birleştirme yazılım rasterda kare başına ~5 ms tutuyor; zayıf cihazda `n` düşürülmeli. / Chromium only; frame cost was measured in a headless browser that may lack a GPU, phone **not measured**. 2200 particles with `lighter` blending cost ~5 ms per frame in software raster; lower `n` on weak devices.
- Ship Notes'un Signal Orb'u WebGL ile 12.000 parçacık ve başka şekiller kullanır; bu parça onun kodunu kullanmaz. Yalnız herkese açık README'si, önizleme görseli ve durum adları incelendi. / Ship Notes' Signal Orb uses WebGL with 12,000 particles and different shapes; this component uses none of its code: only its public README, preview image and the state names were looked at.
- Ses girişi, yapay zekâ çağrısı ya da arama yapılmaz; hangi durumun gösterileceğine uygulama karar verir. / No audio input, AI call or search; the application decides which state to show.
- `duration: Infinity` ile sürekli çalışan gösterge (`play()` hiç bitmez) tasarlandı ama **denenmedi**. / A continuously running indicator via `duration: Infinity` is designed but **not tested**.
- HyperFrames'te render `deneme/` altında ayrıca yazılacak. / HyperFrames rendering will be reported separately under `deneme/`.

MIT lisanslı (`SPDX-License-Identifier: MIT`). Yazı tipi dosyaları (League Gothic, JetBrains Mono) SIL Open Font License altındadır; `demo.html` onları `../../assets/fonts/` altından yükler. / MIT licensed. The font files are under the SIL Open Font License.
