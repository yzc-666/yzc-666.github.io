/*
 * Cleanup worker for the retired Chirpy PWA.
 *
 * Returning visitors may still have the old /sw.js registration controlling
 * this origin. Publishing a worker at the same URL lets the browser update
 * that registration, delete its caches, and then unregister it.
 */

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            return caches.delete(key);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
      .then(function () {
        return self.registration.unregister();
      })
  );
});
