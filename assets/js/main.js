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

  /* -------------------------------------------------- arrival fade-in
     Runs before anything that could throw: if any later code fails, the
     overlay must still clear or the page would stay black. */

  var overlay = document.querySelector(".warp-overlay");

  if (overlay) {
    // Two frames so the initial opaque state is committed before we fade.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        overlay.classList.remove("is-active");
      });
    });

    window.addEventListener("pageshow", function (e) {
      if (e.persisted) overlay.classList.remove("is-active");
    });
  }

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

  /* ------------------------------------------------------- galaxy canvas - */
  /* A spiral galaxy of particles slowly rotating behind the hero. The bio
     sits at the galactic core. On navigation the whole field "warps": stars
     streak outward while the page fades to black. */

  var canvas = document.getElementById("cosmos");
  var startWarp = null; // set below when the canvas exists

  try {
    if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var W = 0;
    var H = 0;
    var cx = 0;
    var cy = 0;
    var maxR = 0;

    var TILT = 0.52; // vertical squash of the galactic plane
    var PLANE = -0.24; // rotation of the whole plane, radians
    var ARMS = 3;

    var stars = [];
    var particles = [];

    var rotation = 0;
    var warp = 0; // 0 → cruising, 1 → fully warped
    var warping = false;

    var mouseX = 0; // parallax offset targets, in px
    var mouseY = 0;
    var lookX = 0;
    var lookY = 0;

    var palette = [
      { color: "0,240,255", weight: 0.34 }, // cyan
      { color: "234,243,255", weight: 0.42 }, // white
      { color: "255,43,214", weight: 0.16 }, // magenta
      { color: "255,194,71", weight: 0.08 }, // amber
    ];

    var pickColor = function () {
      var roll = Math.random();
      for (var i = 0; i < palette.length; i++) {
        roll -= palette[i].weight;
        if (roll <= 0) return palette[i].color;
      }
      return palette[0].color;
    };

    var gauss = function () {
      // Cheap approximate normal in [-1, 1] for scattering arm particles.
      return (Math.random() + Math.random() + Math.random()) / 1.5 - 1;
    };

    var buildScene = function () {
      stars = [];
      particles = [];

      var starCount = Math.round(Math.min(260, (W * H) / 6500));
      for (var s = 0; s < starCount; s++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          size: 0.4 + Math.random() * 1.1,
          alpha: 0.25 + Math.random() * 0.55,
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.4 + Math.random() * 1.2,
        });
      }

      var count = Math.round(Math.min(850, (W * H) / 1900));
      for (var i = 0; i < count; i++) {
        var r = 26 + Math.pow(Math.random(), 0.72) * maxR;
        var arm = i % ARMS;
        var angle =
          arm * ((Math.PI * 2) / ARMS) + // which arm
          r * 0.0105 + // spiral twist
          gauss() * (0.28 + (r / maxR) * 0.22); // scatter widens outward

        particles.push({
          r: r,
          angle: angle,
          // Differential rotation: inner particles orbit faster.
          speed: 0.08 / (0.35 + r / maxR),
          size: 0.5 + Math.random() * 1.5,
          alpha: 0.35 + Math.random() * 0.55,
          color: pickColor(),
        });
      }
    };

    var resize = function () {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2;
      cy = H / 2;
      maxR = Math.min(W, H) * 0.52;
      buildScene();
    };

    var easeWarp = function (t) {
      return t * t * (3 - 2 * t); // smoothstep
    };

    var draw = function (now, dt) {
      var w = easeWarp(warp);

      ctx.clearRect(0, 0, W, H);

      var ox = cx + lookX;
      var oy = cy + lookY;

      /* background stars — points normally, radial streaks during warp */
      for (var s = 0; s < stars.length; s++) {
        var star = stars[s];
        var tw = 0.65 + 0.35 * Math.sin(now * 0.001 * star.twinkle + star.phase);
        var alpha = star.alpha * tw;

        if (w > 0.01) {
          var dx = star.x - ox;
          var dy = star.y - oy;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var len = w * w * (dist * 0.9 + 60);
          ctx.strokeStyle = "rgba(234,243,255," + alpha * (1 - w * 0.3) + ")";
          ctx.lineWidth = star.size * (0.7 + w * 0.6);
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x + (dx / dist) * len, star.y + (dy / dist) * len);
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(234,243,255," + alpha + ")";
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* galactic core glow */
      var glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, maxR * 0.55);
      glow.addColorStop(0, "rgba(0,240,255," + 0.16 * (1 - w) + ")");
      glow.addColorStop(0.35, "rgba(120,80,220," + 0.08 * (1 - w) + ")");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      /* spiral galaxy */
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(PLANE);

      var stretch = 1 + w * 3.2; // particles fly outward during warp
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var a = p.angle + rotation * p.speed;
        var pr = p.r * stretch;
        var px = Math.cos(a) * pr;
        var py = Math.sin(a) * pr * TILT;
        var pa = p.alpha * (1 - w * 0.85);
        if (pa <= 0.01) continue;

        ctx.fillStyle = "rgba(" + p.color + "," + pa + ")";
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    var last = 0;
    var frame = function (now) {
      var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;

      // Slow cruise normally; the warp spins everything up.
      rotation += dt * (1 + warp * 10);
      if (warping) warp = Math.min(1, warp + dt / 0.35);

      lookX += (mouseX - lookX) * 0.04;
      lookY += (mouseY - lookY) * 0.04;

      draw(now, dt);
      window.requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      // One static frame: the galaxy poses, nothing moves.
      draw(0, 0);
    } else {
      window.addEventListener(
        "pointermove",
        function (e) {
          mouseX = (e.clientX / W - 0.5) * 26;
          mouseY = (e.clientY / H - 0.5) * 18;
        },
        { passive: true }
      );

      window.requestAnimationFrame(function (now) {
        last = now;
        window.requestAnimationFrame(frame);
      });
    }

    startWarp = function () {
      warping = true;
    };

    // Reset if the page is restored from the back/forward cache.
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) {
        warping = false;
        warp = 0;
      }
    });
    }
  } catch (err) {
    // The galaxy is decoration; never let it take down navigation.
    startWarp = null;
  }

  /* ----------------------------------------------------- page transitions - */
  /* The overlay fades back in on internal navigation — and, on the home
     page, triggers the starfield warp — before moving on. */

  if (overlay) {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;

      var link = e.target.closest ? e.target.closest("a[href]") : null;
      if (!link) return;
      if (link.target && link.target !== "_self") return;
      if (link.origin !== window.location.origin) return;

      // Same-page anchors scroll, they don't navigate.
      var href = link.getAttribute("href") || "";
      if (href.charAt(0) === "#") return;
      if (
        link.pathname === window.location.pathname &&
        link.hash
      )
        return;

      e.preventDefault();
      overlay.classList.add("is-active");
      if (startWarp && !reduceMotion) startWarp();

      var delay = reduceMotion ? 0 : 350;
      window.setTimeout(function () {
        window.location.href = link.href;
      }, delay);
    });
  }
})();
