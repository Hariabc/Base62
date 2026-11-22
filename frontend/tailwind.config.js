/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        palette: {
          cream: '#FEF3E2',
          amber: '#F4AE52',
          terracotta: '#D4621A',
          espresso: '#2A1A0E',
        },
        brand: {
          50: '#FEF9F2',
          100: '#FEF3E2',
          200: '#FCE4BF',
          300: '#F8C88B',
          400: '#F4AE52',
          500: '#E4842E',
          600: '#D4621A',
          700: '#B85213',
          800: '#8F3E0C',
          900: '#5C2406',
          950: '#3D1603',
        },
        espresso: {
          50: '#FDF8F5',
          100: '#F8ECE4',
          200: '#EED3C2',
          300: '#DFB196',
          400: '#C78964',
          500: '#A4633D',
          600: '#7E4627',
          700: '#5A3019',
          800: '#3E2414',
          850: '#341D10',
          900: '#2A1A0E',
          950: '#1D120A',
        },
      },
    },
  },
  plugins: [],
}
