# Tasarım — frk-components (sözleşme)

Her parça aynı dosyayla üç iş görür: canlı demo, HyperFrames sahnesi, kopyalanabilir kod. Bu sayfa parçaların gerçekte uyduğu sözleşmedir; sayılar yok, onlar `olcum.json`, `OLCUM.md`, `deneme/SONUC.md`'de.

## 1. Paket ve dosya yapısı

```
components/<parca>/  <parca>.js · demo.html · README.md (TR+EN) · RECETE.md · olcum.json
assets/fonts/ (League Gothic, JetBrains Mono, OFL) · araclar/ (ölçüm) · deneme/ (HyperFrames)
index.html · README.md · OLCUM.md · DURUM.md · DURUM-b1.md · LICENSE (MIT)
```

- `<parca>.js` tek dosya, kütüphanesiz, ilk satırda `SPDX-License-Identifier: MIT`; CSS'i kendi içinden enjekte eder; yazı tipi dosyası gömmez (demo yükler).
- Parçalar: `odometer`, `prompt-terminal`, `rope-swing`, `status-orb`, `katki-isi`, `ilerleme-halkasi` (+ `kod-diff` yolda). Global ad `FRKComponents.<camelCase>`.
- RECETE.md ham prompt kaydını (düzenlenmeden), adımları, kararları, yol boyunca bulunan hataları ve sınırları taşır.

## 2. Ortak arayüz

`FRKComponents.<ad>.mount(el, opts)` → `{ seek(t), play(), pause(), destroy(), duration, ... }` (+ parçaya özgü: `input`, `setState`, `inputs`/`states`).

- `el` boyutu önceden verilmiş olmalı; bileşen kutuyu doldurur, `ResizeObserver` ile yeniden çizer. `mount` hiçbir zaman kendiliğinden oynatmaz.
- **`seek(t)` saftır**: aynı `t` + aynı seçenekler/kayıt → aynı kare, geliş yolundan bağımsız. Geçmişe bağlı parçalar (rope-swing) kaydı baştan simüle eder.
- Olaylar `el` üzerinde `CustomEvent`, `frk:` ön ekiyle: `ready`, `tick {t}`, `end {t}` + parçaya özgü (`hook`, `state` …). Özel pub/sub yok.
- `el` üzerine `data-t` (ve `data-state`) yazılır; demo kendi öğelerinde bu adları kullanmaz.
- Rastgelelik yalnız `opts.seed`'den (`mulberry32`). Kaynakta `Math.random`, `Date.now`, `performance.now`, `new Date` yok (ölçüm taraması).
- `play()` zamanı rAF'in verdiği damgadan alır; rAF'e `global['requestAnimationFrame']` ile dolaylı erişilir (HyperFrames satır içi betikte doğrudan çağrıyı hata sayar).
- `prefers-reduced-motion: reduce`: `play()` animasyon yerine son kareyi (status-orb: durumun sabit pozunu) gösterir; `seek` ortamdan bağımsız. Kullanıcı girdisi (klavye, dokunma, durum seçimi) oyunu/göstergeyi yine başlatır.
- Çekirdek DOM'suz olabilir ve Node'da yüklenir (`module.exports`): rope-swing `createSim`, yalnız `+ − × ÷ √`.
- Kayıt modeli: oyuncu/uygulama girdisi (`inputs`, `states`, `values`) olarak kaydedilir; olaylar "`t`'de şuna git" biçiminde, geçmişi değiştirmeyecek şekilde (anahtar kare değil olay), ilk girdi kaydın geri kalanını siler (devralma); kayıt başka örnekte `opts`'a verilince aynı kareleri üretir.
- Erişilebilirlik: kök `role` + `aria-label`; hareketli parçalar `aria-hidden`; olaylar görünmez `role="status"` bölgesine (kare başına değil, olay başına) yazılır; WCAG 2.2.2 için duraklatma (`P`/`Esc` veya düğme).

## 3. Canvas parçaları

- Canvas metni için yazı tipi alt kümeleri çizilecek bütün metinle önceden yüklenir: `document.fonts.load(font, metin)` (yalnız `load(font)` boşluğun alt kümesini yükler; `İ ş ü` ilk çizimde yedek yazıyla çıkar).
- Çok sayıda parçacık/şekil renk-saydamlık kümesine göre tek yolda çizilir (ayrı `fill` çağrıları komut tamponunu boşaltıp `seek` süresinde sıçrama yapar).
- Gizli yardımcı metin `data-layout-ignore`, tam kenarlı canvas `data-layout-allow-overflow` taşır (HyperFrames yerleşim denetimi).

## 4. Kimlik (FRK-OS) ve demo

- Jetonlar (`tema.mjs` klasik; zemin üstünde WCAG oranı hesaplı): zemin `#0e0d0b`, panel `#1a1712`, krem `#f1ece2` 16,50:1, soluk `#b9b4a8` 9,40:1, sarı `#ffc21a` 12,01:1; ikincil camgöbeği `#19d3e6` 10,64:1, turuncu `#ff7a1a` 7,45:1, mercan `#ff4d6d` 6,04:1. Başlık League Gothic, etiket JetBrains Mono (Türkçe harfler latin-ext dosyasında).
- `demo.html` sözleşmesi: `#stage`, `#play`, `#replay`, `#lang`, `#t` (+ `#tout`), `window.inst`, TR/EN anahtarı, 44 px dokunma hedefi, 390 px'te yatay taşma yok, `:focus-visible` sarı halka, Boşluk oynat/duraklat, `R` baştan.
- README.md iki dilli (TR üstte, EN altta); ölçüm tablosu `olcum.json`'dan; ölçülmeyen "ölçülmedi" kalır.

## 5. HyperFrames sahnesi (`deneme/`)

- `node deneme/hazirla.mjs` her parça için 5 sn'lik kompozisyon üretir; bileşen JS'i harici `<script src>`, GSAP 3.14.2 CDN etiketi, köprü proxy tween: `fromTo(P,{t:0},{t:D,duration:D,ease:'none',onUpdate(){inst.seek(P.t+t0)}})`.
- `window.__timelines = window.__timelines || {}` ve `if (window.gsap)` korumasıyla düz tarayıcıda da açılır. `onUpdate` render'da her seek'te tetiklenir (`totalTime(t,false)`); hareket bulanıklığı açılmaz.
- `data-duration` yarı açık aralıktır (son kare `D−1/fps`): animasyon `D`'den önce biter. TR/EN: `data-composition-variables` + `--variables-file`.
- Komutlar eklentinin `plugin-cli.mjs`'iyle (`npx hyperframes` değil), proje klasöründen, işçi ≤ 2, ağır işler `.agir-is.kilit` ile sıralı.
- Kanıt (`deneme/kanit.mjs`): üç sıralı `totalTime`, HyperFrames snapshot ↔ düz Chromium bayt eşitliği, 1 ↔ 2 işçili render kare MD5'i.

## 6. Ölçüm (`olcum.json`)

Boyut (ham/gzip), yasak çağrı taraması, FCP/LCP, determinizm (üç sıra piksel + durum, tohum), `seek` süresi (JS ve boşaltmalı), canlı kare aralığı, axe-core, klavye, reduced-motion, 390 px. Başsız Chromium, bu makine, masaüstü; gerçek telefon, Safari, Firefox **ölçülmedi**.

## 7. Kurallar

Depo özel (private); Pages, npm, sosyal medya yok. Sayı ancak onu yazdıran koşuyla yazılır; ölçülmeyen "ölçülmedi". Git'i yalnız YEDEK kullanır.
