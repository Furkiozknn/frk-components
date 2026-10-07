# SEZGİ: Jarvis rakip araştırması (06.10.2026)

Kaynak: `gh search repos --topic jarvis-ai --sort stars --limit 20`; ilk 14 depo (README, dosya listesi, `requirements.txt`, tek dosya `AICoreSphere.tsx`) okundu. Klonlama ya da kod çalıştırma yok. Yıldızlar 06.10.2026'da ölçüldü. "bilinmiyor" = README ve okunan dosyalarda yok. Kalan 6 depo (JARVIS-MARK5 94★, Virtual-Voice-Assistant, Jarvis-v2.0, JARVIS-AI-Assistant, TrustOS, pratit989/JARVIS) alınmadı (görev 10–15 depo istiyor; TrustOS Jarvis değil, bir işletim sistemi).

| # | Depo (★, lisans) | Ne yapar | Ses: uyandırma / STT / TTS | Arayüz |
|---|---|---|---|---|
| 1 | GauravSingh9356/J.A.R.V.I.S (1389, MIT) | Python masaüstü asistanı: e-posta, OCR, haber, YouTube, yüz tanıma kilidi | bilinmiyor / SpeechRecognition / pyttsx3 | ekran görüntüleri var; küre/dalga bilinmiyor |
| 2 | kishanrajput23/Jarvis-Desktop-Voice-Assistant (975, MIT) | Python: saat, Wikipedia, müzik, ekran görüntüsü | bilinmiyor / SpeechRecognition / pyttsx3 | bilinmiyor |
| 3 | akshayaggarwal99/jarvis-ai-assistant (645, MIT) | Mac sesli dikte + küçük eylemler; yerel/bulut | uyandırma yok (Fn bas-konuş) / yerel Whisper ya da Parakeet (Sherpa-ONNX), bulutta Deepgram + Gemini / bilinmiyor | bilinmiyor; Ollama desteği |
| 4 | gia-guar/JARVIS-ChatGPT (464, MIT, arşivlenmiş 2023) | OpenAI + hafızalı konuşma asistanı | tetik kelimesi "Jarvis" (Porcupine isteğe bağlı) / Whisper / Coqui ses klonu (film sesi), IBM Watson, ElevenLabs | terminal; küre yok |
| 5 | BolisettySujith/J.A.R.V.I.S (383, MIT) | Python: ekran kaydı, ekran görüntüsü, telefon kamerası | "wake up" komutuyla uykudan çıkar (ayrı model yok) / SpeechRecognition / pyttsx3 | GIF'li arayüz (`JarvisUi.py`) |
| 6 | blogminhquy/javis-os (221, MIT) | LLM ajanı: markdown "ikinci beyin", bilgi grafiği, Telegram/Slack/WhatsApp, görev kuyruğu | bilinmiyor / bilinmiyor / Edge TTS (varsayılan, ücretsiz), OpenAI, ElevenLabs | düz HTML/CSS/JS pano; küre yok |
| 7 | IRISX-AI/IRIS-AI (211, özel lisans) | Electron masaüstü asistanı, ekran OCR, yüz kilidi | çevrimdışı "Hey IRIS" / Gemini Live API (WebRTC ses) / Gemini Live | **Three.js parçacık küre** (`AICoreSphere.tsx`, `isSpeaking`/`isConnected` ile sürülür) |
| 8 | codewithbro95/J.A.R.V.I.S (184, MIT) | Çevrimdışı hedefli: Ollama'da ince ayarlı Llama-2, webcam (LLaVA) | "hey jarvis" komut kalıbı / Whisper yalnız yapılacaklarda / kokoro-onnx → LuxTTS | `/koki` React+TS+Electron HUD, yapım aşamasında |
| 9 | Likhithsai2580/JARVIS (147, MIT) | Python + Gemini asistanı | bilinmiyor / SpeechRecognition / pyttsx3, edge-tts | PyQt5; **Iron Man GIF'leri** (`UI/ironman*.gif`) |
| 10 | Avinashb722/jarvis-ai-assistant (120, MIT) | Groq + Gemini, yüz + parmak izi doğrulama, telefon bağlantısı | "Hey Jarvis" (motor bilinmiyor) / SpeechRecognition / pyttsx3 | Eel web arayüzü, animasyon; küre bilinmiyor |
| 11 | KKshitiz/J.A.R.V.I.S (116, MIT, son itme 08.2020) | Python: yüz tanıma, hava, takvim, Wolfram | yok / `recognize_google` / pyttsx3 | yalnız plan notu (`gui/README_gui.md`) |
| 12 | LTripleP/heoster-jarvis-ai-assistant (116, lisans yok) | yalnız README + `index.html`; çalışan kod yok | bilinmiyor | bilinmiyor; `.github` altında rastgele adlı dosyalar; iddialar doğrulanamaz |
| 13 | Aryan-0001/Jarvis-AI (112, MIT) | Flutter APK + Python; Google Generative AI | bilinmiyor / speech_to_text, SpeechRecognition / flutter_tts, pyttsx3 | mobil Flutter ekranları; küre bilinmiyor |
| 14 | aerele/jarvis (94, AGPL-3.0) | ERPNext içinde yapay zekâ iş arkadaşı; ses yok | yok | ERPNext arayüzü |

