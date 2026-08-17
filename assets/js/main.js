/* Zichao Yu — site interactions. No dependencies. */

(function () {
  "use strict";

  /* -------------------------------------------------- retire old Chirpy PWA
     The previous version of this site installed a service worker. A normal
     redesign does not remove it from returning visitors' browsers, so it can
     keep serving the old site indefinitely. This site has no offline mode:
     remove all registrations and same-origin caches once the new JS loads. */

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      registrations.forEach(function (registration) {
        registration.unregister();
      });
    });
  }

  if ("caches" in window) {
    caches.keys().then(function (keys) {
      keys.forEach(function (key) {
        caches.delete(key);
      });
    });
  }

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ------------------------------------------------------- current year - */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* -------------------------------------------------------- mobile menu - */

  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------------------------------------------------- reading progress - */

  var nav = document.getElementById("nav");

  if (nav) {
    var ticking = false;

    var updateProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      nav.style.setProperty(
        "--progress",
        String(Math.min(1, Math.max(0, ratio)))
      );
    };

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          updateProgress();
          ticking = false;
        });
      },
      { passive: true }
    );

    updateProgress();
  }

  /* ----------------------------------------------------- reveal on scroll - */

  var revealables = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );

    Array.prototype.forEach.call(revealables, function (el, i) {
      // Stagger items in the same row so they cascade rather than pop.
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      observer.observe(el);
    });
  }

  /* -------------------------------------------------------- typing effect - */

  var typed = document.querySelector(".typed");

  if (typed && !reduceMotion) {
    var phrases;
    try {
      phrases = JSON.parse(typed.getAttribute("data-typed") || "[]");
    } catch (err) {
      phrases = [];
    }

    if (phrases.length > 1) {
      var phraseIndex = 0;
      var charIndex = phrases[0].length;
      var deleting = false;

      var step = function () {
        var phrase = phrases[phraseIndex];
        charIndex += deleting ? -1 : 1;
        typed.textContent = phrase.slice(0, charIndex);

        var delay = deleting ? 35 : 65;

        if (!deleting && charIndex === phrase.length) {
          deleting = true;
          delay = 2600;
        } else if (deleting && charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          delay = 420;
        }

        window.setTimeout(step, delay);
      };

      window.setTimeout(step, 2600);
    }
  }
})();
