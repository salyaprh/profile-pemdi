// Server statis untuk uji e2e: meniru perilaku Cloudflare Pages terhadap hasil build Vite.
//
// - menerapkan public/_headers (pola "/*" dan "/awalan/*"; header yang sama digabung dengan koma)
// - SPA fallback: path tanpa ekstensi yang tidak ada dilayani index.html dengan status 200
// - path berekstensi yang tidak ada mengembalikan 404 sungguhan
// - _headers dan _redirects tidak dilayani (seperti di Cloudflare Pages)
//
// Pakai: DIST_DIR=dist PORT=4173 node e2e/static-server.mjs
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(process.env.DIST_DIR ?? 'dist');
const port = Number(process.env.PORT ?? 4173);

const rules = [];
let current = null;
for (const raw of fs.readFileSync(path.join(root, '_headers'), 'utf8').split('\n')) {
  if (!raw.trim() || raw.trim().startsWith('#')) continue;
  if (!/^\s/.test(raw)) {
    current = { pattern: raw.trim(), headers: [] };
    rules.push(current);
    continue;
  }
  const index = raw.indexOf(':');
  current.headers.push([raw.slice(0, index).trim(), raw.slice(index + 1).trim()]);
}

const matches = (pattern, requestPath) =>
  pattern.endsWith('*') ? requestPath.startsWith(pattern.slice(0, -1)) : requestPath === pattern;

function headersFor(requestPath) {
  const merged = new Map();
  for (const rule of rules) {
    if (!matches(rule.pattern, requestPath)) continue;
    for (const [name, value] of rule.headers) {
      merged.set(name, merged.has(name) ? `${merged.get(name)}, ${value}` : value);
    }
  }
  return merged;
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.json': 'application/json',
};

const hidden = new Set(['/_headers', '/_redirects']);

// URL rusak (mis. %E0%A4%A) tidak boleh menjatuhkan server: perlakukan sebagai path apa adanya.
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

http
  .createServer((req, res) => {
    const requestPath = safeDecode(new URL(req.url ?? '/', 'http://localhost').pathname);

    let file = path.join(root, requestPath);
    const insideRoot = file.startsWith(root);
    const exists = insideRoot && fs.existsSync(file) && fs.statSync(file).isFile();

    if (hidden.has(requestPath) || (!exists && path.extname(requestPath))) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found');
      return;
    }
    if (!exists) file = path.join(root, 'index.html'); // SPA fallback

    const headers = {
      'Content-Type': contentTypes[path.extname(file)] ?? 'application/octet-stream',
    };
    for (const [name, value] of headersFor(requestPath)) headers[name] = value;

    res.writeHead(200, headers);
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`e2e server: ${root} di http://localhost:${port}`));
