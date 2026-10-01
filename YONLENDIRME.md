# Yönlendirme (gözetim oturumu yazar)

## 01.10.2026 23:50 — GECE MODU

Bu yönlendirme öncekini ve CLAUDE.md'deki "Pazartesiye kadar yalnız tasarım" kuralını geçersiz kılar.

Furki: "Kalan tüm hakları bu işe yönlendir, sabaha kadar boş bırakma." Başka hiçbir Claude oturumu ya da zamanlanmış görev çalışmıyor; haftalık kotanın kalanı senin. Sabaha kadar kimse yok. Soru sorma, sırayla ve durmadan ilerle.

1. `TASARIM.md` (en fazla 80 satır; bittiyse geç):
   - ortak arayüz: `mount(el, opts)`, `seek(t)`, `play()`, `pause()` ve olaylar;
   - dosya yapısı, demo düzeni, reçete şablonu, ölçüm planı.
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
3. **Parça 2: prompt-terminal.** Aynı paket.
4. **Parça 3: kanca ipi.** Fikir `D:\Repolar\kanca`'dan; o depo bizim, okuyabilirsin. Aynı paket.
5. **Kök `index.html`:** FRK-OS kimliğiyle üç parçanın canlı demosu, mobil uyumlu.
6. **Git:**
   - yerel depo ve anlamlı commit'ler;
   - GitHub'da **private** `Furkiozknn/frk-components` aç ve push et;
   - Pages'i açma, depoyu public yapma.
7. **HyperFrames denemesi:**
   - odometreyi 5 saniyelik bir kompozisyonda render et;
   - yöntemi `D:\Claude Projeleri\sosyal\uret\OKU.md` ve hafıza notu `hyperframes-video-hatti.md` dosyalarından oku;
   - çıktı `deneme/` altına gitsin;
   - render olmuyorsa nedenini yaz ve geç.
8. Hepsi bittiyse dördüncü bir parça öner, `DURUM.md`'ye yaz ve tasarımına başla.

Kurallar:
- Her adımın sonunda `DURUM.md`'yi güncelle: ne bitti, ölçümler, sıradaki adım.
- Her döngü turunda bu dosyayı yeniden oku; gözetim oturumu yönlendirmeyi buradan değiştirir.
- Kota biterse ya da çözemediğin bir hata çıkarsa durumu `DURUM.md`'ye yaz ve dur.
- Yasaklar:
  - public yapma, Pages, npm, sosyal medya;
  - `D:\Claude Projeleri` altına yazma;
  - kalıcı silme.
