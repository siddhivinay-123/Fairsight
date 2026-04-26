/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        void: '#060811',
        deep: '#0a0f1e',
        surface: '#0f1629',
        panel: '#141d35',
        border: '#1e2d52',
        accent: '#00e5ff',
        neon: '#39ff14',
        warn: '#ff6b35',
        danger: '#ff2d55',
        muted: '#4a5578',
        soft: '#8892b0',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'scanline': 'scanline 4s linear infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'data-flow': 'dataflow 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%,100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-1px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)' },
        },
        dataflow: {
          '0%': { strokeDashoffset: 100 },
          '100%': { strokeDashoffset: 0 },
        }
      }
    }
  },
  plugins: []
}
