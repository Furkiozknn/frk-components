# frk-components

**TR** — Tek dosyalık, kütüphanesiz, kare kare sarılabilir arayüz parçaları. Her parça aynı dosyayla üç iş görür: canlı demo, HyperFrames video sahnesi, kopyalanabilir kod. Yanında "Claude Code ile nasıl yapıldı" reçetesi (`RECETE.md`) ve gerçek ölçümler (`olcum.json`) gelir. Depo şimdilik **kamuya kapalıdır**.
**EN** — Single-file, dependency-free UI parts that can be wrapped frame by frame. Each part serves three purposes with the same file: a live demo, a HyperFrames video scene and copyable code. Each ships with a "how it was made with Claude Code" recipe (`RECETE.md`) and real measurements (`olcum.json`). The repo is **private** for now.

## Parçalar / Parts

| Parça / Part | Ne yapar / What it does | Durum / Status |
|---|---|---|
| [`odometer`](components/odometer) | Haneleri soldan sağa sırayla duran sayaç / counter whose digits stop one by one | hazır, ölçüldü / done, measured |
| [`prompt-terminal`](components/prompt-terminal) | Komutun harf harf yazıldığı, çıktının aktığı terminal (örnek senaryo) / terminal with typing and streaming output (sample script) | hazır, ölçüldü / done, measured |
| [`rope-swing`](components/rope-swing) | Kanca ipi: otopilotlu, Boşluk/dokunuşla oynanan canvas oyunu / rope swing: autopilot-driven canvas game, playable with Space or touch | hazır, ölçüldü / done, measured |
| [`status-orb`](components/status-orb) | Dört durumlu (dinliyor, düşünüyor, arıyor, bitti) deterministik parçacık küresi / deterministic particle orb with four states | hazır, ölçüldü / done, measured |
| [`katki-isi`](components/katki-isi) | Zamanla dolan katkı ısı haritası; veri örnek veridir / contribution heat map that fills over time; the data is sample data | hazır, ölçüldü / done, measured |

Hepsini bir arada görmek için `index.html`'i bir HTTP sunucusundan açın (ör. `python -m http.server`); kartlardaki ölçüm satırları `olcum.json` dosyalarını `fetch` ile okur, doğrudan `file://` açılışında tarayıcı bunu engeller. / To see them together, open `index.html` from an HTTP server; the measurement rows `fetch` the `olcum.json` files, which browsers block under `file://`.

## Ortak sözleşme / Shared contract

```js
const inst = FRKComponents.<ad>.mount(el, { seed: 1, locale: 'tr', duration: 5 });
inst.seek(2.4);   // saf: aynı t, aynı kare / pure: same t, same frame
inst.play();      // canlı demo; zamanı rAF damgasından alır / live; time comes from the rAF timestamp
inst.pause();
inst.destroy();
// el üzerinde olaylar / events on el: frk:ready, frk:tick {t}, frk:end {t}
```

- `seek(t)` çağrı sırasından bağımsızdır; HyperFrames bir GSAP zaman çizelgesiyle `seek`'i sürer. / `seek(t)` is order-independent; HyperFrames drives it from a GSAP timeline.
- Rastgelelik yalnız `opts.seed`'den (mulberry32); `Math.random`, `Date.now`, `performance.now` kullanılmaz ve bu her ölçümde kaynak taramasıyla denetlenir. / Randomness only comes from `opts.seed`; the forbidden calls are checked by a source scan on every measurement.
- `prefers-reduced-motion: reduce` altında `play()` animasyon yerine son kareyi gösterir; `seek` ortamdan bağımsız kalır. / Under `prefers-reduced-motion: reduce`, `play()` shows the final frame; `seek` stays environment-independent.
- Erişilebilirlik: kutu `role="img"` ve son durum `aria-label`; hareketli çizim `aria-hidden`. / Host is `role="img"` with the final state as `aria-label`; the moving drawing is `aria-hidden`.

## Ölçüm / Measuring

```
cd araclar && npm install        # yalnız axe-core / axe-core only
node araclar/olc.mjs components/odometer/demo.html   # olcum.json yazar / writes olcum.json
node araclar/olcum-md.mjs                            # OLCUM.md tablosu / the OLCUM.md table
```

Playwright global kurulumdan alınır (`npm root -g`). Sonuçlar [`OLCUM.md`](OLCUM.md) içinde; **gerçek telefon, Safari ve Firefox ölçülmedi**. / Playwright is taken from the global install. Results are in [`OLCUM.md`](OLCUM.md); **real phones, Safari and Firefox were not measured**.

## Kimlik ve lisanslar / Identity and licences

FRK-OS: siyah zemin, krem yazı, sarı vurgu, League Gothic başlık, JetBrains Mono etiket. Yazı tipleri SIL Open Font License altındadır (`assets/fonts/LICENSE-*.txt`). / FRK-OS: black ground, cream text, yellow accent, League Gothic headings, JetBrains Mono labels. The fonts are under the SIL Open Font License.

Depoda sosyal medya paylaşımı, npm yayını ve GitHub Pages yoktur. / No social posting, npm release or GitHub Pages is set up.
