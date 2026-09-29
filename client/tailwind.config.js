export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1917', cream: '#faf6f1', sand: '#efe6dc', rose: { DEFAULT: '#b4636f', dark: '#8f4753', soft: '#f3dfe1' }, gold: '#b8935a'
      },
      fontFamily: { display: ['"Playfair Display"', 'Georgia', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] },
      keyframes: { fadeUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'none' } } },
      animation: { fadeUp: 'fadeUp .5s ease both' }
    }
  },
  plugins: []
};
