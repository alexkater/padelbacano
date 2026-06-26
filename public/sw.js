// ─── PádelBacano Service Worker — v2 ─────────────────────────────────────
// Cache strategy: stale-while-revalidate for pages, cache-first for static
// assets, dedicated offline fallback, background sync for analytics.
// Denylist (T72): /admin, /api, /login, /register, /perfil, /reservar,
// /facturacion, /analytics — never cached.

const SHELL_CACHE = "padelbacano-shell-v2";
const STATIC_CACHE = "padelbacano-static-v1";
const PAGE_CACHE = "padelbacano-pages-v1";
const ANALYTICS_QUEUE = "padelbacano-analytics-queue-v1";

const PRECACHE_URLS = [
  "/",
  "/buscar",
  "/offline.html",
  "/manifest.json",
  "/icon.png",
];

const SENSITIVE_PREFIXES = [
  "/admin",
  "/api",
  "/login",
  "/register",
  "/perfil",
  "/reservar",
  "/facturacion",
  "/analytics",
];

function isSensitive(url) {
  return SENSITIVE_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix + "/"));
}

function isStaticAsset(request, url) {
  return (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "worker" ||
    url.pathname.startsWith("/_next/static/")
  );
}

function shouldCache(response) {
  return response.ok && response.type === "basic";
}

// ─── Install: Precaches boilerplate shell assets ─────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // addAll fails atomically — use individual puts for resilience
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url)
            .then((res) => { if (res.ok) cache.put(url, res); })
            .catch(() => { /* skip offline during install */ })
        )
      );
      await self.skipWaiting();
    })()
  );
});

// ─── Activate: Removes stale caches, claims clients ──────────────────────
self.addEventListener("activate", (event) => {
  const validCaches = [SHELL_CACHE, STATIC_CACHE, PAGE_CACHE, ANALYTICS_QUEUE];
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !validCaches.includes(key)).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// ─── Background Sync: Flushes queued analytics on reconnect ──────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "pb-analytics-sync") {
    event.waitUntil(flushAnalyticsQueue());
  }
});

async function flushAnalyticsQueue() {
  try {
    const cache = await caches.open(ANALYTICS_QUEUE);
    const requests = await cache.keys();
    if (requests.length === 0) return;

    const results = await Promise.allSettled(
      requests.map(async (req) => {
        const payload = await cache.match(req).then((r) => r?.text());
        const fetchOpts = payload
          ? { method: "POST", body: payload, headers: { "Content-Type": "application/json" } }
          : {};
        const res = await fetch("/api/analytics/ingest", fetchOpts);
        if (res.ok) await cache.delete(req);
        return res.ok;
      })
    );

    // Re-register sync if any items remain (failed sends)
    const remaining = await cache.keys();
    if (remaining.length > 0 && "sync" in self.registration) {
      await self.registration.sync.register("pb-analytics-sync");
    }
  } catch {
    // Will retry on next sync event
  }
}

// ─── Push event ──────────────────────────────────────────────────────────────
// Handles incoming push notifications from the server.
self.addEventListener("push", (event) => {
  let data = { title: "PádelBacano", body: "", icon: "/icon.png", data: {} };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text() || "";
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: "/icon.png",
    vibrate: [200, 100, 200],
    data: data.data,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── Notification click ──────────────────────────────────────────────────────
// Opens the app when the user clicks a notification.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ─── Fetch: Routing by asset type ────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Denylist check — never cache sensitive paths
  if (isSensitive(url)) return;

  // ── Static assets: Cache-first ──────────────────────────────────────
  if (isStaticAsset(request, url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        try {
          const network = await fetch(request);
          if (shouldCache(network)) {
            const clone = network.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return network;
        } catch {
          return cached ?? new Response("", { status: 408 });
        }
      })()
    );
    return;
  }

  // ── Navigation / pages: Stale-while-revalidate ──────────────────────
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request, { cacheName: PAGE_CACHE });

        const revalidate = async () => {
          try {
            const network = await fetch(request);
            if (shouldCache(network)) {
              const clone = network.clone();
              caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone));
            }
            return network;
          } catch {
            return undefined;
          }
        };

        // Return cached immediately if available (stale), refresh in background
        if (cached) {
          // Fire-and-forget revalidation (revalidate already stores the fresh copy)
          revalidate().catch(() => {});
          return cached;
        }

        // Nothing cached — wait for network or fall back
        const network = await revalidate();
        if (network) return network;

        // Completely offline — serve fallback
        const fallback = await caches.match("/offline.html", { cacheName: SHELL_CACHE });
        return fallback ?? new Response("Sin conexión", {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      })()
    );
    return;
  }

  // ── Other same-origin requests: Network-first ────────────────────────
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        const fallback = await caches.match("/offline.html", { cacheName: SHELL_CACHE });
        return fallback ?? new Response("Sin conexión", { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
    })()
  );
});
