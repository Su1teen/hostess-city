// Serves the static export and hands the Mapbox token to the browser at runtime,
// so the map works even when the variable was missing during `next build`.
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const out = join(process.cwd(), 'out');
if (!existsSync(out)) {
  console.error('Нет папки out/: сначала выполните npm run build.');
  process.exit(1);
}
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '';
writeFileSync(join(out, 'runtime-config.json'), JSON.stringify({ mapboxToken }));
console.log(mapboxToken ? 'Mapbox: токен передан в runtime-config.json' : 'Mapbox: переменная NEXT_PUBLIC_MAPBOX_TOKEN не задана — карта не загрузится');

const serve = createRequire(import.meta.url).resolve('serve/build/main.js');
const port = process.env.PORT || '3000';
const child = spawn(process.execPath, [serve, 'out', '--no-clipboard', '-l', `tcp://0.0.0.0:${port}`], { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 0));
