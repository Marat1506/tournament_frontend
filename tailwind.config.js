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
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#0056ff',
          600: '#0056ff',
          700: '#0044cc',
        },
      },
      boxShadow: {
        nav: '0 -4px 24px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
