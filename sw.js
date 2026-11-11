const CACHE = "daily-v1";
const SHELL = ["./", "index.html", "icon.png", "icon-512.png", "manifest.webmanifest"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Network first so deploys show up right away. The cached copy is used offline or when the network takes over 3 seconds.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const net = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; });
    net.catch(() => {});
    try { const r = await Promise.race([net, new Promise(res => setTimeout(res, 3000))]); if (r) return r; } catch (err) {}
    return (await cache.match(e.request, { ignoreSearch: true })) || net;
  })());
});
