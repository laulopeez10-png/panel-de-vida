// Guarda la app en el celu para que abra sin internet. Tus datos no pasan por acá (están en el almacenamiento del navegador).
const VERSION = 'pdv-v1';
const ARCHIVOS = ['./', './index.html', './css/estilos.css', './js/app.js', './manifest.webmanifest', './iconos/icono-192.png', './iconos/icono-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin === location.origin) {
    // Primero la red (para tener siempre la última versión); sin internet, lo guardado
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSION).then((ca) => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))));
  } else if (u.hostname.includes('fonts.g')) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const c = res.clone(); caches.open(VERSION).then((ca) => ca.put(e.request, c)); return res; })));
  }
});
