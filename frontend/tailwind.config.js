/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.jsx",
    "./src/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Luxury Dark Mode Palette (No Green)
        gold: {
          DEFAULT: '#C9A24D',
          light: '#D4B366',
          dark: '#B8943A',
        },
        beige: {
          DEFAULT: '#E8DFC8',
          light: '#F5F0E5',
          dark: '#D9CEB0',
        },
        woody: {
          DEFAULT: '#7A5C3E',
          light: '#8F6F4F',
          dark: '#654A2F',
        },
        dark: {
          DEFAULT: '#0B0B0B',
          base: '#0B0B0B',
          light: '#111111',
          lighter: '#1A1A1A',
        },
        // Brand aliases for backward compatibility
        brand: {
          DEFAULT: '#C9A24D', // Gold
          strong: '#C9A24D', // Gold
          contrast: '#E8DFC8', // Beige
        },
        primary: {
          DEFAULT: '#C9A24D', // Gold
        },
      },
      backgroundColor: {
        dark: '#0B0B0B',
        'dark-light': '#111111',
        'dark-lighter': '#1A1A1A',
      },
      textColor: {
        beige: '#E8DFC8',
        gold: '#C9A24D',
        woody: '#7A5C3E',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
