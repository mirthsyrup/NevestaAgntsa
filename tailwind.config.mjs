/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        gold: '#A67B5B',
        'gold-dark': '#8C6242', 
        'gold-light': '#C29D7F',
        dark: '#161616',
        paper: '#F9F7F2',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 20px 40px -10px rgba(166, 123, 91, 0.10)',
        'glow': '0 0 20px rgba(166, 123, 91, 0.3)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
      },
      transitionTimingFunction: {
        'custom-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, rgba(166, 123, 91, 0.1) 0%, rgba(166, 123, 91, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}