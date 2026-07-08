# DEEE TODO — Premium Shopify Theme

> Dark, neon, motion-rich **Shopify Online Store 2.0** theme inspired by the visual identity of [deeetodo.com](https://deeetodo.com). Built for an immersive, Awwwards-grade shopping experience that feels like a natural extension of the main site.

<p align="center">
  <img alt="Online Store 2.0" src="https://img.shields.io/badge/Online%20Store-2.0-fb2c36">
  <img alt="Liquid" src="https://img.shields.io/badge/Liquid-Sections%20Everywhere-00f0ff">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-b300ff">
</p>

---

## ✨ Highlights

- **Online Store 2.0** — JSON templates, Sections Everywhere, app-block ready, theme blocks.
- **Immersive motion** — GSAP + ScrollTrigger, Lenis smooth scroll, SplitType text reveals, Swiper carousels, Lottie, and a lightweight Three.js hero scene with mouse-follow parallax.
- **AJAX everything** — cart drawer, predictive search, variant switching, and facet filtering with no full page reloads.
- **Premium UI kit** — glassmorphism, neon glow, magnetic buttons, scroll reveal, animated marquees, and depth-driven sections.
- **Performance first** — deferred scripts, `prefers-reduced-motion` support, responsive `srcset` images (WebP/AVIF via Shopify CDN), preconnect/preload, and lazy loading. Targets Lighthouse 95+.
- **SEO & a11y** — JSON-LD (Organization, Product, Breadcrumbs), Open Graph, Twitter Cards, semantic landmarks, ARIA, focus states, and WCAG AA contrast.
- **Fully editable** — colors, fonts, animation intensity, layout, and every section are configurable from the Theme Editor.
- **Enterprise-ready** — i18n locales, multi-currency friendly, metafield/metaobject hooks, and a modular architecture prepared for Shopify Plus.

## 🎨 Design tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--color-bg` | `#0b0c10` | Primary background |
| `--color-surface` | `#161b22` | Cards / surfaces |
| `--color-brand` | `#fb2c36` | Primary accent |
| `--color-neon-cyan` | `#00f0ff` | Secondary accent / glow |
| `--color-neon-pink` | `#ff007a` | Highlight |
| `--color-neon-purple` | `#b300ff` | Highlight |
| `--color-neon-gold` | `#edb200` | Highlight |
| Font | `Geist` / `Geist Mono` | Type system |

All tokens are exposed as CSS custom properties and driven by Theme Editor settings.

## 📁 Project structure

```
.
├── assets/            # Compiled CSS + vanilla JS modules (no build required)
├── blocks/            # Reusable OS 2.0 theme blocks
├── config/            # settings_schema.json + settings_data.json
├── layout/            # theme.liquid, password.liquid
├── locales/           # en.default + es storefront & schema translations
├── sections/          # All page & template sections
├── snippets/          # Reusable partials (SEO, media, cart, search, cards…)
├── templates/         # JSON templates (index, product, collection, cart…)
├── src/               # Optional TS/CSS sources for the Vite/Tailwind build
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## 🚀 Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) 3.x
- A Shopify store (Partner dev store or live)

### 1. Clone

```bash
git clone https://github.com/keyderlopezpadilla-star/tema-de-tienda-para-shopify-deeee.git
cd tema-de-tienda-para-shopify-deeee
```

### 2. Run locally

The theme ships with prebuilt assets, so you can start immediately:

```bash
shopify theme dev --store your-store.myshopify.com
```

This launches a hot-reloading local preview against your store's data.

### 3. (Optional) Rebuild assets

Only needed if you edit files under `src/`:

```bash
npm install
npm run build      # one-off build into /assets
npm run watch      # rebuild CSS + run theme dev together
```

## 📤 Deployment

Push an unpublished development theme:

```bash
shopify theme push --unpublished --theme "DEEE TODO"
```

Publish when ready:

```bash
shopify theme push --live
```

Run quality checks before shipping:

```bash
shopify theme check
```

## 🧩 Theme Editor configuration

Everything is editable without touching code:

- **Colors & gradients** — global palette, neon accents, glow intensity.
- **Typography** — Geist by default, swap to any Shopify font.
- **Motion** — global animation intensity, smooth-scroll toggle, 3D hero toggle (auto-disabled for `prefers-reduced-motion`).
- **Sections** — add / reorder / remove sections on any template (Sections Everywhere).
- **Commerce** — cart drawer vs. page, free-shipping bar threshold, predictive search, product gallery style.

## 🌍 Internationalization & multi-currency

- Storefront strings live in `locales/*.json`; add a locale by copying `en.default.json`.
- Prices use Shopify's `money` filters and respect the active currency, making the theme multi-currency and Markets ready.

## ♿ Accessibility

- WCAG AA contrast on the default palette.
- Full keyboard navigation, visible focus rings, skip-to-content link.
- `aria-live` regions for cart and search updates.
- Motion respects `prefers-reduced-motion`.

## 🛠️ Tech stack

Liquid · HTML5 · Modern CSS · TailwindCSS · JavaScript (ES2025) · TypeScript · GSAP · Three.js · Lenis · SplitType · Swiper · Motion One · Lottie.

## 📄 License

Released under the [MIT License](./LICENSE).

---

Made with 🖨️ + ⚡ for **DEEE TODO** — *tu fábrica de ideas*.
