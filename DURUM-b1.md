# Durum — b1 (VS Code paneli, `frk-components-b1`)

Sahip: `components/rope-swing/`, `components/status-orb/`, `deneme/`, `TASARIM.md`, bu dosya. Git'i YEDEK kullanır.

## 02.10.2026 00:10

- Yönlendirme 00:05 okundu; iş bölümü: YEDEK parça 1-2-5 + altyapı + git; b1 parça 3-4 + `deneme/` (HyperFrames) + `TASARIM.md`.
- HyperFrames köprüsü doğrulandı (salt-okunur, kod okuma; render çalıştırılmadı):
  - `onUpdate` render'da her seek'te tetiklenir (`tl.totalTime(t, false)`); proxy tween (`fromTo(P,{t:0},{t:D,duration:D,ease:"none",onUpdate(){inst.seek(P.t)}})`) doğru kalıp.
  - GSAP kendiliğinden gömülmez: dosya `<script src=…gsap@3.14.2…>` taşır; köprü `if (window.gsap)` ile korunur.
  - Lint ERROR: `performance.now()`, `requestAnimationFrame(` (kompozisyon betiğinde). Bileşen JS'i harici `<script src>` ile yüklenirse ve lint yerel dosyayı taramazsa sorun yok — ilk `lint` koşusunda sınanacak.
  - `data-duration` yarı açık aralık: son kare `D-1/fps`; animasyon `D`'den en az 0,5 sn önce bitmeli. Statik, render başına tek değer.
  - Bu makinede başlatıcı: `node …/hyperframes/skills/hyperframes/scripts/plugin-cli.mjs <komut>`; işçi en çok 2.
- `components/rope-swing/rope-swing.js` ilk sürüm yazıldı (çekirdek + canvas arayüzü); otopilot kaydı (bot) ve demo sırada.
- Sıradaki: bot → `DEFAULT_INPUTS`, `demo.html`, `araclar/olc-rope.mjs`, README (TR+EN), `RECETE.md`; sonra `status-orb`, `deneme/`, `TASARIM.md` (≤80 satır).
