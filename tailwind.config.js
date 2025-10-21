/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core - iFood Pago (mais vibrante e acessível)
        primary: {
          50: '#E6F7F4',
          100: '#B3E8DE',
          200: '#80D9C8',
          300: '#4DCAB2',
          400: '#26BDA3',
          500: '#00A389', // Principal - verde Pago vibrante
          600: '#008F75',
          700: '#007B62',
          800: '#00664E',
          900: '#004D3A',
        },

        // iFood Brand Red
        brand: {
          50: '#FEE9EC',
          100: '#FCC3CA',
          200: '#FA9DA8',
          300: '#F87786',
          400: '#F6516A',
          500: '#EA1D2C', // Vermelho iFood oficial
          600: '#D11A28',
          700: '#B81723',
          800: '#9F131E',
          900: '#860F19',
        },

        // iFood Pago Wine/Magenta (tons vinho do site)
        wine: {
          50: '#FAE8ED',
          100: '#F3C2D1',
          200: '#EB9BB5',
          300: '#E37499',
          400: '#C54A6D',
          500: '#8B1538', // Tom vinho principal do site
          600: '#731131',
          700: '#5C0D27',
          800: '#44091D',
          900: '#2D0613',
        },

        // Neutros modernos (mais contraste)
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },

        // Estados semânticos (melhor contraste)
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
        },

        // Canais
        channel: {
          whatsapp: {
            50: '#E6F6F2',
            100: '#C0EADF',
            200: '#95DBC7',
            500: '#128C7E',
            600: '#0F776B',
            700: '#0B6258',
            800: '#084B42',
            DEFAULT: '#128C7E',
          },
          email: {
            50: '#E8EDFF',
            100: '#CED7FE',
            200: '#AEBDFB',
            500: '#3B55F6',
            600: '#2F45D6',
            700: '#2536AC',
            800: '#1B2984',
            DEFAULT: '#3B55F6',
          },
          push: {
            50: '#FFF0E6',
            100: '#FFD8C2',
            200: '#FFB389',
            500: '#E35A1C',
            600: '#C74C17',
            700: '#9F3D13',
            800: '#782F0E',
            DEFAULT: '#E35A1C',
          },
          sms: {
            50: '#F3E8FF',
            100: '#E2C9FF',
            200: '#CBA3FF',
            500: '#7A26D9',
            600: '#661FB3',
            700: '#51198F',
            800: '#3C136A',
            DEFAULT: '#7A26D9',
          },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00A389 0%, #4DCAB2 100%)',
        'gradient-brand': 'linear-gradient(135deg, #EA1D2C 0%, #F6516A 100%)',
      },
    },
  },
  plugins: [],
}
