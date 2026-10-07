"""edge_sentez.py - edge-tts ile mp3 + kelime zamanlari (JSON) uretir.
Kullanim: uvx --from edge-tts python edge_sentez.py --metin-dosyasi m.txt --ses tr-TR-AhmetNeural --mp3 c.mp3 --kelimeler k.json [--hiz +0%]
Kelimeler: [{"kelime","baslangic_sn","sure_sn"}] (edge-tts 7.2.8, boundary=WordBoundary; 06.10.2026'da tr ve en icin olculdu).
NOT: Microsoft'un Edge 'sesli oku' ucu resmi bir urun degil; ticari urunde kullanmadan once sartlari kontrol et."""
import argparse, asyncio, json
import edge_tts

ap = argparse.ArgumentParser()
ap.add_argument('--metin-dosyasi', required=True)
ap.add_argument('--ses', default='tr-TR-AhmetNeural')
ap.add_argument('--hiz', default='+0%')
ap.add_argument('--mp3', required=True)
ap.add_argument('--kelimeler', required=True)
a = ap.parse_args()
metin = open(a.metin_dosyasi, encoding='utf-8').read().strip()

async def main():
    c = edge_tts.Communicate(metin, a.ses, rate=a.hiz, boundary='WordBoundary')
    kelimeler = []
    with open(a.mp3, 'wb') as f:
        async for p in c.stream():
            if p['type'] == 'audio':
                f.write(p['data'])
            elif p['type'] == 'WordBoundary':
                kelimeler.append({'kelime': p['text'], 'baslangic_sn': round(p['offset'] / 1e7, 3), 'sure_sn': round(p['duration'] / 1e7, 3)})
    json.dump(kelimeler, open(a.kelimeler, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps({'ses': a.ses, 'kelime_sayisi': len(kelimeler), 'ilk_kelime': kelimeler[:1], 'son_kelime': kelimeler[-1:]}, ensure_ascii=False))

asyncio.run(main())
