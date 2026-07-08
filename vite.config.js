import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Optional bundler for advanced contributors.
 * Outputs hashed-free named files straight into /assets so Liquid can
 * reference them with {{ 'name.js' | asset_url }}.
 *
 * NOTE: The theme ships prebuilt assets and works with `shopify theme dev`
 * out of the box. Running Vite is only required when editing files in /src.
 */
export default defineConfig({
  build: {
    outDir: 'assets',
    emptyOutDir: false,
    manifest: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        'theme.bundle': resolve(process.cwd(), 'src/scripts/index.ts'),
        'theme.styles': resolve(process.cwd(), 'src/styles/index.css')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
});
