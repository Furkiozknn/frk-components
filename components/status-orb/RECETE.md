# Durum Küresi — nasıl yapıldı / how it was made

## Kaynak

Fikir Ship Notes'un Signal Orb'u (`aqualang89/shipnotes-components`, MIT): dört durumlu (listening, thinking, searching, done) bir parçacık göstergesi. Onun herkese açık README'si, önizleme görseli ve durum adlarını gösteren birkaç satırı incelendi; kod okunmadı ya da kopyalanmadı. Burada tamamen yeni bir çizim ve hareket yazıldı: Canvas 2D, tohumlu parçacıklar, her kare `t`'nin saf fonksiyonu, durum geçişleri bir kayıt olarak tutulup birebir tekrar oynatılabilir. Ship Notes'un videoya yönelik yardımcısı (`renderAt`, `recording`) burada birinci sınıf arayüz: `seek(t)`.

## Prompt kaydı

Bu parçayı doğuran ham girdiler, düzenlenmeden. Oturumu başlatan iki mesaj:

```
CLAUDE.md ve YONLENDIRME.md'yi oku, başla
```

```
10m YONLENDIRME.md'yi oku ve sıradaki adımı yap, DURUM.md'yi güncelle
```

`YONLENDIRME.md`'nin 02.10.2026 00:05 sürümünden (b1'e düşen parça tanımı):

```
3. YENİ, parça 4: `status-orb`. Ship Notes'un Signal Orb'unun sarılabilir ve deterministik sürümü.
   - Canvas 2D, tohumlu parçacıklar.
   - Durumlar: dinliyor, düşünüyor, arıyor, bitti.
   - reduced-motion'da sabit görünür.
```

Gözetim oturumunun aynı konudaki mesajı (SendMessage):

```
Sen b1'sin: rope-swing paketi → deneme/ altında her parça için 5 sn HyperFrames render + seek determinizmi kanıtı → YENİ parça 4 status-orb (Signal Orb'un sarılabilir, deterministik Canvas 2D sürümü) → TASARIM.md ≤80 satır.
```

