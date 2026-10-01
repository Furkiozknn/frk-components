# Prompt terminal — nasıl yapıldı / how it was made

## Kaynak

Odometre parçasının sözleşmesi (`mount` / `seek` / `play` / `pause` / `destroy`, `frk:` olayları, rAF damgasıyla zaman) aynen alındı. İçerik FRK-OS video üreticisindeki `terminal` sahnesinden esinlendi ("komut harf harf yazılır, çıktı satır satır gelir"); orada GSAP zaman çizelgesi sürüyordu, burada konum saf bir fonksiyon.

## Prompt kaydı

Oturumda bu parçayı doğuran ham yönlendirmeler (`YONLENDIRME.md`, düzenlenmeden):

```
3. **Parça 2: prompt-terminal.** Aynı paket.
```

```
1. `odometer`'ı bitir, ardından `prompt-terminal` paketini yap.
```

"Aynı paket" = tek JS dosyası, `demo.html`, `README.md` (TR + EN), `RECETE.md`, ölçüm. Başka prompt yok: kod bu yönlendirmeden, odometre parçasından ve `TASARIM.md` sözleşmesinden yazıldı.

## Adımlar

1. Zaman planı (`plan`): her adımın başlangıç/bitiş anı ve her harfin çıkış anı, mount sırasında bir kez hesaplanır. Harf aralığı `1/hız × (0,6 … 1,4)` (tohumdan), boşlukta %12 olasılıkla 0,22 sn duraksama.
2. `seek(t)`: planı baştan okuyup görünen satırları üretir (komut: `t`'ye kadar yazılan harfler; `think`: dönen gösterge, bitince `done` metni; `out`: hızlı akan satır). Satır düğümleri önbellektedir, ama durumu yalnız `t` belirler.
3. İmleç son satırın sonunda; yazarken sabit, beklerken `floor(t × 2)` ile yarım saniyede bir yanıp söner (saf).
4. `demo.html`: odometre demosuyla aynı kimlik ve aynı kontroller (`#stage`, `#play`, `#t`, `#v` = tohum, `window.inst`), böylece `araclar/olc.mjs` ikisini de ölçer.
5. `olc.mjs` bileşen adını kaynaktan okur; terminale özel kontrol: son karede görünen satırlar `aria-label` metniyle aynı mı, `duration` ölçeği çalışıyor mu.

## Kararlar

- **Saf `seek(t)`, saat yok, ham rastgelelik yok.** Kaynak taraması `Math.random`, `Date.now`, `performance.now`, `new Date` aramasında hiçbirini bulmuyor.
- **`duration` ölçeği.** Doğal süre (varsayılan TR senaryoda 7,476 sn) tohumdan ve metinden çıkar; HyperFrames'in sabit `data-duration`'ı için `duration: 5` verilirse bütün zamanlar orantılı sıkışır. Son karede metin yine tam.
- **Yalnız gömülü yazı tipindeki karakterler.** `›`, `•`, `-\|/`, `…`, `—`. `❯`, `✓`, braille döndürücü gibi karakterler Latin alt kümesinde yok; sistem yazı tipine düşüp farklı makinede farklı çizilirdi, determinizm iddiasını zayıflatırdı.
- **Alta yaslı gövde.** Yeni satırlar altta, eskiler yukarı kayar ve üstte kırpılır; kaydırma çubuğu ya da `scrollTop` hesabı yok, durum yine yalnız `t`'den.
- **Varsayılan senaryo "örnek".** Demo ve README'de açıkça örnek olarak etiketli; gerçek oturum kaydı gibi sunulmaz, gerçekçi görünen sayı (test sayısı, süre) içermez.
- **Erişilebilirlik.** Kutu `role="img"` ve tam metin `aria-label`; hareketli çizim `aria-hidden`. Ekran okuyucu harf harf yazılan metni okumaz, son hali okur.

## Yol boyunca bulunan hatalar

1. **Ölçüm betiğinde `reduced-motion` karşılaştırması yanlıştı.** `data-t` üç basamağa yuvarlandığı için `7.476` ile gerçek süre `7.4764…` eşit çıkmadı (`son_kare_gosterildi: false`). Bileşen doğruydu; test 1,5 ms toleransla düzeltildi ve yeniden koşuldu.

## Kullanım

```js
const inst = FRKComponents.promptTerminal.mount(el, { seed: 1, locale: 'tr', duration: 5 });
inst.seek(2.5);
```

## Olaylar

| Olay | Ne zaman | detail |
|---|---|---|
| `frk:ready` | `mount` içinde ilk `seek(0)` sonrası | `{ duration, text }` |
| `frk:tick` | her `seek` sonrası | `{ t }` |
| `frk:end` | `t`, `duration`'ı geçtiği ilk `seek`'te | `{ t }` |

## Sınırlar

- Ölçümler başsız Chromium 153, bu makine, masaüstü. Telefon, Safari ve Firefox **ölçülmedi**.
- Özel `script` yolu ölçüm koşusunda denenmedi.
- HyperFrames'te render **bu dosyada denenmedi**; `deneme/` altı `b1` oturumunun işi.
