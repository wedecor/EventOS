/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f3',
          600: '#b42318',
          700: '#912018',
          900: '#55160c',
        },
      },
    },
  },
  plugins: [],
};
