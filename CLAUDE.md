# frk-components — dokunulabilir parça vitrini

Bu klasördeki oturum (VS Code) Furki'nin "Ship Notes'un daha iyisi" projesini yapar. Gözetim, Claude Desktop'taki ana sohbetten yapılır. Yönlendirmeler `YONLENDIRME.md` dosyasında; senin durum notların `DURUM.md` dosyasında.

## Hedef

Tek dosyalık, kütüphanesiz, kare kare sarılabilir arayüz parçaları. Her parça:
- aynı dosyayla üç iş görür: canlı demo (GitHub Pages), HyperFrames video sahnesi, kopyalanabilir kod;
- yanında "Claude Code ile nasıl yapıldı" reçetesi taşır (prompt ve adımlar);
- Türkçe ve İngilizce sunulur;
- yalnız ölçülmüş iddialar içerir (boyut, performans, test);
- erişilebilirdir (klavye, reduced-motion, kontrast).

Önce oku: `D:\Claude Projeleri\raporlar\2026-10-02-rakip-analizi-bilesen-vitrinleri.md` (17 rakip, ölçütler, pilot önerisi).

## Kurallar

- Sayı uydurma. Ölçemediğini "ölçülmedi" diye yaz.
- Görsel kimlik FRK-OS: siyah zemin, krem yazı, sarı vurgu, League Gothic başlık, mono etiket.
- Sarılabilirlik:
  - Her parça `seek(t)` ile herhangi bir zamana deterministik gidebilmeli.
  - Rastgelelik tohumlu olmalı. Zaman dışarıdan verilir; doğrudan `performance.now()` okunmaz.
  - HyperFrames kuralları için `D:\Claude Projeleri\sosyal\uret\OKU.md` ve hafıza notu `hyperframes-video-hatti.md` dosyalarını yalnız oku.
- `D:\Claude Projeleri` altına yazma. Video hattı ve takvim başka oturumun işi. Pilot bölümü takvime gözetim oturumu ekler.
- GitHub: depo **private** açılır. Public yapma kararı Furki'nin. Sosyal medya paylaşımı ve npm yayını yok.
- Kota bütün oturumlarda ortak: haftalık %92, sıfırlanma Pazartesi 05.10 01:59. Model Sonnet 5.5.
- Pazartesiye kadar yalnız tasarım; asıl yapım kota sıfırlanınca başlar.
- Her iş bloğunun başında `YONLENDIRME.md`'yi oku. Sonunda `DURUM.md`'yi güncelle: ne bitti, ölçümler, sıradaki adım, takıldığın yer.
