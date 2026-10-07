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
4. Çizim: 2200 parçacık, `lighter` birleştirme, parçacıklar 10 saydamlık kümesine ayrılıp küme başına tek yolda çizilir (aşağıdaki hata 3), hafif radyal parıltı; renk, durum renklerinin ağırlıklı karışımı.
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
3. **İlk sürümde `seek` süresi iki modluydu.** 2200 ayrı `fillRect` çağrısıyla JS süresinin medyanı 1 ms ama p95'i 37 ms'ti: canvas komut tamponu dolunca boşalıyor. Yan oturum aynı belirtiyi `katki-isi`'nde buldu ve ayrı bir mikro deneyle çok sayıda ayrı çizim çağrısının sebep olduğunu gösterdi. Parçacıklar saydamlık kümelerine (10 küme) göre tek yolda (`beginPath` + `rect` + tek `fill`) çizilince `seek` JS süresi ort. 0,85 ms, p95 1,4 ms oldu; boşaltmalı kare maliyeti medyan 3,5 ms (üç koşuda 3,5–6,9 ms: makine yüküne bağlı).
4. **Ölçüm betiği ilk boşaltmada 600 ms'lik uç değer gösterdi.** `getImageData` ilk çağrıda, ilk döngünün kuyruğa aldığı 240 karenin komutlarını birden işliyordu. Döngüler arasına ölçüm dışı bir boşaltma eklendi; uç değer kayboldu (en çok 6,3 ms).

5. **Etiketteki Türkçe harfler ilk çizimde yedek yazı tipiyle çıkıyordu.** `label: true` iken canvas'a yazılan "düşünüyor", "arıyor" `ş ü ı` harfleri latin-ext alt kümesindedir ve `document.fonts.load(font)` yalnız boşluğun alt kümesini yükler. HyperFrames kompozisyonunu düz Chromium'da ileri/ters/karışık sırada gezen kanıt betiği "ilk ziyaret farklı, sonrakiler aynı" diye gösterdi. Bütün etiketlerle `document.fonts.load(font, metin)` yapılınca dört sıralama aynı oldu, HyperFrames karesiyle bayt eşit.
6. **HyperFrames `check` ilk koşuda 1 hata verdi** (gizli durum bölgesi "kırpılmış metin"); öğeye `data-layout-ignore` eklenince 0 bulgu.

7. **Canlı kare sayısı beklenenden azdı.** `getImageData` okumalarından sonra aynı sayfada canlı oynatma başlayınca ilk kareden sonra 0,5–1,3 sn'lik bir takılma oluyordu (canvas yazılımsal moda geçiyor); 360 yerine 260 kare sayıldı. Ölçüm betiği canlı oynatmayı taze sayfada, okumalardan önce ölçecek şekilde ayrıldı; şimdi 362 kare, en uzun aralık 19,2 ms.

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
- Kare maliyeti GPU'suz olabilecek ortamda ~3,6 ms; zayıf cihazlarda `n` düşürülmeli (ölçülmedi).
- `duration: Infinity` ile sürekli çalışan gösterge tasarlandı ama denenmedi.
- HyperFrames: 5 sn'lik 1080×1080 kompozisyon `deneme/status-orb/` altında; `check` 0 bulgu, TR+EN render, aynı `t` aynı kare kanıtı `deneme/SONUC.md` ve `deneme/KANIT.json`'da. Canvas etiketi HyperFrames kontrast denetiminin dışında kalır.

## Ek: SEZGİ — konuşan küre (07.10.2026)

**Girdi (özet):** Araştırma notlarını (`JARVIS-ARASTIRMA.md`, `SATIS-ARASTIRMASI.md`, `sosyal/ses-hazirlik/OKU.md`) oku, mantığını anla, somut işe çevir. Alınan kararlar: ses zarfı önceden çıkarılır ve `seek(t)` onu okur (rakiplerde canlı `isSpeaking` bayrağı var); "onay bekliyor" durumu; ses sağlayıcısı değiştirilebilir ve ücretsiz varsayılan; satılacak şey kit değil, çalışan hat.

**Adımlar:** (1) Çalışmadan önce varsayılan reelin 22 karesinin hash'i alındı; (2) `speaking`, `approval`, `opts.speech`, kelime altyazısı, `frk:word` eklendi; (3) 22 kare birebir aynı çıktı; (4) `araclar/seslendir.mjs` ve `araclar/sezgi-test.mjs` yazıldı; (5) `sezgi.html` demo ve `deneme/kure-reklam/` reklam taslağı.

**Yolda bulunanlar:** testin ilk taslağında zarf sessizlik penceresi erken seçilmişti (bırakma 0,2/kare, 20 kare sonra ölçülmeli); düzeltildi. `araclar/olc.mjs` status-orb'un olcum.json'unu daha zayıf biçimde ezdi; geri alınıp `deneme/araclar/olc-parca.mjs` ile yeniden ölçüldü. `file://` altında `fetch` çalışmadığı için konuşma verisi `.js` olarak da yazılıyor.

**Sınırlar:** kelime zamanı motorda yoksa karakter oranıyla yaklaşık; ses seçimi Furki'nin; edge-tts ticari kullanımı doğrulanmadı.
