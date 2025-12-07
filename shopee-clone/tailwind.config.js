/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'shopee-orange': '#ee4d2d',
        'shopee-orange-dark': '#d73211',
      },
    },
  },
  plugins: [],
}

