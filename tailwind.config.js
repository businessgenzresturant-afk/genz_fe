/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Swiggy-inspired orange */
        delivery: {
          50: '#fff8f0',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FC8019',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9a3412',
          900: '#7c2d12',
        },
        /** Zomato-inspired accent */
        flame: {
          400: '#fb7185',
          500: '#E23744',
          600: '#cb202d',
          700: '#9f1823',
        },
        /** Swiggy-style body ink */
        ink: {
          DEFAULT: '#3d4152',
          muted: '#686b78',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        charcoal: {
          900: '#1A1A1A',
        },
        /** Gen-Z menu accent */
        neon: '#DFFF00',
        electric: {
          500: '#2563EB',
          600: '#1D4ED8',
          800: '#1E3A5F',
        },
        /** Mockup veg toggle track */
        olive: {
          600: '#6B7B5E',
          700: '#5A684F',
        },
        gold: {
          500: '#d4a92c',
          600: '#b98506',
        },
        'text-primary': '#334155',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        menu: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15, 23, 42, 0.08)',
        lift: '0 12px 40px -12px rgba(252, 128, 25, 0.22)',
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        food: '0 2px 8px rgba(61, 65, 82, 0.08), 0 8px 24px rgba(61, 65, 82, 0.06)',
        'food-lg': '0 4px 16px rgba(61, 65, 82, 0.1), 0 12px 32px rgba(252, 128, 25, 0.08)',
      },
      maxWidth: {
        /** Capped width for rare fixed layouts */
        app: '1680px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
