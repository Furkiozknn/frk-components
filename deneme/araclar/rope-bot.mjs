// Otopilot kaydı üretici: node deneme/araclar/rope-bot.mjs [--level seviye.json]
// Çekirdeği (createSim) DOM'suz yükler; kanca/bırakma zamanlarını ışın aramasıyla (beam search) bulur.
// Çıktı: DEFAULT_INPUTS dizisi + bitiş adımı. Sonuç rope-swing.js içine elle yazılır (kayıt sabit kalır).
import { createRequire } from 'node:module';
const R = createRequire(import.meta.url)('../../components/rope-swing/rope-swing.js');

const level = R.LEVEL;
const sim = R.createSim(level);
const DT = R.DT;
const K = +(process.argv[2] || 10);                      // ışın genişliği
const PRESS = [], HOLD = [];
for (let p = 0; p <= 60; p += 3) PRESS.push(p);              // bırakmadan sonra basma gecikmesi (adım)
for (let h = 30; h <= 330; h += 6) HOLD.push(h);

function evalInputs(inputs, to) {
  sim.reset();
  return sim.run(inputs, to);
}

let beam = [{ inputs: [], rel: 0, score: 0 }];
let best = null;
for (let depth = 0; depth < 24 && beam.length; depth++) {
  const next = [];
  for (const b of beam) {
    for (const p of PRESS) {
      if (depth > 0 && p < 6) continue;                       // anlık yeniden basma (titreşim) yok
      for (const h of HOLD) {
        const press = b.rel + p + (depth === 0 ? 0 : 1), rel = press + h;
        const inputs = b.inputs.concat([[press, 1], [rel, 0]]);
        const s = evalInputs(inputs, rel + 45);
        if (s.deaths > 0) continue;
        const snap = { x: s.x, y: s.y, hooks: s.hooks };
        let fin = s.done && s.y <= 320 ? { doneStep: s.doneStep } : null;   // bitiş ekranda görünür yükseklikte olsun
        if (!fin && s.x > level.finishX - 450) {            // son uçuş: bitişe varıyor mu?
          const t = sim.run(inputs, rel + 260);
          if (t.done && t.deaths === 0 && t.y <= 320) fin = { doneStep: t.doneStep };
        }
        if (s.done && !fin) continue;
        if (fin) {
          if (!best || fin.doneStep < best.doneStep) best = { inputs, doneStep: fin.doneStep };
          continue;
        }
        if (snap.hooks <= depth) continue;              // bu segmentte kanca takılmadı
        next.push({ inputs, rel, score: snap.x - 320 * rel * DT - 0.5 * Math.max(0, snap.y - 250) });
      }
    }
  }
  next.sort((a, b) => b.score - a.score);
  const seen = new Set(), pick = [];
  for (const c of next) {                               // benzer durumları ele
    const key = Math.round(c.score / 8);
    if (seen.has(key)) continue;
    seen.add(key); pick.push(c);
    if (pick.length >= K) break;
  }
  beam = pick;
  console.error(`derinlik ${depth + 1}: aday ${next.length}, ışın ${beam.length}, en iyi x=${beam[0] ? Math.round(beam[0].score) : '-'}, bitiren=${best ? (best.doneStep * DT).toFixed(2) + ' s' : 'yok'}`);
  if (best && depth >= 6) break;
}
if (!best) { console.error('çözüm bulunamadı'); process.exit(1); }
console.log(JSON.stringify({ bitis_adimi: best.doneStep, bitis_sn: +(best.doneStep * DT).toFixed(3), inputs: best.inputs }));
