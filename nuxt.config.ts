// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'ru', name: 'Русский' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
    ],
    defaultLocale: 'ru',
    strategy: 'no_prefix',
    vueI18n: './i18n.config.ts',
    bundle: {
      optimizeTranslationDirective: false,
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'bjj_locale',
      fallbackLocale: 'ru',
    },
  },

  app: {
    head: {
      title: 'BJJ Photos',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Найдите и скачайте свои фото с турниров' },
      ],
    },
  },

  runtimeConfig: {
    apiBase: process.env.NUXT_API_BASE || process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
    },
  },
})
