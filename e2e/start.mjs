// Membangun situs dengan variabel lingkungan uji, lalu melayaninya lewat server statis e2e.
// Dipanggil oleh `webServer` di playwright.config.ts.
import { spawnSync } from 'node:child_process';

process.env.VITE_SITE_URL = 'https://pemdi.example.go.id';
// Endpoint se-origin, sama seperti rekomendasi produksi (CSP connect-src 'self'); dicegat per uji.
process.env.VITE_CONTACT_ENDPOINT = '/api/contact';

// Satu string perintah (bukan argumen terpisah) agar tidak memicu DEP0190 pada shell: true.
const build = spawnSync('npm run build', { stdio: 'inherit', shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

await import('./static-server.mjs');
