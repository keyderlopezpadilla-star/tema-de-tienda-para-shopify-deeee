/* ==========================================================================
   DEEE TODO — Collection / search facets
   Two modes:
   • Reload mode (default): filter/sort submit the form with a full page
     reload. The chosen options stay in the URL, and images (external URLs)
     always load correctly. Category links & pagination are plain links.
   • AJAX mode (opt-in, data-ajax="true"): Section Rendering API, no reload.
   ========================================================================== */
(function () {
  'use strict';

  const { qs, on, debounce } = window.DEEE.utils;

  const container = qs('[data-facets-container]');
  if (!container) return;

  const form = qs('[data-facets-form]', container);
  const ajax = container.dataset.ajax === 'true';

  /* Filter panel toggle — works in both modes */
  on(container, 'click', (e) => {
    const toggle = e.target.closest('[data-facets-open]');
    if (!toggle) return;
    const panel = qs('[data-facets-filters]', container);
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    if (panel) panel.style.display = open ? 'none' : 'grid';
  });

  /* Collapse the filter panel on mobile initially */
  (function collapseInitial() {
    const panel = qs('[data-facets-filters]', container);
    if (panel && window.matchMedia('(max-width: 749px)').matches) panel.style.display = 'none';
  })();

  /* ----------------------------------------------------------------------- */
  /* RELOAD MODE (default): submit the form -> full page reload, options in URL */
  /* ----------------------------------------------------------------------- */
  if (!ajax) {
    if (form) {
      const go = () => {
        container.setAttribute('aria-busy', 'true');
        if (form.requestSubmit) form.requestSubmit();
        else form.submit();
      };
      on(form, 'change', go);
    }
    // Facet-remove links, category chips & pagination are plain <a> links,
    // so they navigate (reload) on their own. Nothing else to do.
    return;
  }

  /* ----------------------------------------------------------------------- */
  /* AJAX MODE (opt-in)                                                      */
  /* ----------------------------------------------------------------------- */
  const sectionId = container.dataset.sectionId;
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
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const fresh = doc.querySelector('[data-facets-container]');
      if (!fresh) throw new Error('No section content');

      if (append) {
        const newGrid = fresh.querySelector('[data-facets-grid]');
        const target = gridTarget();
        if (newGrid && target) {
          Array.from(newGrid.children).forEach((card) => {
            card.classList.add('grid-card--in');
            target.appendChild(card);
          });
        }
        const newPager = fresh.querySelector('[data-load-more]');
        const oldPager = qs('[data-load-more]', container);
        if (oldPager) oldPager.replaceWith(newPager || document.createComment('end'));
      } else {
        ['[data-facets-grid]', '[data-facets-filters]', '[data-facets-toolbar]', '[data-facets-count]'].forEach(
          (sel) => {
            const f = fresh.querySelector(sel);
            const cur = qs(sel, container);
            if (f && cur) cur.replaceWith(f);
          }
        );
      }

      const clean = new URL(url, window.location.origin);
      clean.searchParams.delete('section_id');
      window.history.pushState({}, '', clean.pathname + clean.search);

      bindPager();
      if (window.DEEE.bus) window.DEEE.bus.emit('facets:updated');
    } catch (err) {
      window.location.href = url; // never get stuck
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

  if (form) {
    const submit = debounce(() => fetchAndRender(currentUrl()), 300);
    on(form, 'input', submit);
    on(form, 'change', submit);
    on(form, 'submit', (e) => {
      e.preventDefault();
      fetchAndRender(currentUrl());
    });
  }

  on(container, 'click', (e) => {
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

  function bindPager() {
    if (io) io.disconnect();
    if (!infinite || !('IntersectionObserver' in window)) return;
    const pager = qs('[data-load-more]', container);
    if (!pager || !pager.dataset.nextUrl) return;
    io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && !loading && fetchAndRender(pager.dataset.nextUrl, { append: true })),
      { rootMargin: '700px 0px' }
    );
    io.observe(pager);
  }

  bindPager();
  on(window, 'popstate', () => window.location.reload());
})();
