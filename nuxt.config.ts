// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  css: ['~/assets/css/main.css'],

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  routeRules: {
    '/cart': { ssr: false },
    '/checkout': { ssr: false },
    '/checkout/**': { ssr: false },
    '/profile': { ssr: false },
    '/profile/**': { ssr: false },
    '/photographer': { ssr: false },
    '/photographer/**': { ssr: false },
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
    '/favorites': { ssr: false },
    '/login': { ssr: false },
    '/register': { ssr: false },
    '/forgot-password': { ssr: false },
    '/reset-password': { ssr: false },
    '/confirm-email': { ssr: false },
    '/verify-email': { ssr: false },
    '/shop': { ssr: false },
    '/shop/**': { ssr: false },
    '/photos': { ssr: false },
    '/photos/**': { ssr: false },
    '/tournaments/**/photos': { ssr: false },
    '/tournaments/**/search/face': { ssr: false },
  },

  app: {
    head: {
      title: 'PixMomento',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Find and download your tournament photos' },
      ],
    },
  },

  runtimeConfig: {
    apiBase: process.env.NUXT_API_BASE || process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
      emailVerificationEnabled: process.env.NUXT_PUBLIC_EMAIL_VERIFICATION_ENABLED === 'true',
    },
  },
})
