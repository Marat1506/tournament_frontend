/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        page: '#080b16',
        surface: '#121826',
        brand: {
          50: '#1b1533',
          100: '#2a2150',
          400: '#a594ff',
          500: '#7b61ff',
          600: '#6e52f0',
          700: '#5d45e6',
        },
      },
      boxShadow: {
        nav: '0 -4px 24px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
