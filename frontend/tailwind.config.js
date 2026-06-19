/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Map default sans font family to Inter
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Custom corporate/NGO design variables - Amber & Forest Green
        primary: {
          50: '#fff9ed',
          100: '#fef0d6',
          200: '#fddfaa',
          300: '#fcca72',
          400: '#fbb03f',
          500: '#feab32', // Main Orange/Gold
          600: '#e28a1b',
          700: '#bc6814',
          800: '#954e12',
          900: '#773e11',
        },
        success: {
          50: '#f0f7f0',
          100: '#dbece0',
          200: '#bfd9c5',
          300: '#93bf9e',
          400: '#60a071',
          500: '#104210', // Main Dark Forest Green
          600: '#0b320b',
          700: '#082608',
          800: '#061d06',
          900: '#041404',
        },
      },
    },
  },
  plugins: [],
}
