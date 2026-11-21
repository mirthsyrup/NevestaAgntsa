import { createHash } from 'node:crypto';
import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const manifest = {
  id: './', start_url: './', scope: './', display: 'standalone',
  name: 'Невеста Агнца', short_name: 'Невеста Агнца', lang: 'ru',
  theme_color: '#F8F5EE', background_color: '#F8F5EE',
  icons: [
    { src: './icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: './icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
};

await Promise.all([
  copyFile('assets/favicon.png', resolve(dist, 'icon-192.png')),
  copyFile('assets/web-icon.png', resolve(dist, 'icon-512.png')),
  writeFile(resolve(dist, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2)),
]);
const index = resolve(dist, 'index.html');
const html = await readFile(index, 'utf8');
await writeFile(index, html.replace(/<html(?:\s+lang="[^"]*")?/, '<html lang="ru"')
  .replace(/<meta\s+name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />')
  .replace('</head>', `    <meta name="theme-color" content="#F8F5EE" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <link rel="manifest" href="./manifest.webmanifest" />
    <link rel="apple-touch-icon" href="./icon-192.png" />
  </head>`)
  .replace('</body>', `<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});</script></body>`));

const files = (await readdir(dist, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name !== 'sw.js' && !entry.name.endsWith('.map'))
  .map((entry) => resolve(entry.parentPath, entry.name).slice(dist.length + 1)).sort();
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(resolve(dist, file)));
const version = `nevesta-agntsa-${hash.digest('hex').slice(0, 12)}`;

await writeFile(resolve(dist, 'sw.js'), `const version = ${JSON.stringify(version)};
const appFiles = ${JSON.stringify(files.map((file) => './' + file))};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(version).then((cache) => cache.addAll(appFiles)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('nevesta-agntsa-') && key !== version).map((key) => caches.delete(key)))));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
  } else {
    event.respondWith(caches.match(event.request).then((found) => found || fetch(event.request)));
  }
});
`);
