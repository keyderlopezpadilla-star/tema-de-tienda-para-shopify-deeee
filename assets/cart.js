/* ==========================================================================
   DEEE TODO — AJAX cart + drawer
   Uses the Shopify AJAX Cart API (/cart/*.js). Loaded with `defer`.
   ========================================================================== */
(function () {
  'use strict';

  const { qs, qsa, on } = window.DEEE.utils;
  const bus = window.DEEE.bus;
  const routes = window.DEEE.routes || {};
  const strings = window.DEEE.strings || {};
  const moneyFormat = window.DEEE.moneyFormat || '${{amount}}';

  const drawer = qs('[data-cart-drawer]');
  const drawerBody = qs('[data-cart-drawer-body]');
  const drawerFooter = qs('[data-cart-drawer-footer]');
  const cartCounts = qsa('[data-cart-count]');
  const freeShipThreshold = drawer ? parseInt(drawer.dataset.freeShipThreshold || '0', 10) : 0;

  function formatMoney(cents) {
    const amount = (cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return moneyFormat.replace(/\{\{\s*amount\s*\}\}/, amount);
  }

  async function getCart() {
    const res = await fetch(`${routes.cart_url || '/cart'}.js`, {
      headers: { Accept: 'application/json' }
    });
    return res.json();
  }

  function updateCounts(count) {
    cartCounts.forEach((el) => {
      el.textContent = count;
      el.classList.toggle('is-active', count > 0);
    });
  }

  function renderFreeShipping(total) {
    if (!freeShipThreshold) return '';
    const remaining = Math.max(0, freeShipThreshold - total);
    const pct = Math.min(100, (total / freeShipThreshold) * 100);
    const msg =
      remaining === 0
        ? strings.freeShipUnlocked || '¡Envío gratis desbloqueado! 🎉'
        : (strings.freeShipRemaining || 'Te faltan %amount% para el envío gratis').replace(
            '%amount%',
            formatMoney(remaining)
          );
    return `
      <div class="free-shipping">
        <p class="text-muted" style="font-size:.85rem">${msg}</p>
        <div class="free-shipping__bar"><div class="free-shipping__fill" style="width:${pct}%"></div></div>
      </div>`;
  }

  function renderItem(item) {
    const img = item.image
      ? `<img src="${item.image.replace(/(\.[^.]+)(\?.*)?$/, '_160x$1')}" alt="${item.product_title}" width="72" height="72" loading="lazy">`
      : '';
    const variant =
      item.variant_title && item.variant_title !== 'Default Title'
        ? `<p class="cart-item__variant">${item.variant_title}</p>`
        : '';
    const linePrice = formatMoney(item.final_line_price);
    return `
      <div class="cart-item" data-cart-item data-key="${item.key}">
        <a class="cart-item__media media" href="${item.url}">${img}</a>
        <div>
          <a class="cart-item__title" href="${item.url}">${item.product_title}</a>
          ${variant}
          <div class="cluster" style="--gap:.75rem;margin-top:.6rem">
            <div class="qty" data-qty>
              <button type="button" data-qty-down aria-label="${strings.decrease || 'Restar'}">−</button>
              <input type="text" inputmode="numeric" value="${item.quantity}" data-qty-input data-key="${item.key}" aria-label="${strings.quantity || 'Cantidad'}">
              <button type="button" data-qty-up aria-label="${strings.increase || 'Sumar'}">+</button>
            </div>
          </div>
        </div>
        <div style="text-align:right">
          <span class="price">${linePrice}</span>
          <div><button class="cart-remove" type="button" data-cart-remove data-key="${item.key}">${strings.remove || 'Quitar'}</button></div>
        </div>
      </div>`;
  }

  function renderDrawer(cart) {
    if (!drawerBody) return;
    updateCounts(cart.item_count);

    if (cart.item_count === 0) {
      drawerBody.innerHTML = `
        <div class="cart-empty">
          <p class="h3">${strings.cartEmpty || 'Tu carrito está vacío'}</p>
          <p class="text-muted" style="margin:.75rem 0 1.5rem">${strings.cartEmptyBody || 'Aún no has añadido nada. ¡Vamos a por ello!'}</p>
          <a class="btn btn--primary" href="${routes.all_products || '/collections/all'}" data-close><span class="btn__label">${strings.startShopping || 'Explorar productos'}</span></a>
        </div>`;
      if (drawerFooter) drawerFooter.hidden = true;
      return;
    }

    drawerBody.innerHTML = cart.items.map(renderItem).join('');
    if (drawerFooter) {
      drawerFooter.hidden = false;
      drawerFooter.innerHTML = `
        ${renderFreeShipping(cart.total_price)}
        <div class="cluster" style="justify-content:space-between;margin-bottom:1rem">
          <span class="text-muted">${strings.subtotal || 'Subtotal'}</span>
          <span class="price price--large">${formatMoney(cart.total_price)}</span>
        </div>
        <a class="btn btn--primary btn--full btn--lg" href="${routes.cart_url || '/cart'}"><span class="btn__label">${strings.checkout || 'Finalizar compra'}</span></a>
        <p class="form__note text-center" style="margin-top:.75rem">${strings.taxesNote || 'Impuestos y envío calculados en el checkout.'}</p>`;
    }
  }

  async function refresh(open = false) {
    const cart = await getCart();
    renderDrawer(cart);
    bus.emit('cart:updated', cart);
    if (open) window.DEEE.ui.open(drawer);
  }

  async function change(key, quantity) {
    const res = await fetch(`${routes.cart_change_url || '/cart/change'}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity })
    });
    const cart = await res.json();
    renderDrawer(cart);
    bus.emit('cart:updated', cart);
  }

  async function addToCart(formData, form) {
    const btn = form ? qs('[type="submit"]', form) : null;
    const label = btn ? qs('.btn__label', btn) : null;
    const original = label ? label.innerHTML : '';
    if (btn) {
      btn.setAttribute('aria-disabled', 'true');
      if (label) label.innerHTML = '<span class="spinner"></span>';
    }
    try {
      const res = await fetch(`${routes.cart_add_url || '/cart/add'}.js`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });
      const data = await res.json();
      if (data.status) {
        toast(data.description || data.message, 'error');
      } else {
        await refresh(true);
        toast(strings.added || 'Añadido al carrito ✨', 'success');
      }
    } catch (err) {
      toast(strings.genericError || 'Algo salió mal. Inténtalo de nuevo.', 'error');
    } finally {
      if (btn) btn.removeAttribute('aria-disabled');
      if (label) label.innerHTML = original;
    }
  }

  /* Toast notifications */
  let toastEl;
  function toast(message, type = 'success') {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast glass';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.dataset.type = type;
    toastEl.textContent = message;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
  }
  window.DEEE.toast = toast;

  /* --------------------------------------------------------------------- */
  /* Event wiring                                                          */
  /* --------------------------------------------------------------------- */
  // Intercept all product forms for AJAX add-to-cart.
  on(document, 'submit', (e) => {
    const form = e.target.closest('form[action*="/cart/add"]');
    if (!form || form.dataset.noAjax === 'true') return;
    e.preventDefault();
    addToCart(new FormData(form), form);
  });

  // Delegated drawer interactions.
  if (drawer) {
    on(drawer, 'click', (e) => {
      const remove = e.target.closest('[data-cart-remove]');
      const up = e.target.closest('[data-qty-up]');
      const down = e.target.closest('[data-qty-down]');
      if (remove) {
        change(remove.dataset.key, 0);
      } else if (up || down) {
        const wrap = e.target.closest('[data-qty]');
        const input = qs('[data-qty-input]', wrap);
        let val = parseInt(input.value, 10) || 1;
        val = up ? val + 1 : Math.max(0, val - 1);
        change(input.dataset.key, val);
      }
    });
    on(drawer, 'change', (e) => {
      const input = e.target.closest('[data-qty-input]');
      if (input) change(input.dataset.key, Math.max(0, parseInt(input.value, 10) || 0));
    });
  }

  // Open drawer buttons.
  qsa('[data-cart-open]').forEach((b) =>
    on(b, 'click', (e) => {
      e.preventDefault();
      refresh(true);
    })
  );

  // Initial hydrate.
  refresh(false);
  window.DEEE.cart = { refresh, change, addToCart, getCart, formatMoney };
})();
