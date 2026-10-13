// Menyalakan backend Laravel untuk uji e2e: database SQLite baru yang di-seed (konten placeholder +
// akun demo), lalu `php artisan serve`. Dipanggil oleh `webServer` di playwright.config.ts.
//
// Semua konfigurasi lewat variabel lingkungan (mengalahkan backend/.env bila ada), jadi uji tidak
// menyentuh database pengembangan.
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const backendDir = path.resolve('../backend');
const port = process.env.BACKEND_PORT ?? '8001';
const database = path.join(backendDir, 'database', 'e2e.sqlite');

for (const suffix of ['', '-wal', '-shm']) fs.rmSync(database + suffix, { force: true });
fs.writeFileSync(database, '');

const env = {
  ...process.env,
  APP_NAME: 'PEMDI PANRB',
  APP_ENV: 'local',
  APP_DEBUG: 'false',
  APP_KEY: `base64:${randomBytes(32).toString('base64')}`,
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: database,
  // File, bukan database: banyak worker Playwright menulis sesi bersamaan.
  SESSION_DRIVER: 'file',
  CACHE_STORE: 'file',
  QUEUE_CONNECTION: 'sync',
  LOG_CHANNEL: 'stderr',
  LOG_LEVEL: 'warning',
  DEMO_USER_PASSWORD: process.env.E2E_DEMO_PASSWORD,
  // Server bawaan PHP melayani satu permintaan sekaligus tanpa ini.
  PHP_CLI_SERVER_WORKERS: '4',
};

// cache:clear mengosongkan hitungan rate limit login dari run sebelumnya (disimpan di cache file).
for (const command of [
  'php artisan migrate:fresh --seed --force --no-interaction',
  'php artisan cache:clear --no-interaction',
]) {
  const result = spawnSync(command, { cwd: backendDir, env, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// --no-reload: variabel lingkungan di atas diteruskan apa adanya ke proses server.
const server = spawn(
  'php',
  ['artisan', 'serve', '--host=127.0.0.1', `--port=${port}`, '--no-reload'],
  {
    cwd: backendDir,
    env,
    stdio: 'inherit',
  },
);

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code ?? 0));
