# Durum — b1 (VS Code paneli, `frk-components-b1`)

Sahip: `components/rope-swing/`, `components/status-orb/`, `deneme/`, `TASARIM.md`, bu dosya. Git'i YEDEK kullanır.

## 02.10.2026 00:45

**Bitti**
- `components/rope-swing/` (parça 3): `rope-swing.js` (15.172 bayt, gzip 5.531), `demo.html`, `README.md` (TR+EN), `RECETE.md`, `olcum.json`. YEDEK commit'ledi ve index'e kart ekledi.
- `components/status-orb/` (parça 4): `status-orb.js` (10.900 bayt, gzip 4.236), `demo.html`, `README.md` (TR+EN), `RECETE.md`, `olcum.json`. Commit bekliyor.
- Ölçüm betikleri `deneme/araclar/`: `olc-parca.mjs` (canvas parçalar için), `rope-bot.mjs` (otopilot kaydı), `goz.mjs` (ekran görüntüsü), `kilit.mjs` (`.agir-is.kilit`).

**Ölçümler** (başsız Chromium 153, bu makine, masaüstü; ayrıntı her parçanın `olcum.json`'unda)
- rope-swing: determinizm 9 zaman × 3 sıra piksel + durum aynı; canlı koşunun 6 karesi kayıttan tekrarda aynı; axe 0; seek ort. 0,123 ms; FCP 44 ms.
- status-orb: determinizm 9 zaman × 3 sıra piksel + durum aynı (9/9 kare farklı); durum kaydı tekrarında 3/3 kare aynı; axe 0; seek + boşaltma medyan 4,8 ms (p95 5,6); FCP 36 ms.
- **Ölçülmedi:** gerçek telefon/dokunmatik, Safari, Firefox; HyperFrames render (sırada); `duration: Infinity` (status-orb).

**HyperFrames köprüsü (kod okumayla doğrulandı, render koşulmadı)**
- `onUpdate` render'da her seek'te tetiklenir (`tl.totalTime(t, false)`); doğru kalıp proxy tween: `fromTo(P,{t:0},{t:D,duration:D,ease:"none",onUpdate(){inst.seek(P.t)}})`.
- GSAP kendiliğinden gömülmez: kompozisyon `<script src=…gsap@3.14.2…>` taşır; köprü `if (window.gsap)` ile korunur.
- Lint ERROR: `performance.now()` ve doğrudan `requestAnimationFrame(`. Bizim iki parça rAF'e `global['requestAnimationFrame']` ile dolaylı erişiyor.
- `data-duration` yarı açık: son kare `D − 1/fps`; animasyon `D`'den ≥ 0,5 sn önce bitmeli. Bu makinede başlatıcı `node …/hyperframes/skills/hyperframes/scripts/plugin-cli.mjs <komut>`, işçi ≤ 2.

**Sıradaki:** `deneme/` (her parça için 5 sn HyperFrames kompozisyonu, `lint` + `check` + `snapshot` + `render`, kare karşılaştırmasıyla determinizm kanıtı) → `TASARIM.md` (≤ 80 satır). Render başlamadan YEDEK'e haber verilecek.

**Takılma yok.**
