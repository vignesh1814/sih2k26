/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0b2545',
          blue: '#134074',
          accent: '#8da9c4',
          light: '#eef4f8',
          gold: '#c59b27',
          saffron: '#e86a17'
        }
      }
    },
  },
  plugins: [],
}
