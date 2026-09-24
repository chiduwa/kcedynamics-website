/* Visual effects layer: liquid glass, 3D tilt and scroll reveal.
   Progressive enhancement only. Every element is fully visible and usable
   without this file; the reveal hides nothing until the script has run.
   Motion is skipped for prefers-reduced-motion, and tilt only runs on
   devices with a precise pointer (no tilt on phones). No libraries. */
(function () {
  'use strict';

  // Per-site selectors. Each site keeps its own copy of this file.
  var CONFIG = {
    glass: ['.hero .btn--outline', '.about-teaser__box', '.hero__badge'],
    tilt: ['.service-card', '.project-card', '.area-card'],
    // Service, project and process cards already fade in through main.js.
    reveal: ['.area-card', '.faq-item', '.section__title', '.section__subtitle'],
    header: '.site-header',
    tiltMax: 7        // maximum tilt in degrees
  };

  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  function all(list) {
    return list && list.length ? Array.prototype.slice.call(document.querySelectorAll(list.join(','))) : [];
  }

  // Pointer position as CSS custom properties, throttled to one write per frame.
  function track(el, onMove, onLeave) {
    var raf = 0;
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width;
      var y = (ev.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        el.style.setProperty('--fx-mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--fx-my', (y * 100).toFixed(1) + '%');
        if (onMove) onMove(x, y);
      });
    });
    el.addEventListener('pointerleave', function () {
      cancelAnimationFrame(raf);
      if (onLeave) onLeave();
    });
  }

  // Liquid glass surfaces.
  all(CONFIG.glass).forEach(function (el) {
    el.classList.add('fx-glass');
    if (fine && !reduce) track(el);
  });

  // Header turns to glass once content scrolls beneath it.
  if (CONFIG.header) {
    var header = document.querySelector(CONFIG.header);
    if (header) {
      var onScroll = function () { header.classList.toggle('fx-header-glass', window.scrollY > 24); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  // 3D tilt with a moving glare.
  if (fine && !reduce) {
    all(CONFIG.tilt).forEach(function (el) {
      el.classList.add('fx-tilt');
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var glare = document.createElement('span');
      glare.className = 'fx-glare';
      glare.setAttribute('aria-hidden', 'true');
      el.appendChild(glare);
      track(el, function (x, y) {
        el.style.setProperty('--fx-rx', ((0.5 - y) * CONFIG.tiltMax).toFixed(2) + 'deg');
        el.style.setProperty('--fx-ry', ((x - 0.5) * CONFIG.tiltMax).toFixed(2) + 'deg');
      }, function () {
        el.style.removeProperty('--fx-rx');
        el.style.removeProperty('--fx-ry');
      });
    });
  }

  // Scroll reveal. The fx-js class is what allows the hidden start state,
  // so without this script (or for crawlers that skip it) nothing is hidden.
  if (!reduce && 'IntersectionObserver' in window) {
    // Anything already on screen is left alone: hiding it would flicker and
    // could delay the page's largest paint.
    var fold = window.innerHeight;
    var targets = all(CONFIG.reveal).filter(function (el) {
      return el.getBoundingClientRect().top > fold;
    });
    if (targets.length) {
      doc.classList.add('fx-js');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('fx-in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      targets.forEach(function (el) {
        var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
        el.classList.add('fx-reveal');
        el.style.setProperty('--fx-delay', (Math.min(sibs, 5) * 70) + 'ms');
        io.observe(el);
      });
    }
  }
})();
