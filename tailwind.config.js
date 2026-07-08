/**
 * TailwindCSS configuration for the DEEE TODO Shopify theme.
 * Optional build step: compiles src/styles into assets/theme.min.css.
 * The theme also ships a prebuilt assets/base.css so it runs without building.
 */
export default {
  content: [
    './layout/**/*.liquid',
    './sections/**/*.liquid',
    './snippets/**/*.liquid',
    './blocks/**/*.liquid',
    './templates/**/*.liquid',
    './src/**/*.{js,ts}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          900: '#050608',
          800: '#0b0c10',
          700: '#11141b',
          600: '#161b22',
          500: '#1f2833'
        },
        brand: {
          DEFAULT: '#fb2c36',
          soft: '#ff6568',
          fade: '#ffa3a3'
        },
        neon: {
          cyan: '#00f0ff',
          pink: '#ff007a',
          purple: '#b300ff',
          green: '#00c758',
          blue: '#3080ff',
          gold: '#edb200'
        },
        ink: {
          DEFAULT: '#ededed',
          muted: '#99a1af',
          faint: '#6a7282'
        }
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(251, 44, 54, 0.55)',
        'glow-cyan': '0 0 40px -8px rgba(0, 240, 255, 0.55)',
        card: '0 24px 60px -24px rgba(0, 0, 0, 0.65)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
