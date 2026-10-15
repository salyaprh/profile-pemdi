// Menyalakan backend Laravel untuk uji e2e: database SQLite baru yang di-seed (konten placeholder +
// akun demo), lalu server bawaan PHP. Dipanggil oleh `webServer` di playwright.config.ts.
//
// Semua konfigurasi lewat variabel lingkungan (mengalahkan backend/.env bila ada), jadi uji tidak
// menyentuh database maupun folder unggahan pengembangan.
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const backendDir = path.resolve('../backend');
const port = process.env.BACKEND_PORT ?? '8001';
const database = path.join(backendDir, 'database', 'e2e.sqlite');
// Folder unggahan khusus e2e di disk `public` (lihat config/pemdi.php), dikosongkan setiap run.
const mediaDirectory = 'media-e2e';

for (const suffix of ['', '-wal', '-shm']) fs.rmSync(database + suffix, { force: true });
fs.writeFileSync(database, '');
fs.rmSync(path.join(backendDir, 'storage', 'app', 'public', mediaDirectory), {
  recursive: true,
  force: true,
});

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
  MEDIA_DIRECTORY: mediaDirectory,
  // Server bawaan PHP melayani satu permintaan sekaligus tanpa ini.
  PHP_CLI_SERVER_WORKERS: '4',
};

// cache:clear mengosongkan hitungan rate limit login dari run sebelumnya (disimpan di cache file).
// storage:link membuat public/storage -> storage/app/public agar gambar unggahan bisa dibuka.
for (const command of [
  'php artisan migrate:fresh --seed --force --no-interaction',
  'php artisan cache:clear --no-interaction',
  'php artisan storage:link --force --no-interaction',
]) {
  const result = spawnSync(command, { cwd: backendDir, env, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Sama dengan `composer dev`: `php artisan serve` tidak bisa menaikkan batas unggah PHP (bawaan
// 2 MB), padahal backend menerima gambar sampai 5 MB. Variabel lingkungan di atas diwarisi server.
// -q: tanpa log setiap permintaan (error PHP tetap tampil lewat LOG_CHANNEL=stderr).
const server = spawn(
  'php',
  [
    '-q',
    '-d',
    'upload_max_filesize=6M',
    '-d',
    'post_max_size=8M',
    '-S',
    `127.0.0.1:${port}`,
    '../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php',
  ],
  { cwd: path.join(backendDir, 'public'), env, stdio: 'inherit' },
);

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code ?? 0));
