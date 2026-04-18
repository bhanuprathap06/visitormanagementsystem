/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1a4731',
          light: '#2d6a4f',
          dark: '#0f2d1e',
        },
        amber: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        earth: '#8B4513',
        sage: '#a7c4a0',
        // Used throughout components — must be in config for hover:/focus:/active: variants to work
        nature: {
          50:  '#f0faf4',
          100: '#dcf5e7',
          200: '#b9ebcf',
          300: '#7dd3aa',
          400: '#4ab888',
          500: '#2d9e6b',
          600: '#228056',
          700: '#2d6a4f',
          800: '#1a4731',
          900: '#0f2d1e',
          950: '#071a11',
        },
        amberBrand: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
