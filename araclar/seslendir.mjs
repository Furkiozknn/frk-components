// seslendir.mjs: metinden SEZGİ konuşma verisi üretir. Ses dosyası + genlik zarfı + kelime zamanları tek JSON'da;
// status-orb'a `speech` olarak verilir ve küre aynı kareyi her seferinde çizer (canlı demo ve video aynı).
// Kullanım (depo kökünden):
//   node araclar/seslendir.mjs --motor windows-tolga --ad tr --metin "Merhaba, ben Sezgi."     (çevrimdışı; kelime zamanı yaklaşık)
//   node araclar/seslendir.mjs --motor edge --ses tr-TR-AhmetNeural --ad tr --metin-dosyasi m.txt (internet; kelime zamanı motordan)
//   node araclar/seslendir.mjs --motor dosya --ses-dosyasi benim.wav --ad benim --metin "..." [--kelimeler k.json]
// Motorlar: windows-tolga (TR), windows-zira (EN), edge (edge-tts; Microsoft'un resmî olmayan ucu: ticari kullanımdan önce şartları kontrol et),
//           dosya (kendi ses dosyan; ElevenLabs, Piper, kendi sesin... ffmpeg'in okuduğu her biçim).
// Ses dosyası assets/ses/ altına (git dışı), JSON --json-dizini altına yazılır. --js SEZGI_SES ise file:// altında da yüklenen `window.SEZGI_SES["<ad>"] = {...}` .js dosyası da yazılır.
// Gerekir: node ≥ 18, ffmpeg. Aynı ses dosyası + aynı fps → aynı JSON (rastgelelik yok).
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SR = 16000, SALDIRMA = 0.6, BIRAKMA = 0.2;          // saldırma/bırakma: küre sesle şişer, yavaş söner (kare başına 0–1)
const r3 = (v) => Math.round(v * 1000) / 1000;

// Örnekler (mono, SR Hz) → kare başına 0–1 genlik. ham: RMS / %98'lik değer; zarf: ham'ın saldırma/bırakmayla yumuşatılmışı.
export function zarfCikar(x, fps) {
  const kare = Math.ceil((x.length / SR) * fps), rms = new Float64Array(kare);
  for (let i = 0; i < kare; i++) {
    const bas = Math.floor((i * SR) / fps), son = Math.min(x.length, Math.floor(((i + 1) * SR) / fps));
    let t = 0;
    for (let j = bas; j < son; j++) t += x[j] * x[j];
    rms[i] = son > bas ? Math.sqrt(t / (son - bas)) : 0;
  }
  const sirali = Array.from(rms).sort((a, b) => a - b);
  const ref = sirali[Math.min(sirali.length - 1, Math.floor(sirali.length * 0.98))] || 1e-9;
  const ham = Array.from(rms, (v) => Math.min(1, v / ref));
  let onceki = 0;
  const zarf = ham.map((v) => (onceki += (v - onceki) * (v > onceki ? SALDIRMA : BIRAKMA)));
  return { ham: ham.map(r3), zarf: zarf.map(r3) };
}

// Motorun kelime zamanı yoksa: sesli aralığa (zarf ≥ 0,05) karakter oranıyla dağıt; noktalama sonrası kısa bekleme payı.
// ponytail: karakter oranı kaba; gerçek hizalama için motor zamanı ya da zorlamalı hizalayıcı (aeneas, whisper) gerekir.
export function yaklasikKelimeler(metin, zarf, fps) {
  const tok = metin.trim().split(/\s+/).filter(Boolean);
  const ilk = zarf.findIndex((v) => v >= 0.05), son = zarf.length - 1 - [...zarf].reverse().findIndex((v) => v >= 0.05);
  if (!tok.length || ilk < 0) return [];
  const t0 = ilk / fps, T = (son + 1) / fps - t0;
  const harf = (s) => s.replace(/[^\p{L}\p{N}]/gu, '').length || 1, bekle = (s) => (/[.!?]$/.test(s) ? 3 : /[,;:]$/.test(s) ? 1.5 : 0);
  const topla = tok.reduce((a, s) => a + harf(s) + bekle(s), 0);
  let c = 0;
  return tok.map((s) => { const b = t0 + (T * c) / topla; c += harf(s) + bekle(s); return { kelime: s.replace(/[.,;:!?]+$/, ''), baslangic_sn: r3(b), sure_sn: r3((T * harf(s)) / topla) }; });
}

function cmd(ad, args, opts) {
  const r = spawnSync(ad, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) throw new Error(ad + ' başarısız: ' + (r.stderr || r.error || '').toString().slice(0, 400));
  return r;
}

