module.exports = {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './content/**/*.{md,yml,json}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          600: '#2563EB',
          500: '#3B82F6',
          400: '#60A5FA'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        xl: '12px'
      },
      fontFamily: {
        sans: ['NanumSquare', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
