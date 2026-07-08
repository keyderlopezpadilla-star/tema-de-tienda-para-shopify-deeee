/* ==========================================================================
   DEEE TODO — Predictive search
   Queries the Shopify Predictive Search API and renders live suggestions.
   ========================================================================== */
(function () {
  'use strict';

  const { qs, on, debounce } = window.DEEE.utils;
  const routes = window.DEEE.routes || {};
  const strings = window.DEEE.strings || {};

  const input = qs('[data-predictive-input]');
  const results = qs('[data-predictive-results]');
  if (!input || !results) return;

  const base = routes.predictive_search_url || '/search/suggest';
  let controller;

  const money = (cents) =>
    window.DEEE.cart ? window.DEEE.cart.formatMoney(cents) : `$${(cents / 100).toFixed(2)}`;

  function skeleton() {
    results.innerHTML = `
      <div class="predictive card glass">
        <div class="predictive__group"><div class="predictive__heading">${strings.searching || 'Buscando…'}</div>
          <div class="predictive__item"><span class="spinner"></span></div>
        </div>
      </div>`;
  }

  function renderProducts(products) {
    if (!products.length) return '';
    const items = products
      .map((p) => {
        const img = p.featured_image && p.featured_image.url
          ? `<img src="${p.featured_image.url}&width=92" alt="${p.title}" width="46" height="46">`
          : '';
        return `<a class="predictive__item" href="${p.url}">
            ${img}
            <span style="flex:1">
              <span class="predictive__title">${p.title}</span>
            </span>
            <span class="price">${money(p.price)}</span>
          </a>`;
      })
      .join('');
    return `<div class="predictive__group">
        <div class="predictive__heading">${strings.products || 'Productos'}</div>${items}
      </div>`;
  }

  function renderList(heading, items) {
    if (!items || !items.length) return '';
    const links = items
      .map((i) => `<a class="predictive__item" href="${i.url}"><span class="predictive__title">${i.title}</span></a>`)
      .join('');
    return `<div class="predictive__group"><div class="predictive__heading">${heading}</div>${links}</div>`;
  }

  async function search(term) {
    if (controller) controller.abort();
    controller = new AbortController();
    const params = new URLSearchParams({
      q: term,
      'resources[type]': 'product,collection,page,article',
      'resources[limit]': '6',
      'resources[options][unavailable_products]': 'last',
      section_id: ''
    });
    try {
      const res = await fetch(`${base}.json?${params}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      const r = data.resources.results;
      const html =
        renderProducts(r.products || []) +
        renderList(strings.collections || 'Colecciones', r.collections) +
        renderList(strings.pages || 'Páginas', r.pages) +
        renderList(strings.articles || 'Artículos', r.articles);
      results.innerHTML = html
        ? `<div class="predictive card glass">${html}
             <a class="predictive__item link-underline" style="justify-content:center" href="${routes.search_url || '/search'}?q=${encodeURIComponent(term)}">${strings.viewAll || 'Ver todos los resultados'} →</a>
           </div>`
        : `<div class="predictive card glass"><div class="predictive__group"><div class="predictive__item text-muted">${strings.noResults || 'Sin resultados para'} “${term}”.</div></div></div>`;
    } catch (err) {
      if (err.name !== 'AbortError') results.innerHTML = '';
    }
  }

  const run = debounce((term) => {
    if (term.length < 2) {
      results.innerHTML = '';
      return;
    }
    skeleton();
    search(term);
  }, 220);

  on(input, 'input', (e) => run(e.target.value.trim()));

  // Keyboard navigation across suggestions.
  on(results, 'keydown', () => {});
  on(input, 'keydown', (e) => {
    const items = Array.from(results.querySelectorAll('.predictive__item[href]'));
    if (!items.length) return;
    const current = items.findIndex((i) => i.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      let next = e.key === 'ArrowDown' ? current + 1 : current - 1;
      next = (next + items.length) % items.length;
      items.forEach((i) => i.setAttribute('aria-selected', 'false'));
      items[next].setAttribute('aria-selected', 'true');
      items[next].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const sel = items[current];
      if (sel) {
        e.preventDefault();
        window.location.href = sel.href;
      }
    }
  });
})();
