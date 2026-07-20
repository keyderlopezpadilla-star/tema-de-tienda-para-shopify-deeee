/* ==========================================================================
   DEEE TODO — Collection facets (AJAX filtering / sorting) + load more
   Uses the Section Rendering API to update the grid without a full reload.
   Robust: delegated events, re-bound pager, and cards always end visible.
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
  let io;
  let loading = false;

  async function fetchAndRender(url, { append = false } = {}) {
    if (loading) return;
    loading = true;
    container.setAttribute('aria-busy', 'true');

    const fetchUrl = new URL(url, window.location.origin);
    fetchUrl.searchParams.set('section_id', sectionId);

    try {
      const res = await fetch(fetchUrl.toString());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const newContainer = doc.querySelector('[data-facets-container]');
      if (!newContainer) throw new Error('No section content');

      if (append) {
        const newGrid = newContainer.querySelector('[data-facets-grid]');
        const target = gridTarget();
        if (newGrid && target) {
          // Move the new cards in; CSS gives them a guaranteed entrance.
          Array.from(newGrid.children).forEach((card) => {
            card.classList.add('grid-card--in');
            target.appendChild(card);
          });
        }
        const newPager = newContainer.querySelector('[data-load-more]');
        const oldPager = qs('[data-load-more]', container);
        if (oldPager) oldPager.replaceWith(newPager || document.createComment('end'));
      } else {
        ['[data-facets-grid]', '[data-facets-filters]', '[data-facets-toolbar]', '[data-facets-count]'].forEach(
          (sel) => {
            const fresh = newContainer.querySelector(sel);
            const current = qs(sel, container);
            if (fresh && current) current.replaceWith(fresh);
          }
        );
        const grid = gridTarget();
        if (grid) Array.from(grid.children).forEach((c) => c.classList.add('grid-card--in'));
      }

      // Update the address bar (strip the section_id helper param).
      const clean = new URL(url, window.location.origin);
      clean.searchParams.delete('section_id');
      window.history.pushState({}, '', clean.pathname + clean.search);

      bindPager();
      if (window.DEEE.bus) window.DEEE.bus.emit('facets:updated');
    } catch (err) {
      // Fallback: never leave the user stuck — go to the real URL.
      window.location.href = url;
    } finally {
      loading = false;
      container.setAttribute('aria-busy', 'false');
    }
  }

  function currentUrl() {
    const params = new URLSearchParams(new FormData(form));
    const clean = new URLSearchParams();
    for (const [k, v] of params.entries()) if (v) clean.append(k, v);
    const query = clean.toString();
    return query ? `${window.location.pathname}?${query}` : window.location.pathname;
  }

  /* Filter + sort changes */
  if (form) {
    const submit = debounce(() => fetchAndRender(currentUrl()), 300);
    on(form, 'input', submit);
    on(form, 'change', submit);
    on(form, 'submit', (e) => {
      e.preventDefault();
      fetchAndRender(currentUrl());
    });
  }

  /* Delegated interactions: panel toggle, active-facet links, load more */
  on(container, 'click', (e) => {
    const toggle = e.target.closest('[data-facets-open]');
    if (toggle) {
      const panel = qs('[data-facets-filters]', container);
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      if (panel) panel.style.display = open ? 'none' : 'grid';
      return;
    }

    const loadMore = e.target.closest('[data-load-more-btn]');
    if (loadMore) {
      e.preventDefault();
      const pager = loadMore.closest('[data-load-more]');
      if (pager && pager.dataset.nextUrl) fetchAndRender(pager.dataset.nextUrl, { append: true });
      return;
    }

    const link = e.target.closest('[data-facet-link]');
    if (link) {
      e.preventDefault();
      fetchAndRender(link.getAttribute('href'));
    }
  });

  /* Collapse filter panel on mobile initially */
  (function collapseInitial() {
    const panel = qs('[data-facets-filters]', container);
    if (panel && window.matchMedia('(max-width: 749px)').matches) panel.style.display = 'none';
  })();

  /* Infinite scroll observer (button always works via delegation above) */
  function bindPager() {
    if (io) io.disconnect();
    if (!infinite || !('IntersectionObserver' in window)) return;
    const pager = qs('[data-load-more]', container);
    if (!pager || !pager.dataset.nextUrl) return;
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !loading) fetchAndRender(pager.dataset.nextUrl, { append: true });
        });
      },
      { rootMargin: '700px 0px' }
    );
    io.observe(pager);
  }

  bindPager();
  on(window, 'popstate', () => window.location.reload());
})();
