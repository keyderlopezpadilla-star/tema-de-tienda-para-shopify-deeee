export default [
  {
    files: ['src/**/*.{js,ts}', 'assets/**/*.js'],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        Shopify: 'readonly',
        customElements: 'readonly',
        HTMLElement: 'readonly',
        fetch: 'readonly',
        gsap: 'readonly',
        ScrollTrigger: 'readonly',
        THREE: 'readonly',
        Lenis: 'readonly',
        Swiper: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart']
    }
  }
];
