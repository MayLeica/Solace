const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'paper': '#F9F7F2',
        'sand': '#D4A373',
        'rose-dust': '#BC8F8F',
        'coffee': '#4A3F35',
        // Добавляем переменные, которые используются в дизайне
        'espresso': 'var(--espresso)',
        'cappuccino': 'var(--cappuccino)',
        'mocha': 'var(--mocha)',
        'latte': 'var(--latte)',
        'cream': 'var(--cream)',
      },
      gridTemplateColumns: {
        // Та самая магия для ровного трекера на 31 день
        '31': 'repeat(31, minmax(0, 1fr))',
      },
      fontFamily: {
        'serif': ['Cormorant Garamond', 'serif'],
        'lora': ['Lora', 'serif'], // Добавил Lora, так как мы её часто используем
        'inter': ['Inter', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        '3xl': '1.5rem'
      },
      boxShadow: {
        'sm': '0 2px 6px rgba(74,63,53,0.08)'
      }
    },
  },
  plugins: [],
}
