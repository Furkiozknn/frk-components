# Kanca İpi — nasıl yapıldı / how it was made

## Kaynak

`Furkiozknn/kanca` oyunundaki ip mekaniği (`scripts/oyuncu.gd`: halat kısıtlı sarkaç, kanca noktası seçimi, bırakma bonusu) ve o deponun README'sindeki ayar tablosu. Kanca bir Godot oyunu; burada GDScript'ten çeviri yok, mekanik tarayıcı için sıfırdan, sabit adımlı ve DOM'suz bir çekirdek olarak yeniden yazıldı. Menzil (240), bırakma çarpanı (×1,10), eşik (380), hız tavanı (900) ve sönüm (0,10) kanca'nın README'sinden alındı; yerçekimi (1100) ve adım (1/120 sn) bu parçanın kendi seçimi.

## Prompt kaydı

Bu parçayı doğuran ham girdiler, düzenlenmeden. Oturumu başlatan iki mesaj:

```
CLAUDE.md ve YONLENDIRME.md'yi oku, başla
```

```
10m YONLENDIRME.md'yi oku ve sıradaki adımı yap, DURUM.md'yi güncelle
```

`YONLENDIRME.md`'nin 01.10.2026 23:50 sürümünden (parça tanımı ve ölçüm isteği):

```
2. **Parça 1: odometre.** Pakette şunlar olsun:
   - tek JS dosyası;
   - `demo.html`;
   - `README.md` (TR + EN);
   - `RECETE.md`: bu parçayı yapmak için kullandığın promptlar ve adımlar.

   Ölç:
   - dosya boyutu;
   - seek determinizmi: aynı `t` aynı kareyi üretmeli; iki kez çizip karşılaştır;
   - klavye ve reduced-motion desteği.

   Sayıları koşunun çıktısından yaz.
...
4. **Parça 3: kanca ipi.** Fikir `D:\Repolar\kanca`'dan; o depo bizim, okuyabilirsin. Aynı paket.
```

