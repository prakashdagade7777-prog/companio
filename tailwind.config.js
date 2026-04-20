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
        brand: {
          black:   '#06060a',
          darker:  '#0c0c14',
          dark:    '#111120',
          card:    '#16162a',
          border:  '#2a2a4a',
          indigo: {
            DEFAULT: '#6366f1',
            light:   '#818cf8',
            dark:    '#4f46e5',
            glow:    'rgba(99,102,241,0.35)',
          },
          emerald: {
            DEFAULT: '#10b981',
            light:   '#34d399',
            dark:    '#059669',
            glow:    'rgba(16,185,129,0.35)',
          },
          violet:  '#7c3aed',
          rose:    '#f43f5e',
          amber:   '#f59e0b',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
      },
      boxShadow: {
        'glow-indigo':  '0 0 30px rgba(99,102,241,0.25), 0 0 60px rgba(99,102,241,0.10)',
        'glow-emerald': '0 0 30px rgba(16,185,129,0.25), 0 0 60px rgba(16,185,129,0.10)',
        'glow-sm':      '0 0 15px rgba(99,102,241,0.20)',
        'card':         '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover':   '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(99,102,241,0.15)',
      },
      backgroundImage: {
        'gradient-radial':    'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':      'radial-gradient(at 40% 20%, hsla(248,100%,66%,0.15) 0, transparent 50%), radial-gradient(at 80% 0%, hsla(167,100%,57%,0.10) 0, transparent 50%), radial-gradient(at 0% 50%, hsla(248,100%,66%,0.10) 0, transparent 50%)',
        'hero-gradient':      'linear-gradient(135deg, #06060a 0%, #111120 50%, #0d0d1f 100%)',
        'card-gradient':      'linear-gradient(135deg, rgba(22,22,42,0.8) 0%, rgba(16,16,32,0.9) 100%)',
        'indigo-emerald':     'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
        'button-primary':     'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
        'button-emerald':     'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      },
      animation: {
        'fade-in':     'fadeIn 0.6s ease forwards',
        'slide-up':    'slideUp 0.6s ease forwards',
        'slide-down':  'slideDown 0.3s ease forwards',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'float':       'float 3s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'spin-slow':   'spin 4s linear infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.2)' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
