# vitrin-tanitim — 30 saniyelik tanıtım videosu

**TR** — `frk-components`'in yedi parçasını sırayla gösteren 30 saniyelik, 1080×1920 dikey tanıtım videosu (TR ve EN). Videodaki her bileşen, depodaki kendi dosyasıyla çizilir (`components/<parca>/<parca>.js`); HyperFrames her kareyi `seek(t)` ile ister. Yalnız render: yayınlama yok, dosyalar depoda kalır.
**EN** — A 30-second, 1080×1920 vertical promo (TR and EN) that shows the seven parts of `frk-components` one after another. Every component in the video is drawn by its own file from the repo; HyperFrames asks for each frame through `seek(t)`. Render only: nothing is published.

## Çıktılar / Outputs

| Dosya / File | İçerik / Content |
|---|---|
| `out/vitrin-tanitim-tr.mp4` | Türkçe, H.264, 1080×1920, 30 fps, 900 kare, 30,000 sn |
| `out/vitrin-tanitim-en.mp4` | English, aynı biçim / same format |
| `index.html` | HyperFrames kompozisyonu (`uret.mjs` üretir) / the composition |
| `uret.mjs` | Kompozisyonu, bileşen kopyalarını ve yazı tiplerini üretir / generates the composition, component copies and fonts |
| `vars-tr.json`, `vars-en.json` | Dil değişkeni / language variable |

## Akış / Timeline

| Sn / s | Sahne / Scene |
|---|---|
| 0,0 – 2,6 | Giriş: "7" sayan odometre + başlık / hook: an odometer counting to 7 + title |
| 2,6 – 6,0 | 01 odometer |
| 6,0 – 9,6 | 02 prompt-terminal |
| 9,6 – 14,0 | 03 rope-swing (otopilot kaydı, 1,2 sn ileriden / autopilot record, 1.2 s in) |
| 14,0 – 17,6 | 04 status-orb |
| 17,6 – 21,0 | 05 katki-isi |
| 21,0 – 24,2 | 06 ilerleme-halkasi |
| 24,2 – 27,8 | 07 kod-diff |
| 27,8 – 30,0 | Kapanış / closing |

## Sayılar nereden geliyor / where the numbers come from

Sahne altyazılarındaki sayılar (bayt, `seek` süresi, axe ihlali) parçaların `olcum.json` dosyalarından, kapanıştakiler `deneme/CAPRAZ-MOTOR.json` ve `deneme/KANIT.json`'dan **üretim sırasında okunur** (`uret.mjs`); dosyada bulunmayan sayı yazılmaz. Bu yüzden ölçümler değişince `node deneme/vitrin-tanitim/uret.mjs` ve render yeniden koşulmalı. / The numbers in the captions are read from each part's `olcum.json`, the closing ones from `CAPRAZ-MOTOR.json` and `KANIT.json`, at generation time; a number that is not in a file is not written.

## Yeniden üretmek için / Reproduce

```
node deneme/vitrin-tanitim/uret.mjs
KOS_CHECK_AT="0.5,1.5,3.5,5,7,8.5,11,13,15,16.5,18.5,20,22,23.5,25.5,27,29" node deneme/kos.mjs vitrin-tanitim check
node deneme/kos.mjs vitrin-tanitim render        # TR
node deneme/kos.mjs vitrin-tanitim render-en     # EN
```

## Sınırlar / Limits

- Ses yok, geçiş efekti yok: yalnız solma ve metin girişleri. / No audio, no transition effects: fades and text entrances only.
- Kompozisyonda yedi bileşen aynı sayfada; her biri yalnız kendi sahnesinde `seek` edilir. Çok bileşenli sayfada piksel düzeyinde geçmiş bağımlılığı gözlendi (`deneme/SONUC.md` "vitrin-tanitim"). / Seven components live in one page; each is seeked only in its own scene. Pixel-level history dependence was observed in a multi-component page.
- Yayınlama yok; sosyal medya paylaşımı bu klasörün konusu değil. / Nothing is published.
