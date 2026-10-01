// Türev kopya bayat mı? deneme/<parca>/*.js (hazirla.mjs / uret.mjs üretir) bileşenin kendisiyle aynı olmalı;
// değilse kanıt eski kodla ölçülmüş olur (odometer V3'te sessizce böyle kalmıştı).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function bayatKopyalar(kok, parcalar) {
  const bayat = [];
  for (const p of parcalar) {
    const d = join(kok, 'deneme', p);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      const asil = join(kok, 'components', f.slice(0, -3), f);
      if (f.endsWith('.js') && existsSync(asil) && !readFileSync(asil).equals(readFileSync(join(d, f)))) bayat.push(`${p}/${f}`);
    }
  }
  return bayat;
}

export function bayatsaDur(kok, parcalar) {
  const bayat = bayatKopyalar(kok, parcalar);
  if (!bayat.length) return;
  console.error(`Türev kopya bayat: ${bayat.join(', ')}\nÖnce: node deneme/hazirla.mjs (vitrin-tanitim için: node deneme/vitrin-tanitim/uret.mjs)`);
  process.exit(2);
}
