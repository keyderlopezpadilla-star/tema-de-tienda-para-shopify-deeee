/* ==========================================================================
   DEEE TODO — Core theme behaviour
   Vanilla ES2025. Loaded with `defer`. No build step required.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  /* --------------------------------------------------------------------- */
  /* Tiny utilities                                                        */
  /* --------------------------------------------------------------------- */
  const on = (el, evt, fn, opts) => el && el.addEventListener(evt, fn, opts);
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const debounce = (fn, wait = 200) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  };

  // Global namespace so sections/snippets can hook in.
  window.DEEE = window.DEEE || {};
  window.DEEE.utils = { on, qs, qsa, debounce, reduceMotion };

  // Simple pub/sub for cart + UI events.
  const bus = (() => {
    const map = new Map();
    return {
      on: (name, fn) => {
        if (!map.has(name)) map.set(name, new Set());
        map.get(name).add(fn);
        return () => map.get(name).delete(fn);
      },
      emit: (name, detail) => {
        (map.get(name) || []).forEach((fn) => fn(detail));
      }
    };
  })();
  window.DEEE.bus = bus;

  /* --------------------------------------------------------------------- */
  /* Overlay controller (shared by drawers + modals)                       */
  /* --------------------------------------------------------------------- */
  const overlay = qs('[data-overlay]');
  let openLayers = 0;

  function lockScroll(lock) {
    document.documentElement.classList.toggle('lenis-stopped', lock);
    document.body.style.overflow = lock ? 'hidden' : '';
    if (window.DEEE.lenis) {
      lock ? window.DEEE.lenis.stop() : window.DEEE.lenis.start();
    }
  }

  window.DEEE.ui = {
    open(el) {
      if (!el) return;
      el.classList.add('is-open');
      el.setAttribute('aria-hidden', 'false');
      overlay && overlay.classList.add('is-open');
      openLayers += 1;
      lockScroll(true);
      const focusable = qs('[autofocus], button, a, input', el);
      focusable && setTimeout(() => focusable.focus(), 60);
    },
    close(el) {
      if (!el) return;
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      openLayers = Math.max(0, openLayers - 1);
      if (openLayers === 0) {
        overlay && overlay.classList.remove('is-open');
        lockScroll(false);
      }
    },
    closeAll() {
      qsa('.is-open[data-closable]').forEach((el) => this.close(el));
    }
  };

  on(overlay, 'click', () => window.DEEE.ui.closeAll());
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') window.DEEE.ui.closeAll();
  });

  // Generic open/close triggers via data attributes.
  qsa('[data-open]').forEach((btn) => {
    on(btn, 'click', () => {
      const target = qs('#' + btn.getAttribute('data-open'));
      window.DEEE.ui.open(target);
      btn.setAttribute('aria-expanded', 'true');
    });
  });
  qsa('[data-close]').forEach((btn) => {
    on(btn, 'click', () => {
      const target = btn.closest('[data-closable]') || qs('#' + btn.getAttribute('data-close'));
      window.DEEE.ui.close(target);
    });
  });

  /* --------------------------------------------------------------------- */
  /* Header — scroll state + hide on scroll down                           */
  /* --------------------------------------------------------------------- */
  const header = qs('[data-header]');
  if (header) {
    let lastY = window.scrollY;
    const hideOnScroll = header.dataset.hideOnScroll === 'true';
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      if (hideOnScroll) {
        if (y > lastY && y > 320) header.classList.add('is-hidden');
        else header.classList.remove('is-hidden');
      }
      lastY = y;
    };
    on(window, 'scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu toggle
  const menuToggle = qs('[data-menu-toggle]');
  const menuDrawer = qs('[data-menu-drawer]');
  if (menuToggle && menuDrawer) {
    on(menuToggle, 'click', () => {
      const isOpen = menuDrawer.classList.contains('is-open');
      if (isOpen) {
        window.DEEE.ui.close(menuDrawer);
        menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        window.DEEE.ui.open(menuDrawer);
        menuToggle.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* --------------------------------------------------------------------- */
  /* Search modal                                                          */
  /* --------------------------------------------------------------------- */
  const searchModal = qs('[data-search-modal]');
  qsa('[data-search-open]').forEach((b) =>
    on(b, 'click', () => window.DEEE.ui.open(searchModal))
  );

  /* --------------------------------------------------------------------- */
  /* Accordions                                                            */
  /* --------------------------------------------------------------------- */
  qsa('[data-accordion-trigger]').forEach((trigger) => {
    on(trigger, 'click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      const group = trigger.closest('[data-accordion-single]');
      if (group && !expanded) {
        qsa('[data-accordion-trigger]', group).forEach((t) =>
          t.setAttribute('aria-expanded', 'false')
        );
      }
      trigger.setAttribute('aria-expanded', String(!expanded));
    });
  });

  /* --------------------------------------------------------------------- */
  /* Tabs                                                                  */
  /* --------------------------------------------------------------------- */
  qsa('[data-tabs]').forEach((tabs) => {
    const buttons = qsa('[role="tab"]', tabs);
    const panels = qsa('[role="tabpanel"]', tabs);
    buttons.forEach((btn, i) => {
      on(btn, 'click', () => {
        buttons.forEach((b) => b.setAttribute('aria-selected', 'false'));
        panels.forEach((p) => p.hidden = true);
        btn.setAttribute('aria-selected', 'true');
        if (panels[i]) panels[i].hidden = false;
      });
    });
  });

  /* --------------------------------------------------------------------- */
  /* Magnetic buttons (pointer-based, skipped for reduced motion / touch)  */
  /* --------------------------------------------------------------------- */
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && !reduceMotion) {
    qsa('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      const label = qs('.btn__label', el) || el;
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
        label.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
      };
      const reset = () => {
        el.style.transform = '';
        label.style.transform = '';
      };
      on(el, 'pointermove', move);
      on(el, 'pointerleave', reset);
    });
  }

  /* --------------------------------------------------------------------- */
  /* Lazy image fade-in                                                    */
  /* --------------------------------------------------------------------- */
  qsa('img[loading="lazy"]').forEach((img) => {
    if (img.complete) img.classList.add('is-loaded');
    else on(img, 'load', () => img.classList.add('is-loaded'));
  });

  /* --------------------------------------------------------------------- */
  /* Newsletter / contact form UX (progressive enhancement)                */
  /* --------------------------------------------------------------------- */
  qsa('form.newsletter-form').forEach((form) => {
    on(form, 'submit', () => {
      const btn = qs('[type="submit"]', form);
      if (btn) {
        btn.setAttribute('aria-disabled', 'true');
        btn.dataset.originalLabel = btn.innerHTML;
        const label = qs('.btn__label', btn) || btn;
        label.innerHTML = '<span class="spinner"></span>';
      }
    });
  });

  /* --------------------------------------------------------------------- */
  /* Smooth page transitions (soft reloads).                               */
  /* Full page navigations (reliable images) but with a gentle fade-out    */
  /* overlay on click; the new page fades in via CSS. Safe: if JS fails,   */
  /* links navigate normally.                                              */
  /* --------------------------------------------------------------------- */
  if (!reduceMotion) {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    on(document, 'click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        a.target === '_blank' ||
        a.hasAttribute('download') ||
        a.dataset.noTransition !== undefined
      ) {
        return;
      }
      const href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;

      let url;
      try {
        url = new URL(a.href, window.location.href);
      } catch (err) {
        return;
      }
      // Only same-origin internal navigations (external logo → deeetodo.com is left alone).
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      e.preventDefault();
      overlay.classList.add('is-active');
      setTimeout(() => {
        window.location.href = a.href;
      }, 260);
    });

    // Reset overlay when returning via the back/forward cache.
    on(window, 'pageshow', () => overlay.classList.remove('is-active'));
  }

  /* --------------------------------------------------------------------- */
  /* Scroll reveal (base). Always available so content is never stuck       */
  /* hidden even when the GSAP motion layer is disabled.                    */
  /* --------------------------------------------------------------------- */
  (function reveal() {
    const els = qsa('[data-reveal]');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    );
    els.forEach((el, i) => {
      if (el.dataset.revealStagger !== undefined && !el.style.getPropertyValue('--reveal-delay')) {
        el.style.setProperty('--reveal-delay', `${(i % 6) * 0.08}s`);
      }
      io.observe(el);
    });
  })();

  /* --------------------------------------------------------------------- */
  /* Dynamic scroll-driven accent: shift --scroll-progress on <html>       */
  /* --------------------------------------------------------------------- */
  const setProgress = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    h.style.setProperty('--scroll-progress', p.toFixed(4));
  };
  on(window, 'scroll', setProgress, { passive: true });
  setProgress();
})();
