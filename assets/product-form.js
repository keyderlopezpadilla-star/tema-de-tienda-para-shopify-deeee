/* ==========================================================================
   DEEE TODO — Product page interactivity
   Variant switching, media gallery, zoom, sticky ATC. Loaded with `defer`.
   ========================================================================== */
(function () {
  'use strict';

  const { qs, qsa, on } = window.DEEE.utils;
  const strings = window.DEEE.strings || {};

  qsa('[data-product]').forEach(initProduct);

  function initProduct(root) {
    const dataEl = qs('[data-product-json]', root);
    if (!dataEl) return;
    let product;
    try {
      product = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }

    const form = qs('form[action*="/cart/add"]', root) || qs('#ProductForm', root);
    const idInput = form ? qs('[name="id"]', form) : null;
    const priceEl = qs('[data-product-price]', root);
    const priceCompareEl = qs('[data-product-compare]', root);
    const submit = form ? qs('[data-add-to-cart]', form) : null;
    const submitLabel = submit ? qs('.btn__label', submit) : null;
    const optionInputs = qsa('[data-option-selector]', root);
    const money = (c) =>
      window.DEEE.cart ? window.DEEE.cart.formatMoney(c) : `$${(c / 100).toFixed(2)}`;

    function currentOptions() {
      const selected = [];
      const groups = {};
      optionInputs.forEach((el) => {
        if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
        groups[el.dataset.optionPosition] = el.value;
      });
      Object.keys(groups)
        .sort()
        .forEach((k) => selected.push(groups[k]));
      return selected;
    }

    function findVariant(options) {
      return product.variants.find((v) =>
        v.options.every((opt, i) => opt === options[i])
      );
    }

    function updateVariant() {
      const options = currentOptions();
      const variant = findVariant(options);

      if (!variant) {
        if (submit) {
          submit.setAttribute('aria-disabled', 'true');
          if (submitLabel) submitLabel.textContent = strings.unavailable || 'No disponible';
        }
        return;
      }

      if (idInput) idInput.value = variant.id;

      // URL sync without reload.
      const url = new URL(window.location);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);

      // Price
      if (priceEl) priceEl.innerHTML = money(variant.price);
      if (priceCompareEl) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          priceCompareEl.innerHTML = money(variant.compare_at_price);
          priceCompareEl.hidden = false;
          priceEl && priceEl.parentElement.classList.add('price--on-sale');
        } else {
          priceCompareEl.hidden = true;
          priceEl && priceEl.parentElement.classList.remove('price--on-sale');
        }
      }

      // Availability
      if (submit) {
        if (variant.available) {
          submit.removeAttribute('aria-disabled');
          if (submitLabel) submitLabel.textContent = strings.addToCart || 'Añadir al carrito';
        } else {
          submit.setAttribute('aria-disabled', 'true');
          if (submitLabel) submitLabel.textContent = strings.soldOut || 'Agotado';
        }
      }

      // Featured media swap
      if (variant.featured_media) selectMedia(String(variant.featured_media.id));
      root.dispatchEvent(new CustomEvent('variant:change', { detail: variant }));
    }

    optionInputs.forEach((el) => on(el, 'change', updateVariant));

    /* ----- Media gallery ----- */
    const mainMedia = qs('[data-gallery-main]', root);
    const thumbs = qsa('[data-gallery-thumb]', root);

    function selectMedia(mediaId) {
      thumbs.forEach((t) => {
        const active = t.dataset.mediaId === mediaId;
        t.classList.toggle('is-active', active);
        if (active && mainMedia) {
          const img = qs('img', t);
          const target = qs('img', mainMedia);
          if (img && target) {
            target.src = img.dataset.full || img.src;
            target.srcset = '';
            target.alt = img.alt;
          }
        }
      });
    }

    thumbs.forEach((t) =>
      on(t, 'click', () => selectMedia(t.dataset.mediaId))
    );

    /* ----- Simple zoom on hover (desktop) ----- */
    if (mainMedia && window.matchMedia('(hover:hover)').matches) {
      const img = qs('img', mainMedia);
      on(mainMedia, 'pointermove', (e) => {
        const r = mainMedia.getBoundingClientRect();
        img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        img.style.transform = 'scale(1.9)';
      });
      on(mainMedia, 'pointerleave', () => {
        img.style.transform = '';
      });
    }

    /* ----- Quantity stepper in form ----- */
    const qtyWrap = qs('[data-form-qty]', root);
    if (qtyWrap) {
      const input = qs('input', qtyWrap);
      on(qtyWrap, 'click', (e) => {
        if (e.target.closest('[data-qty-up]')) input.value = (parseInt(input.value, 10) || 1) + 1;
        if (e.target.closest('[data-qty-down]'))
          input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
      });
    }

    /* ----- Sticky add-to-cart bar ----- */
    const sticky = qs('[data-sticky-atc]', root);
    if (sticky && submit) {
      const io = new IntersectionObserver(
        ([entry]) => sticky.classList.toggle('is-visible', !entry.isIntersecting),
        { rootMargin: '-120px 0px 0px 0px' }
      );
      io.observe(submit);
      const stickyBtn = qs('[data-sticky-add]', sticky);
      if (stickyBtn) on(stickyBtn, 'click', () => submit.click());
    }

    // Initialize from ?variant=
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('variant');
    if (initial) {
      const v = product.variants.find((x) => String(x.id) === initial);
      if (v) {
        v.options.forEach((opt, i) => {
          const el = optionInputs.find(
            (e) => e.dataset.optionPosition == i + 1 && e.value === opt
          );
          if (el) el.checked = true;
        });
      }
    }
    updateVariant();
  }

  /* Recently viewed products (localStorage) */
  try {
    const handleEl = qs('[data-recently-viewed-current]');
    if (handleEl) {
      const handle = handleEl.dataset.recentlyViewedCurrent;
      const key = 'deee:recently-viewed';
      const list = JSON.parse(localStorage.getItem(key) || '[]').filter((h) => h !== handle);
      list.unshift(handle);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 12)));
    }
  } catch (e) {
    /* storage unavailable */
  }
})();