function ana() {
  const a = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => (v.startsWith('--') ? acc.concat([[v.slice(2), arr[i + 1]]]) : acc), []));
  if (!a.motor || !a.ad) { console.error('kullanım: node araclar/seslendir.mjs --motor windows-tolga|windows-zira|edge|dosya --ad <ad> --metin "..." (ayrıntı dosyanın başında)'); process.exit(2); }
  const fps = Number(a.fps || 30), sesDir = resolve(a['ses-dizini'] || 'assets/ses'), jsonDir = resolve(a['json-dizini'] || 'components/status-orb/konusma');
  const metin = (a.metin || (a['metin-dosyasi'] ? readFileSync(a['metin-dosyasi'], 'utf8') : '')).trim();
  if (!metin) { console.error('metin gerekli (--metin ya da --metin-dosyasi)'); process.exit(2); }
  mkdirSync(sesDir, { recursive: true }); mkdirSync(jsonDir, { recursive: true });
  const m = join(tmpdir(), 'sezgi-metin-' + a.ad + '.txt');
  writeFileSync(m, metin, 'utf8');                          // metin komut satırından değil UTF-8 dosyadan gider (Türkçe harfler bozulmasın)

  let ses, kelimeler = null, sesAdi = a.ses || null;
  if (a.motor.startsWith('windows-')) {
    ses = join(sesDir, a.ad + '.wav'); sesAdi = a.motor.slice(8);
    cmd('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(here, 'ses', 'windows_ses.ps1'), '-Motor', sesAdi, '-MetinDosyasi', m, '-Cikti', ses]);
  } else if (a.motor === 'edge') {
    ses = join(sesDir, a.ad + '.mp3'); sesAdi = a.ses || 'tr-TR-AhmetNeural';
    const k = join(tmpdir(), 'sezgi-kelime-' + a.ad + '.json');
    cmd('uvx', ['--from', 'edge-tts', 'python', join(here, 'ses', 'edge_sentez.py'), '--metin-dosyasi', m, '--ses', sesAdi, '--mp3', ses, '--kelimeler', k], { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    kelimeler = JSON.parse(readFileSync(k, 'utf8'));
  } else if (a.motor === 'dosya') {
    if (!a['ses-dosyasi']) { console.error('--motor dosya için --ses-dosyasi gerekli'); process.exit(2); }
    ses = join(sesDir, a.ad + extname(a['ses-dosyasi']));
    if (resolve(a['ses-dosyasi']) !== ses) copyFileSync(a['ses-dosyasi'], ses);
    if (a.kelimeler) kelimeler = JSON.parse(readFileSync(a.kelimeler, 'utf8'));
  } else { console.error('bilinmeyen motor: ' + a.motor); process.exit(2); }

  const b = cmd('ffmpeg', ['-v', 'error', '-i', ses, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { encoding: 'buffer', maxBuffer: 1 << 29 }).stdout;
  const x = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  const { ham, zarf } = zarfCikar(x, fps);
  const motorZamani = !!kelimeler;
  kelimeler = kelimeler || yaklasikKelimeler(metin, zarf, fps);
  const tok = metin.split(/\s+/).filter(Boolean);
  if (tok.length === kelimeler.length) kelimeler = kelimeler.map((e, i) => ({ ...e, yazi: tok[i] }));   // altyazıda noktalama korunur
  let tepe = 0, toplam = 0;
  for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); if (v > tepe) tepe = v; toplam += x[i] * x[i]; }
  const cikti = {
    surum: 1, motor: a.motor, ses: sesAdi, metin, fps, sure_sn: r3(x.length / SR), kare_sayisi: zarf.length,
    tepe_dbfs: Math.round(20 * Math.log10(tepe || 1e-9) * 10) / 10, rms_dbfs: Math.round(10 * Math.log10(toplam / x.length || 1e-12) * 10) / 10,
    kelime_zamani: motorZamani ? 'motor' : 'yaklasik', kelimeler, zarf, ham,
  };
  const j = join(jsonDir, a.ad + '.speech.json');
  writeFileSync(j, JSON.stringify(cikti));
  if (a.js) writeFileSync(join(jsonDir, a.ad + '.speech.js'), '(window.' + a.js + '=window.' + a.js + '||{})[' + JSON.stringify(a.ad) + ']=' + JSON.stringify(cikti) + ';\n');
  console.log(JSON.stringify({ json: j, ses, sure_sn: cikti.sure_sn, kare: cikti.kare_sayisi, kelime: kelimeler.length, kelime_zamani: cikti.kelime_zamani, tepe_dbfs: cikti.tepe_dbfs, rms_dbfs: cikti.rms_dbfs }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) ana();
