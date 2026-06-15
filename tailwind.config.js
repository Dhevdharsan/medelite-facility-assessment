/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:    '#0B1E3C',
          purple:  '#6B21A8',
          violet:  '#7C3AED',
          magenta: '#C2185B',
          pink:    '#E91E8C',
          light:   '#F3EFFE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
