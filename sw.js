/* ═══════════════════════════════════════════════════════════
   Kotchami — Service Worker (PWA)
   Stratégie : "network-first" pour les pages (toujours la version
   la plus récente quand le réseau est là), avec repli sur le cache
   hors-ligne. Les assets statiques sont mis en cache à l'installation.
   Soli Deo Gloria
═══════════════════════════════════════════════════════════ */

var CACHE = "kotchami-v6";

// Ressources de base mises en cache dès l'installation
var CORE = [
  "/",
  "/index.html",
  "/manifeste.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png"
];

// Installation : on pré-cache le cœur, sans bloquer si un fichier manque
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(
        CORE.map(function (url) {
          return c.add(url).catch(function () { /* on ignore les échecs isolés */ });
        })
      );
    })
  );
});

// Activation : on nettoie les anciens caches
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// Requêtes : network-first, repli cache. On ne touche qu'au GET same-origin.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // on laisse passer Firebase, FedaPay, fonts, etc.

  e.respondWith(
    fetch(req)
      .then(function (resp) {
        // On met à jour le cache avec la version fraîche
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy).catch(function () {}); });
        return resp;
      })
      .catch(function () {
        // Hors-ligne : on sert depuis le cache, sinon la page d'accueil
        return caches.match(req).then(function (hit) {
          return hit || caches.match("/index.html");
        });
      })
  );
});