## Bulgular
- 14 depodan 7'si SpeechRecognition + pyttsx3 sınıfı; geri kalanı bulut canlı API'ye (Gemini Live) ya da yerel model yığınına yaslanıyor.
- Uyandırma kelimesi iddia eden 5 depo var (#4, #5, #7, #8, #10); yalnız #4 motor adı veriyor (Porcupine), #7 "çevrimdışı" diyor.
- Küre/parçacık arayüzü yalnız IRIS'te doğrulandı; ama çekirdek ses motoru gizli, ücretsiz katman yalnız arayüz kabuğu. README "MIT" diyor, `LICENSE` dosyası ise özel kaynak-açık ("yalnız kişisel, eğitim ve kâr amaçsız"); GitHub lisansı NOASSERTION gösteriyor. Kod alınamaz.
- İki depo (#5, #9) film görüntüsüne dayalı GIF kullanıyor, #4 film sesini klonluyor: SEZGİ'nin yapmayacağı şeyler.
- README'lerin hiçbirinde Türkçe geçmiyor. Ses zarfını önceden çıkarıp `seek(t)` ile kare kare tekrarlanabilir küre sunan depo görülmedi.
- Ölçülmedi: gecikme, tanıma doğruluğu, gerçek kurulum denemesi, kodun tamamı.

## SEZGİ'ye alınacak 5 fikir
1. **Sese bağlı, tekrarlanabilir küre.** IRIS kürenin `isSpeaking` durumuyla sürüldüğünü gösteriyor; SEZGİ zarfı wav'dan önceden çıkarıp `seek(t)` ile okur, canlı demo ve video aynı görünür. Yalnız fikir; IRIS lisansı kodu yasaklıyor.
2. **Bas-konuş, yerel öncelikli ses girişi.** #3 (MIT) Fn bas-konuş + yerel Whisper/Parakeet + bulut yedeği kuruyor. SEZGİ demosuna bas-konuş düğmesi, uyandırma kelimesi ikinci sürüme. Kod alınırsa MIT bildirimi ve kaynak yazılır; şimdilik yalnız tasarım fikri.
3. **Onay bekliyor durumu.** #14 "Sor, doğrula, onayla": yazan ya da geri alınamaz eylem insan onayı bekler. `status-orb`'a dinliyor/düşünüyor/arıyor/bitti yanında bir "onay bekliyor" durumu önerilir. AGPL: kod yok, fikir.
4. **Değiştirilebilir ses sağlayıcısı, ücretsiz varsayılan.** #6 (MIT) Edge TTS'i varsayılan, OpenAI/ElevenLabs'i isteğe bağlı yapıyor. SEZGİ: kokoro / Windows Tolga-Zira varsayılan, tek satırlık ayarla değişir.
5. **Özgün kimlik + Türkçe.** Rakiplerde film GIF'i ve film sesi klonu var, Türkçe odaklı olan yok. SEZGİ özgün küre, Türkçe doğal ses ve Türkçe demo ile ayrışır; Marvel/Iron Man logosu, film görüntüsü ve film sesi taklidi kullanılmaz.

## Düzeltme (07.10.2026)
- Yukarıdaki "ses zarfını önceden çıkarıp `seek(t)` ile kare kare tekrarlanabilir küre sunan depo görülmedi" tespiti **yanlıştı**: Ship Notes `speaking-orb.js` (`aqualang89/shipnotes-components`, MIT) `renderAt(time,{weights,env,onsets,words,lineTime})` sunuyor. SEZGİ'nin gerçek ayrışması: Türkçe, zarf çıkarıcı (`araclar/seslendir.mjs`), yapım kaydı, üç motorda bayt kanıtı, yarı boyut. Kaynak: `D:\Claude Projeleriaporlar6-10-07-sezgi-konum-ve-fiyat-2.md`.
