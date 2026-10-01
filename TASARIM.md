# Tasarım — frk-components

Pilot: `rakip-analizi-bilesen-vitrinleri.md`'deki öneri. İlk üç parça: `odometer`, `prompt-terminal`, `rope-swing`. Bu dosya Pazartesi 05.10'a kadar tek üretim; kod yok.

## 1. Ortak parça arayüzü

Her bileşen tek bir global adın altında kayıtlı bir `mount` fonksiyonu dışa verir:

```js
window.FRKComponents = window.FRKComponents || {};
FRKComponents.odometer = { mount };

function mount(el, opts = {}) {
  // el: boyutu önceden belirlenmiş HTMLElement. mount el'in içini temizler, kendi DOM'unu kurar.
  // opts: { seed = 1, duration, locale = 'tr', ...bileşene özgü alanlar (recete.md'de) }
  return {
    seek(t) { /* ... */ },   // t: saniye, float, ≥ 0 — saf, deterministik, rastgele erişime açık
    play() { /* ... */ },    // rAF döngüsü başlatır; yalnız canlı demo modunda kullanılır
    pause() { /* ... */ },   // rAF döngüsünü durdurur, son kare ekranda kalır
    destroy() { /* ... */ }, // rAF iptali, dinleyici temizliği, el boşaltılır
  };
}
```

**Kurallar (proje CLAUDE.md'den, burada somutlaşır):**
- `seek(t)` saf bir fonksiyondur: aynı `t` her zaman aynı pikseli üretir, çağrı sırasından bağımsız. İleri de geri de atlanabilir (tam yeniden çizim, artımlı değil).
- Render mantığı **asla** `performance.now()`/`Date.now()` okumaz. Tek istisna: `play()`'in kendi rAF döngüsü — orada canlı saat okunur, hemen `seek(t)`'e çevrilir. Bu, projede izin verilen tek saat okuma noktasıdır ve her bileşen dosyasında aynı 5-6 satırlık kalıptır (kopyalanır, icat edilmez).
- Rastgelelik yalnız `opts.seed`'den türeyen yerel bir PRNG'den gelir (mulberry32 benzeri, ~6 satır). Ham `Math.random()` çağrısı yok.
- Olaylar: özel bir pub/sub yazılmaz. `instance` nesnesi `el` üzerinde yerel `CustomEvent` yayınlar (`frk:` ön ekiyle): `frk:ready` (ilk `seek(0)` sonrası), `frk:tick` (her `seek` sonrası, `detail: {t}`), bileşene özgü olaylar (`frk:grab`, `frk:score` gibi) recete.md'de belgelenir. Dinleme standart: `el.addEventListener('frk:ready', fn)`.
- `mount()` tek kaynak: hem dosyanın kendi HyperFrames kökü hem canlı demo hem başka bir projeye kopyalanan kullanım aynı `mount(el, opts)` çağrısından geçer.

## 2. Dosya yapısı

```
frk-components/
  index.html                     -- depo kök vitrini: 3 kart, FRK-OS kimliği
  TASARIM.md / YONLENDIRME.md / DURUM.md
  components/
    odometer/
      odometer.html              -- TEK DOSYA: bileşen + canlı demo + HyperFrames sahnesi
      recete.md                  -- gerçek prompt kaydı + kararlar
      olcum.json                 -- ölçüm sonuçları (bkz. §5); boş alan "ölçülmedi"
    prompt-terminal/  (aynı 3 dosya)
    rope-swing/       (aynı 3 dosya)
  assets/
    tema.css                     -- yalnız index.html için; bileşen dosyaları buna bağlanmaz
  araclar/
    olc.mjs                      -- 3 bileşen için ortak ölçüm betiği (Playwright + axe-core)
```

**Neden bileşen başına tek `.html`, ayrı demo/sahne dosyası değil:** HyperFrames bir kompozisyonu `data-width`/`data-height` pikselinde, kök elemanın üstüne damgalayarak yakalar (`hyperframes-core` sözleşmesi). Kök elemanın **dışına** konan her şey (demo kontrolleri: oynat/duraklat, kaydırıcı, dil anahtarı) render'da hiç görünmez — geometrik olarak dışarıda kalır, ortam algılama (`if HyperFrames then...`) yazmaya gerek yok. Aynı dosya içinde:
- `<style>` + bileşen mantığı (`<script>` içindeki `mount`) = kopyalanabilir kod,
- `data-composition-id` taşıyan kök + kayıtlı GSAP zaman çizelgesi = HyperFrames sahnesi,
- kökün dışındaki ince kontrol şeridi = canlı demo arayüzü.

**Neden `tema.css` bileşene link edilmiyor:** "tek dosyalık, kütüphanesiz" vaadi bağımsızlığı önceliklendirir; her bileşen kendi `<style>`'ında FRK-OS renk/yazı değerlerini gömer (birkaç satır tekrar, kabul edilir maliyet). `tema.css` yalnız vitrin sayfasının ortak iskeletidir.

## 3. HyperFrames sahnesi — somut sözleşme

Her bileşen dosyasının kökü:

```html
<div id="root" data-composition-id="<ad>" data-width="1080" data-height="1080" data-duration="<saniye>">
  <!-- mount()'un kurduğu DOM -->
</div>
<script>
  const instance = FRKComponents['<ad>'].mount(document.getElementById('root'), { seed: 1 });
  window.__timelines = window.__timelines || {};
  window.__timelines['<ad>'] = gsap.timeline({ paused: true })
    .to({}, { duration: <saniye>, onUpdate() { instance.seek(this.progress() * <saniye>); } });
</script>
```

- Varsayılan tuval: **1080×1080 kare** — Reels'in güvenli kolonuna da sığar, demo kartına da (rakip analizindeki video kontratı: "zamanı dışarıdan alır" kuralı burada GSAP zaman çizelgesinin `seek`'i sürmesiyle karşılanır).
- `data-duration` bileşene göre sabit, recete.md'de gerekçelendirilir (ör. odometre: sayacın 0'dan hedefe ulaştığı süre).
- Determinizm yasakları (`determinism-rules.md`): `repeat: -1` yok, render anında ağ çağrısı yok, `<video data-start>` iç içe yok. Font varsa `@font-face` dosya içinde gömülü (Google Fonts linki değil — tek dosya kuralı).
- Canlı demo modunda kök elemanın **altına**, ayrı bir `<div class="frk-demo">` (dışarıda, data-composition-id öznesi değil) oynat/duraklat düğmesi ve kaydırıcı konur; bunlar `instance.play()/pause()/seek()`'i çağırır. `prefers-reduced-motion: reduce` altında sayfa açılışında otomatik `play()` tetiklenmez, yalnız `seek(0)` gösterilir.

