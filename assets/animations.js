/* ==========================================================================
   DEEE TODO — Motion layer
   Progressive enhancement over: Lenis (smooth scroll), GSAP + ScrollTrigger,
   SplitType (text reveals). All libraries are optional — the site is fully
   usable without them and everything respects prefers-reduced-motion.
   Loaded with `defer` after the vendor bundle.
   ========================================================================== */
(function () {
  'use strict';

  const { qs, qsa, reduceMotion } = window.DEEE.utils;
  const motionEnabled = document.documentElement.dataset.motion !== 'off' && !reduceMotion;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* --------------------------------------------------------------------- */
  /* 1. Smooth scroll (Lenis)                                              */
  /* --------------------------------------------------------------------- */
  let lenis = null;
  if (motionEnabled && window.Lenis && document.documentElement.dataset.smoothScroll !== 'off') {
    lenis = new window.Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    window.DEEE.lenis = lenis;

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Anchor links → smooth scroll via Lenis.
    qsa('a[href^="#"]:not([href="#"])').forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = qs(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -90 });
        }
      });
    });
  }

  /* --------------------------------------------------------------------- */
  /* 2. Base scroll reveal is handled in theme.js (always loaded).         */
  /*    Everything below is GSAP-only enhancement sugar.                   */
  /* --------------------------------------------------------------------- */
  if (!motionEnabled || !window.gsap) return;

  const gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  // Keep ScrollTrigger in sync with Lenis.
  if (lenis && window.ScrollTrigger) {
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* --------------------------------------------------------------------- */
  /* 3. Split-text headline reveals                                        */
  /* --------------------------------------------------------------------- */
  if (window.SplitType) {
    qsa('[data-split]').forEach((el) => {
      const split = new window.SplitType(el, { types: 'lines,words', lineClass: 'split-line' });
      gsap.set(el, { perspective: 800 });
      gsap.from(split.words, {
        yPercent: 120,
        opacity: 0,
        rotateX: -40,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.03,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
  }

  /* --------------------------------------------------------------------- */
  /* 4. Parallax layers                                                    */
  /* --------------------------------------------------------------------- */
  if (window.ScrollTrigger) {
    qsa('[data-parallax]').forEach((el) => {
      const depth = parseFloat(el.dataset.parallax) || 0.2;
      gsap.to(el, {
        yPercent: depth * 100,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('[data-parallax-scope]') || el, scrub: true }
      });
    });

    /* 5. Pinned / horizontal scroll galleries */
    qsa('[data-horizontal]').forEach((track) => {
      const panels = track.children;
      if (!panels.length) return;
      const distance = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: track.closest('[data-horizontal-scope]') || track,
          pin: true,
          scrub: 1,
          end: () => '+=' + distance(),
          invalidateOnRefresh: true
        }
      });
    });

    /* 6. Scroll-scrubbed scale/zoom sections */
    qsa('[data-scroll-zoom]').forEach((el) => {
      gsap.fromTo(
        el,
        { scale: 1.18, filter: 'brightness(0.6)' },
        {
          scale: 1,
          filter: 'brightness(1)',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top top', scrub: true }
        }
      );
    });

    /* 7. Counter animation for stats */
    qsa('[data-count-to]').forEach((el) => {
      const to = parseFloat(el.dataset.countTo) || 0;
      const suffix = el.dataset.countSuffix || '';
      const obj = { v: 0 };
      window.ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () =>
          gsap.to(obj, {
            v: to,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString() + suffix;
            }
          })
      });
    });

    /* 8. Section-driven ambient light shift on <body> */
    qsa('[data-accent-shift]').forEach((el) => {
      const accent = el.dataset.accentShift;
      window.ScrollTrigger.create({
        trigger: el,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) document.body.style.setProperty('--ambient-accent', accent);
        }
      });
    });

    /* 9. Immersive 3D scroll reveal for card rows / grids.
       Children of [data-scroll-3d] flip up from depth as the row enters.
       Idempotent so it also runs on AJAX-filtered grids. */
    function init3DScroll(scope) {
      (scope || document).querySelectorAll('[data-scroll-3d]:not([data-3d-ready])').forEach((row) => {
        row.setAttribute('data-3d-ready', '');
        const items = Array.from(row.children);
        if (!items.length) return;
        gsap.set(row, { perspective: 1300 });
        gsap.set(items, { transformStyle: 'preserve-3d' });
        gsap.fromTo(
          items,
          { rotateX: 28, y: 90, z: -180, opacity: 0, transformOrigin: '50% 100%' },
          {
            rotateX: 0,
            y: 0,
            z: 0,
            opacity: 1,
            duration: 1.1,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            scrollTrigger: { trigger: row, start: 'top 88%' }
          }
        );
      });
    }
    init3DScroll();

    /* 10. Pointer-driven 3D tilt (desktop only). Idempotent. */
    function initTilt(scope) {
      if (!canHover) return;
      (scope || document).querySelectorAll('[data-tilt]:not([data-tilt-ready])').forEach((el) => {
        el.setAttribute('data-tilt-ready', '');
        const strength = parseFloat(el.dataset.tilt) || 9;
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform =
            'perspective(900px) rotateY(' + px * strength + 'deg) rotateX(' + -py * strength + 'deg) translateY(-4px)';
        });
        el.addEventListener('pointerleave', () => {
          el.style.transform = '';
        });
      });
    }
    initTilt();

    /* Re-run 3D + tilt after AJAX facet/collection updates. */
    if (window.DEEE.bus) {
      window.DEEE.bus.on('facets:updated', () => {
        init3DScroll();
        initTilt();
        window.ScrollTrigger.refresh();
      });
    }
  }

  /* --------------------------------------------------------------------- */
  /* 11. Refresh triggers once fonts + images settle                       */
  /* --------------------------------------------------------------------- */
  if (window.ScrollTrigger) {
    window.addEventListener('load', () => window.ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => window.ScrollTrigger.refresh());
    }
  }
})();
