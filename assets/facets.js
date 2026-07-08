/* ==========================================================================
   DEEE TODO — Collection facets (AJAX filtering / sorting) + infinite scroll
   Uses Section Rendering API to update the grid without a full reload.
   ========================================================================== */
(function () {
  'use strict';

  const { qs, qsa, on, debounce } = window.DEEE.utils;

  const container = qs('[data-facets-container]');
  if (!container) return;

  const sectionId = container.dataset.sectionId;
  const form = qs('[data-facets-form]', container);
  const gridTarget = () => qs('[data-facets-grid]', container);
  const infinite = container.dataset.infinite === 'true';

  async function fetchAndRender(url, { append = false } = {}) {
    container.setAttribute('aria-busy', 'true');
    const fetchUrl = new URL(url, window.location.origin);
    fetchUrl.searchParams.set('section_id', sectionId);
    try {
      const res = await fetch(fetchUrl.toString());
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const newContainer = doc.querySelector('[data-facets-container]');
      if (!newContainer) return;

      if (append) {
        const newItems = newContainer.querySelector('[data-facets-grid]');
        const target = gridTarget();
        if (newItems && target) {
          Array.from(newItems.children).forEach((c) => target.appendChild(c));
        }
        const newPager = newContainer.querySelector('[data-load-more]');
        const oldPager = qs('[data-load-more]', container);
        if (oldPager) oldPager.replaceWith(newPager || document.createComment('end'));
      } else {
        // Replace grid + facets + toolbar, keep scroll position sensible.
        ['[data-facets-grid]', '[data-facets-filters]', '[data-facets-toolbar]', '[data-facets-count]'].forEach(
          (sel) => {
            const fresh = newContainer.querySelector(sel);
            const current = qs(sel, container);
            if (fresh && current) current.replaceWith(fresh);
          }
        );
        bindPager();
      }
      window.history.pushState({}, '', url.replace(`section_id=${sectionId}`, '').replace(/[?&]$/, ''));
      window.DEEE.bus.emit('facets:updated');
    } finally {
      container.setAttribute('aria-busy', 'false');
    }
  }

  function currentUrl() {
    const params = new URLSearchParams(new FormData(form));
    // Clean empty values.
    const clean = new URLSearchParams();
    for (const [k, v] of params.entries()) if (v) clean.append(k, v);
    const base = window.location.pathname;
    const query = clean.toString();
    return query ? `${base}?${query}` : base;
  }

  // Filter + sort changes.
  if (form) {
    const submit = debounce(() => fetchAndRender(currentUrl()), 350);
    on(form, 'input', submit);
    on(form, 'change', submit);
    on(form, 'submit', (e) => {
      e.preventDefault();
      fetchAndRender(currentUrl());
    });
  }

  // Delegated: remove active facet, sort dropdown, clear all, panel toggle.
  on(container, 'click', (e) => {
    const toggle = e.target.closest('[data-facets-open]');
    if (toggle) {
      const panel = qs('[data-facets-filters]', container);
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      if (panel) panel.style.display = open ? 'none' : 'grid';
      return;
    }
    const link = e.target.closest('[data-facet-link]');
    if (link) {
      e.preventDefault();
      fetchAndRender(link.href);
    }
  });

  // Filter panel starts collapsed on load (revealed via toggle).
  (function collapseInitial() {
    const panel = qs('[data-facets-filters]', container);
    if (panel && window.matchMedia('(max-width: 749px)').matches) panel.style.display = 'none';
  })();

  // Load more / infinite scroll.
  let io;
  function bindPager() {
    const pager = qs('[data-load-more]', container);
    if (!pager) return;
    const btn = qs('[data-load-more-btn]', pager);
    const nextUrl = pager.dataset.nextUrl;
    if (!nextUrl) return;

    const load = () => fetchAndRender(nextUrl, { append: true });
    if (btn) on(btn, 'click', load);

    if (infinite && 'IntersectionObserver' in window) {
      if (io) io.disconnect();
      io = new IntersectionObserver(
        (entries) => entries.forEach((en) => en.isIntersecting && load()),
        { rootMargin: '600px 0px' }
      );
      io.observe(pager);
    }
  }

  bindPager();
  on(window, 'popstate', () => fetchAndRender(window.location.href));
})();
