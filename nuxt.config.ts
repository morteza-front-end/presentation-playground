// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: true,
  devtools: { enabled: true },

  // Serve the raw sample .ts files so the browser can fetch their source
  // (Monaco needs the literal text to show red squiggles).
  nitro: {
    devProxy: {},
    routeRules: {
      '/samples/**': { cors: true },
    },
  },

  vite: {
    // Monaco ships large worker bundles; configure them for Vite.
    optimizeDeps: {
      include: ['monaco-editor'],
    },
    worker: {
      format: 'es',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // we keep live diagnostics inside Monaco instead
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'TS Presentation Playground',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
});
