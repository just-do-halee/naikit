/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#171A21',
        'bg-secondary': '#1E2129',
        'surface': '#262A34', 
        'surface-raised': '#2F3542',
        'divider': 'rgba(58, 64, 80, 0.3)',
        'brand': '#5E6AD2',
        'brand-secondary': '#3D7FFF',
        'brand-dark': '#2D3282',
        'success': '#2AC28E',
        'warning': '#E8C547',
        'error': '#E55A5A',
        'info': '#5E9ED9',
        'weight-increase': '#4A7BF7',
        'weight-increase-strong': '#1F4BDF',
        'weight-decrease': '#E57373',
        'weight-decrease-strong': '#C62828',
        'wildcard': '#8E6FD8',
        'wildcard-border': '#A98FE2',
        'keyword': '#4A9F8E',
        'keyword-border': '#65BBA9',
        // Adding base colors that were in Tailwind v3 but might be renamed in v4
        'gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        'blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '0.25': '1px',
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '32': '8rem', // Add missing spacing classes
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
        md: '0 3px 6px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.05)',
        lg: '0 8px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
        xl: '0 12px 28px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)',
      },
      minHeight: {
        '32': '8rem', // Add min-h-32 class
      }
    },
  },
  plugins: [
    forms,
  ],
}