## 4. Demo sayfası düzeni (`index.html`)

- FRK-OS kimliği: siyah zemin, krem yazı, sarı vurgu, League Gothic başlık, mono etiket (`assets/tema.css`).
- Üstte başlık + tek cümle açıklama; sağ üstte TR/EN dil anahtarı (yalnız vitrin metni için — bileşenlerin kendi `opts.locale`'i ayrı).
- Kart ızgarası (CSS grid, `auto-fill`, `minmax`), kart başına:
  - Bileşenin kendi `.html`'i `<iframe>` içinde gömülü — ayrı bir önizleme kodu yazılmaz, gerçek dosya gerçek halinde gösterilir.
  - Kartın altında `olcum.json`'dan `fetch` ile okunan boyut (KB) ve ölçüm rozetleri; alan yoksa "ölçülmedi" basılır (uydurulmaz).
  - Üç bağlantı: Canlı demo (dosyayı doğrudan aç) · Kod (GitHub) · Reçete (`recete.md`).
- Klavye: kartlar `tabindex="0"`, Enter demo bağlantısını açar.
- Mobilde tek sütun, kart genişliği `clamp()` ile.

## 5. Reçete şablonu (`recete.md`)

```md
# <bileşen adı> — nasıl yapıldı

## Kaynak
Hangi mevcut sahneden türedi (ör. sosyal/uret/sayi/odometre), ne değişti.

## Prompt kaydı
Gerçek, oturumdan kopyalanan prompt(lar) — ham, düzenlenmeden, sırayla.

## Kararlar
- Veri yapısı / PRNG / olay seti neden böyle.
- Hangi HyperFrames kısıtı neyi şekillendirdi (data-duration, determinizm kuralı vb.).

## Kullanım
\`\`\`js
const instance = FRKComponents.odometer.mount(el, { seed: 1, value: 167829, locale: 'tr' });
instance.seek(2.4);
\`\`\`

## Olaylar
| Olay | Ne zaman | detail |

## Sınırlar
Ölçülmemiş/bilinen eksikler (ör. "gerçek Safari testi yok").
```

Prompt kaydı elle, oturum transkriptinden kopyalanır — otomatik günlükleme yok; gerçeklik kuralı gereği uydurma prompt yazılmaz.

## 6. Ölçüm planı

`araclar/olc.mjs` — üç bileşen için ortak tek betik, `node araclar/olc.mjs components/<ad>/<ad>.html` ile çalışır, `olcum.json`'u yazar:

| Ölçüt | Yöntem | Hedef | Ölçülemezse |
|---|---|---|---|
| Dosya boyutu (KB) | `fs.statSync`, ham bayt | ≤ 50 KB | — (her zaman ölçülebilir) |
| İlk boyama (ms) | Playwright `page.goto(file://…)`, `performance.getEntriesByType('paint')` | LCP ≤ 2500 ms | — |
| Kare maliyeti / FPS | `instance.play()` 3 sn, ölçüm script'i her `seek` çağrısını zaman damgalar (bileşen kodu değil, yalnız `olc.mjs`) | ortalama kare ≤ 16,7 ms (60 fps, masaüstü) | mobil/gerçek telefon satırı "ölçülmedi" kalır — bu makinede cihaz yok |
| Erişilebilirlik | `@axe-core/playwright`, `seek(0)` ve `seek(duration/2)` karelerinde tarama | 0 ihlal | — |
| Klavye + reduced-motion | Elle checklist: Tab→Enter demo açar mı; `prefers-reduced-motion: reduce` altında otomatik oynatma yok mu | uyumlu | "ölçülmedi" |

Playwright + `@axe-core/playwright` bu makinede kurulu değil; kurulum Pazartesi'den sonraki ilk iş bloğunda yapılır (TASARIM aşamasında kod/kurulum yok kuralına uyar). `olcum.json` boş şablonla (tüm alanlar "ölçülmedi") Pazartesi öncesi oluşturulabilir; sayılar yalnız `olc.mjs` çalıştıktan sonra girilir.

## Pazartesi sonrası sıra (YONLENDIRME §3)

1. `araclar/olc.mjs` + Playwright kurulumu.
2. `odometer.html` (§1–3 sözleşmesine göre) + `recete.md` + ilk `olcum.json`.
3. HyperFrames'te 5 saniyelik deneme render'ı (`npx hyperframes check` → `preview` → `render`).
4. Private depo açılışı (GitHub).
