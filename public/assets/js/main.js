/* Zichao Yu — site script. No dependencies. */

(function () {
  "use strict";

  /* An earlier version of this site installed a service worker at the root
     scope, which can keep serving stale pages to returning visitors. Other
     projects share this origin (e.g. /ai-finance-radar/), so only the
     root-scope registration is removed. */
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      var root = registrations.filter(function (registration) {
        return registration.scope === window.location.origin + "/";
      });
      if (!root.length) return;

      root.forEach(function (registration) {
        registration.unregister();
      });
      if ("caches" in window) {
        caches.keys().then(function (keys) {
          keys.forEach(function (key) {
            caches.delete(key);
          });
        });
      }
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
