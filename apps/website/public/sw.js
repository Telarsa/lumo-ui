/*
 * A self-destructing service worker.
 *
 * This site never registers one — but some OTHER project once served on this
 * origin (localhost:3000) did, and browsers keep a worker per-origin until it
 * is replaced or unregistered. That stale worker phones home for /sw.js on
 * every visit. Serving THIS file at the same path makes the browser install it
 * as the update — whereupon it unregisters itself, takes over any open tabs,
 * and reloads them clean. After one visit there is no worker at all.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", async () => {
  await self.registration.unregister();
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) client.navigate(client.url);
});
