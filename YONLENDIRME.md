# Yönlendirme (yalnız gözetim oturumu yazar)

## 02.10.2026 00:05 — İKİ OTURUM, KESİN İŞ BÖLÜMÜ

Bu yönlendirme öncekilerin yerine geçer. İki oturumun 23:56'da kendi aralarında yaptığı bölüşüm temel alındı.
- **b1:** VS Code paneli, `frk-components-b1`.
- **YEDEK:** terminal, `CLAUDE ve YONLENDIRME YEDEK`.

Gece modu sürüyor: kota bitene kadar durmadan çalışın, soru sormayın.

### Dosya sahipliği

Bir oturum diğerinin dosyasına dokunmaz. Bir şey gerekirse sahibine SendMessage atar.

| Sahip | Dosyalar |
|---|---|
| **b1** | `components/rope-swing/`, `components/status-orb/`, `deneme/`, `TASARIM.md`, `DURUM-b1.md` |
| **YEDEK** | `components/odometer/`, `components/prompt-terminal/`, `components/katki-isi/`, `araclar/`, `assets/`, `index.html`, `README.md`, `.gitignore`, `OLCUM.md`, `DURUM.md` |
| gözetim | `YONLENDIRME.md`, `CLAUDE.md` |

### b1: hareket ve video

1. `rope-swing` (kanca ipi) paketi: JS, `demo.html`, README (TR+EN), `RECETE.md`.
2. `deneme/`: her parça için 5 saniyelik HyperFrames kompozisyonu ve render.
   - Seek determinizmi: aynı `t` aynı kareyi üretmeli. Kare karşılaştırmasıyla kanıtla.
3. YENİ, parça 4: `status-orb`. Ship Notes'un Signal Orb'unun sarılabilir ve deterministik sürümü.
   - Canvas 2D, tohumlu parçacıklar.
   - Durumlar: dinliyor, düşünüyor, arıyor, bitti.
   - reduced-motion'da sabit görünür.
4. `TASARIM.md`'yi en fazla 80 satırda tut ve parçalarla uyumlu kalsın.
5. Durumunu yalnız `DURUM-b1.md`'ye yaz. `DURUM.md`'ye yazma.

### YEDEK: parçalar ve altyapı

1. `odometer`'ı bitir, ardından `prompt-terminal` paketini yap.
2. Ana demo ve depo:
   - kök `index.html` (FRK-OS, mobil), `README.md` (TR+EN), `.gitignore`;
   - git'i yalnız YEDEK kullanır; b1'in dosyalarını da o commit'ler;
   - GitHub'da **private** `Furkiozknn/frk-components` aç;
   - her parça bitince commit ve push. Kota her an bitebilir, iş GitHub'da dursun.
3. `OLCUM.md`: `araclar/olc.mjs` ile bütün parçaların gerçek ölçüm tablosu (boyut, ilk boyama, FPS, erişilebilirlik).
4. YENİ, parça 5: `katki-isi`. GitHub katkı ızgarası gibi zamanla dolan, sarılabilir ısı haritası. Demo verisi "örnek veri" diye etiketlenir.
5. `DURUM.md` genel özetini yaz; b1'in durumunu `DURUM-b1.md`'den özetle.

### İkisi için

- RAM 7,8 GB. Ağır işler (HyperFrames render, Playwright ölçümü) aynı anda koşmasın. Başlamadan önce diğerine kısa bir mesaj at.
- Her döngü turunda bu dosyayı yeniden oku.
- Yasaklar:
  - depoyu public yapma, Pages, npm, sosyal medya;
  - `D:\Claude Projeleri` altına yazma;
  - kalıcı silme.
- Kota biterse ya da çözemediğin bir hata çıkarsa kendi durum dosyana yaz ve dur.
