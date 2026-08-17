/* Zichao Yu — site interactions. No dependencies. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ------------------------------------------------------- current year - */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------- mobile menu -- */

  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ----------------------------------------------------- reading progress */

  var nav = document.getElementById("nav");

  function updateProgress() {
    if (!nav) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? window.scrollY / max : 0;
    nav.style.setProperty("--progress", String(Math.min(1, Math.max(0, ratio))));
  }

  /* ------------------------------------------------------------ scrollspy */

  var sections = Array.prototype.slice.call(
    document.querySelectorAll("[data-nav]")
  );
  var links = {};

  sections.forEach(function (section) {
    var link = document.querySelector(
      '.nav__menu a[href="#' + section.id + '"]'
    );
    if (link) links[section.id] = link;
  });

  function updateActiveLink() {
    // The section whose top has most recently passed the header wins.
    var probe = window.scrollY + window.innerHeight * 0.3;
    var current = null;

    sections.forEach(function (section) {
      if (section.offsetTop <= probe) current = section.id;
    });

    Object.keys(links).forEach(function (id) {
      links[id].classList.toggle("is-active", id === current);
    });
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        updateProgress();
        updateActiveLink();
        ticking = false;
      });
    },
    { passive: true }
  );

  updateProgress();
  updateActiveLink();

  /* -------------------------------------------------------- reveal on scroll */

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
      // Stagger items within the same row so they cascade rather than pop.
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------- typing effect - */

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
