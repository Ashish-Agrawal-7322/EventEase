/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#070b14',
          card: '#0b1329',
          cardLight: '#111e3f',
          border: 'rgba(56, 189, 248, 0.2)',
          borderHover: 'rgba(56, 189, 248, 0.45)',
          neonBlue: '#00f0ff',
          neonPurple: '#a855f7',
          neonEmerald: '#00ff9d',
          neonRose: '#ff007f',
          neonAmber: '#ffb703',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        cyber: ['Orbitron', 'Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2.5s ease-in-out infinite alternate',
        'scanline': 'scanline 2s linear infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 25px rgba(168, 85, 247, 0.7))' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.15) 0%, rgba(7, 11, 20, 0) 70%)',
        'cyber-gradient': 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(0, 240, 255, 0.2) 100%)',
      }
    },
  },
  plugins: [],
}