Başka prompt yok. Paket yapısı ve ölçüm istekleri için `YONLENDIRME.md` 23:50 sürümündeki "Pakette şunlar olsun / Ölç" listesi geçerliydi (odometre ve kanca ipi RECETE.md'lerinde ham haliyle var).

## Adımlar

1. Signal Orb'un README'sini ve önizleme görselini oku: dört durum, `level` ile dinleme şeklinin değişmesi, reduced-motion'da sabit şekil.
2. Şekilleri seç: dinliyor = dalgalanan çift halka, düşünüyor = Lissajous düğümü, arıyor = dışa akan spiral, bitti = halka + onay işareti. Her biri `(parçacık parametresi s, t) → (x, y)` çözümsel fonksiyonu; integrasyon yok.
3. Geçiş: durum listesi `[[t, ad], ...]`; `t` anında etkin durumun ağırlığı `smoothstep((t − t_k) / 0,7)`, önceki durumun ağırlığı `1 − o`; konum, etkin durumların ağırlıklı ortalaması. Hepsi `t`'nin saf fonksiyonu.
4. Çizim: 2200 parçacık, `lighter` birleştirme, tek `fillStyle` + parçacık başına `globalAlpha`, hafif radyal parıltı; renk, durum renklerinin ağırlıklı karışımı.
5. Uygulama arayüzü: `setState(ad)` kaydı o ana kadar korur, sonrasını siler (rope-swing'deki devralma ile aynı model); `setLevel(v)`.
6. `demo.html`: odometre/rope-swing demosunun düzeni (FRK-OS kimliği, TR/EN, kaydırıcı) + dört durum düğmesi (`aria-pressed`) + seviye kaydırıcısı.
7. `deneme/araclar/olc-parca.mjs`: Playwright + axe-core ölçümü; çıktı `olcum.json`.

Ölçümü yeniden koşmak için:

```
node deneme/araclar/olc-parca.mjs components/status-orb/demo.html
```

## Kararlar

- **Simülasyon yok, çözümsel konum.** Parçacık konumu doğrudan `t`'den hesaplanır; önceki kareye bakılmaz. Bu, `seek(t)`'nin ileri/geri/rastgele atlamada aynı kareyi vermesinin en ucuz yolu; rope-swing'deki gibi baştan simüle etmeye gerek kalmıyor.
- **Tohum yalnız dağılımda.** Parçacıkların faz, ağırlık ve saçılma değerleri `mulberry32` ile bir kez üretiliyor. `Math.random` yok; kaynak taraması da bunu doğruluyor.
- **Saat okunmuyor.** `play()` zamanı `requestAnimationFrame`'in verdiği damgadan alır; erişim `global['requestAnimationFrame']` ile dolaylı (HyperFrames lint'i doğrudan çağrıyı hata sayıyor). Bu yol render'da yürütülmez.
- **Durum kaydı = video girdisi.** `states` JSON; bir uygulama oturumunda seçilen durumlar kaydedilip aynı karelerle video sahnesine verilebilir (ölçüldü: 3 canlı kare tekrarda aynı).
- **Reduced-motion = sabit poz.** `play()` animasyon yerine son durumun `t = 2` anındaki duruş karesini gösterir; `setState` geçişsiz çalışır. `seek(t)` ortamdan bağımsız kalır, çünkü video yakalama ona dayanıyor.
- **Erişilebilirlik.** Kök `role="img"` + `aria-label="Asistan: <durum>"`; canvas `aria-hidden`; ileri giderken olan durum değişimi `role="status"` bölgesine yazılıyor, kare başına değil. Durum seçimi yerel `<button>` + `aria-pressed` ile yapılıyor.
- **Ev sahibi öğeye `data-t` ve `data-state` yazılıyor.** Test ve stil için; demo kendi düğmelerinde aynı adı kullanmamalı (aşağıda).

## Yol boyunca bulunan hatalar

1. **Demo düğmeleri ile bileşen aynı `data-state` adını kullanıyordu.** İlk ölçümde `querySelector('[data-state=searching]')` bileşenin ev sahibi öğesini döndürdü (`aria-pressed` `null` göründü). Gerçek bir hata değil ama tuzak: demo düğmeleri `data-set`'e taşındı.
2. **İlk görüntüde parçacıklar sönüktü.** 1400 parçacık/küçük boyutla şekiller seyrekti; sayı 2200'e, boyut ve alfa artırıldı. Aynı değişiklikte parçacık başına `rgba(...)` dizesi üretmek bırakıldı (tek `fillStyle` + `globalAlpha`).
3. **Yalnız JS süresi yanıltıcı çıktı.** `seek` sürelerinin medyanı 1 ms ama p95'i 37 ms: canvas komut tamponu dolunca boşalıyor. Kare maliyeti için `getImageData(0,0,1,1)` ile boşaltılmış ölçüm esas alındı (ort. 4,89 ms, p95 5,6 ms).

## Kullanım

```js
const inst = FRKComponents.statusOrb.mount(el, { locale: 'tr', seed: 1 });
inst.play();                  // dört durumlu kayıt
inst.setState('searching');   // uygulama durumu seçer
const kayit = inst.states;    // [[t, ad], ...]
FRKComponents.statusOrb.mount(baskaEl, { states: kayit }).seek(2.5);
```

## Olaylar

| Olay | Ne zaman | detail |
|---|---|---|
| `frk:ready` | `mount` içinde ilk `seek(0)` sonrası | `{ duration }` |
| `frk:tick` | her `seek` sonrası | `{ t }` |
| `frk:end` | `t`, `duration`'ı geçtiği ilk `seek`'te | `{ t }` |
| `frk:state` | etkin durum değiştiğinde (yalnız ileri giderken) | `{ t, state }` |

## Sınırlar

- Ölçümler başsız Chromium 153, bu makine, masaüstü. Telefon, Safari ve Firefox **ölçülmedi**.
- Kare maliyeti GPU'suz olabilecek ortamda ~5 ms; zayıf cihazlarda `n` düşürülmeli (ölçülmedi).
- `duration: Infinity` ile sürekli çalışan gösterge tasarlandı ama denenmedi.
- HyperFrames'te render **bu dosyada denenmedi**; sonuç `deneme/` altında ayrıca yazılacak.
