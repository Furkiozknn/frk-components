// Ağır işler (Chromium, HyperFrames render) için dosya kilidi: repo kökünde .agir-is.kilit (YEDEK ile ortak kural).
import { closeSync, openSync, readFileSync, unlinkSync, writeSync } from 'node:fs';

const KILIT = new URL('../../.agir-is.kilit', import.meta.url);

export async function kilitAl(ne, beklemeSn = 900) {
  const bas = Date.now();
  for (;;) {
    try {
      const fd = openSync(KILIT, 'wx');
      writeSync(fd, `b1 ${new Date().toISOString()} ${ne}\n`);
      closeSync(fd);
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      if (Date.now() - bas > beklemeSn * 1000) throw new Error('kilit alınamadı: ' + readFileSync(KILIT, 'utf8').trim());
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  const birak = () => { try { unlinkSync(KILIT); } catch { /* zaten yok */ } };
  process.on('exit', birak);
  process.on('SIGINT', () => { birak(); process.exit(130); });
  return birak;
}
