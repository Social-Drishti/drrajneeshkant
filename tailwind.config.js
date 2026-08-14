/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./backend/src/**/*.{js,ts,jsx,tsx}",
    "./backend/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        playfair: ['Playfair Display', 'serif']
      },
      colors: {
        primary: '#0b3b8c',
        primaryLight: '#2563eb',
        primaryDark: '#071e45',
        accent: '#00d4ff',
        accentLight: '#e6fbff',
        dark: '#04101f',
        surface: '#f3f8ff',
        gold: '#f5b301'
      }
    }
  },
  plugins: []
}