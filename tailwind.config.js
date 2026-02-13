/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D5BFF',
        'primary-dark': '#1E3FB8',
        accent: '#FF6B35',
        success: '#06D6A0',
        warning: '#FFD23F',
        danger: '#EF476F',
        'bg-main': '#F8F9FE',
        'card-bg': '#FFFFFF',
        'text-main': '#1A1D2E',
        'text-light': '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