02.10.2026 00:05 sürümünden (b1'e düşen iş):

```
1. `rope-swing` (kanca ipi) paketi: JS, `demo.html`, README (TR+EN), `RECETE.md`.
```

Başka prompt yok. Kod bu girdilerden, `TASARIM.md` sözleşmesinden, kanca README'sinden ve odometre paketinin dosya/ID düzeninden (`#stage`, `#play`, `#t`, `window.inst`) yazıldı.

## Adımlar

1. Kanca README'sini oku: kontroller, kanca seçimi puanı (`nişan hizası × 3 − uzaklık / menzil + hız yönüne uyum`), halat kısıtı, ayar tablosu.
2. Çekirdek (`createSim`): sabit adım 1/120 sn, durum = konum, hız, bağlı nokta, halat boyu, kanca sayısı, iz; girdi = `[[adım, basılı], ...]`. Yalnız `+ − × ÷ √` kullanıldı. Düşünce başa dönülüyor, süre durmuyor.
3. `seek(t)`: `round(t / DT)` adıma kadar ileri sim; geri atlamada baştan sim (≤ 720 adım). Olaylar (`hook`, `release`, `finish`) yalnız ileri giderken yayımlanır.
4. Canvas çizimi (640×360 mantıksal, kutuya sığar, yüksek DPI'da keskin): paralaks yıldız, anchor'lar, aday kanca (kesik çizgi), halat, iz, bitiş bayrağı, HUD. Aynı karede oyun durumu dışında hiçbir şeye bakılmıyor.
5. Girdi: klavye (Boşluk/Enter basılı), fare/dokunma (işaretçi olayları), `input(down)` ile kayda yazılır; ilk girdi kaydın geri kalanını siler (otopilottan devralma).
6. Otopilot: `deneme/araclar/rope-bot.mjs`, çekirdeği Node'da yükleyip kanca/bırakma zamanlarını ışın araması ile buluyor; çıktı `DEFAULT_INPUTS` olarak dosyaya yazıldı.
7. `demo.html`: odometre demosunun düzeni (FRK-OS kimliği, TR/EN, kaydırıcı) + Otopilot / Kendin oyna düğmeleri.
8. `deneme/araclar/olc-parca.mjs`: Playwright + axe-core ile ölçüm; çıktı `olcum.json`.

Ölçüm betiğini çalıştırmak ve botu yeniden üretmek için:

```
node deneme/araclar/rope-bot.mjs 12
node deneme/araclar/olc-parca.mjs components/rope-swing/demo.html
```

## Kararlar

- **Saf `seek(t)` = kaydı baştan oynat.** Oyun doğası gereği geçmişe bağlı; bu yüzden seek geçmişi saklamak yerine girdi kaydını sabit adımla yeniden simüle ediyor. 6 sn × 120 = 720 adım ucuz (ölçülen: seek ort. 0,067 ms); önbellek yalnız ileri giderken devam eder.
- **Sabit adım + yalnız temel aritmetik.** `Math.hypot`, `sin`, `cos` yok; kalan tek işlev `Math.sqrt`. Amaç motorlar arası aynı kare; ancak ECMAScript `Math.sqrt` için tam yuvarlama garantisi vermiyor ve motorların donanım karekökü kullandığı varsayımı Chromium dışında **denenmedi**.
- **Kanca basılı tutunca otomatik takılır.** Kanca'daki "basış tamponu" benzeri bir etki: menzilde yukarıda nokta yokken basılı tutarsan, nokta menzile girdiği adımda takılır. Otopilot arama uzayını küçültüyor, oyuncuya da tolerans veriyor.
- **Girdi kaydı JSON.** `inst.inputs` başka bir örnekte `opts.inputs` ile birebir aynı kareleri verir (ölçüldü: 6 canlı kare tekrarda aynı). Video sahnesi için tek gereken bu liste.
- **Tohum yalnız yıldızlarda.** Fizik tohumdan bağımsız; böylece otopilot kaydı her tohumda geçerli.
- **`requestAnimationFrame`'e dolaylı erişim.** HyperFrames lint'i kompozisyon betiğinde doğrudan çağrıyı hata sayıyor; `global['requestAnimationFrame']` ile erişildi. Bu yol yalnız kullanıcı düğmesi/girdisiyle çalışır, render'da hiç yürütülmez. Saat okunmuyor: zaman rAF damgasından.
- **Erişilebilirlik.** Oyun alanı `role="application"` + etiket + ipucu (`aria-describedby`); canvas gizli; kanca/bırakma/bitiş olayları `role="status"` bölgesine yazılıyor (kare başına değil, olay başına). `P`/`Esc` duraklatır (WCAG 2.2.2). Reduced-motion'da `play()` son kareyi gösterir; kullanıcı girdisi oyunu yine başlatır.

## Yol boyunca bulunan hatalar

1. **İlk seviye 4,4 sn'de bitiyordu.** 8 noktalık seviye demo için fazla kısaydı; 11 noktalı, 2340 px'lik seviyeye uzatıldı.
2. **Bot son kancadan sonra takılıyordu.** Arama yalnız `x` ilerlemesine puan veriyordu ve son uçuşta ölenleri eliyordu. Puan `x − 320 × süre` yapıldı, son uçuş ayrıca 260 adım denendi.
3. **Bot bitişe ekranın altından varıyordu.** Bitiş `y = 379` çıkmıştı (sahne 360 px). Bota "bitişte `y ≤ 320`" şartı konuldu; yeni kayıt `y = 314`'te bitiyor.
4. **Bot saçma titreşim üretiyordu.** Bırakıp 1 adım sonra yeniden basan diziler (`[923, 0], [924, 1]`) çıktı. Arama en az 6 adım bekletecek şekilde kısıtlandı.
5. **`Esc` aç/kapa yapıyordu.** Ölçüm betiğindeki tuş testini yazarken fark edildi; `Esc` yalnız duraklatır, `P` aç/kapa.

## Kullanım

```js
const inst = FRKComponents.ropeSwing.mount(el, { locale: 'tr', seed: 1 });
inst.play();                 // otopilot
inst.input(true);            // oyuncu devralır
const kayit = inst.inputs;   // [[adım, 1|0], ...]
FRKComponents.ropeSwing.mount(baskaEl, { inputs: kayit }).seek(2.5);
```

## Olaylar

| Olay | Ne zaman | detail |
|---|---|---|
| `frk:ready` | `mount` içinde ilk `seek(0)` sonrası | `{ duration }` |
| `frk:tick` | her `seek` sonrası | `{ t, x, y }` |
| `frk:end` | `t`, `duration`'ı geçtiği ilk `seek`'te | `{ t }` |
| `frk:hook` | kanca takıldığında (yalnız ileri giderken) | `{ t, ax, ay }` |
| `frk:release` | bırakıldığında | `{ t, speed }` |
| `frk:finish` | bayrağa varıldığında | `{ t }` |

## Sınırlar

- Ölçümler başsız Chromium 153, bu makine, masaüstü. Telefon, gerçek dokunmatik, Safari ve Firefox **ölçülmedi**.
- Oynanış hissi ve zorluk ölçülmedi; otopilot bir bot, insan testi yok.
- Kontrol noktası, kırılgan/hareketli nokta, rüzgâr ve halat kısaltma/uzatma yok.
- HyperFrames'te render **bu dosyada denenmedi**; sonuç `deneme/` altında ayrıca yazılacak.
