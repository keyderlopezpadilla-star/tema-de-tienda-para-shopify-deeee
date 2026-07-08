/**
 * Optional TypeScript bundle entry.
 *
 * The production theme ships pre-built, framework-free modules in /assets
 * (theme.js, cart.js, predictive-search.js, product-form.js, facets.js,
 * animations.js, three-scene.js) that run directly with `shopify theme dev`.
 *
 * This entry exists for contributors who prefer bundling the motion vendors
 * (GSAP, Lenis, Three.js, Swiper, SplitType) locally instead of via CDN.
 * Run `npm run build` to emit assets/theme.bundle.js.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import * as THREE from 'three';
import SplitType from 'split-type';
import Swiper from 'swiper';

declare global {
  interface Window {
    gsap: typeof gsap;
    ScrollTrigger: typeof ScrollTrigger;
    Lenis: typeof Lenis;
    THREE: typeof THREE;
    SplitType: typeof SplitType;
    Swiper: typeof Swiper;
    DEEE: Record<string, unknown>;
  }
}

// Expose vendors on window so the /assets modules can enhance progressively.
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.Lenis = Lenis;
window.THREE = THREE;
window.SplitType = SplitType;
window.Swiper = Swiper;

gsap.registerPlugin(ScrollTrigger);

export {};
