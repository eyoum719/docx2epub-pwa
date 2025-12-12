const CACHE_NAME = "docx2epub-pwa-mammoth-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/app.js",
  "/css/style.css",
  "https://unpkg.com/mammoth@1/dist/mammoth.browser.min.js",
  "https://unpkg.com/jszip@3/dist/jszip.min.js",
  "https://unpkg.com/epub-gen@0.1/dist/epub-gen.umd.js",
];

// Installation : mettre en cache les assets statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activation : supprimer les anciennes caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  // Pour les requêtes GET, tenter d'abord le cache, puis le réseau
  if (event.request.method === "GET") {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Renvoyer la version en cache si disponible, sinon aller chercher en réseau
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
