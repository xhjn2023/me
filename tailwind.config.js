/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Gemini 品牌主色（紫色系）
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        gemini: {
          light: '#f5f3ff',
          DEFAULT: '#8b5cf6',
          dark: '#7c3aed',
          deeper: '#6d28d9',
          glow: 'rgba(139, 92, 246, 0.15)',
        },
        // 保留旧 sky 色板以兼容
        sky: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#BAE0FF',
          300: '#8FCBF7',
          400: '#7EB6E6',
          500: '#5B9BD5',
          600: '#4A87C0',
          700: '#3A6FA0',
          800: '#2D5680',
          900: '#1F3D5C'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Hiragino Sans GB"',
          'system-ui',
          'sans-serif',
        ]
      },
      boxShadow: {
        'gemini': '0 1px 3px rgba(139, 92, 246, 0.08), 0 1px 2px rgba(139, 92, 246, 0.06)',
        'gemini-md': '0 4px 14px rgba(139, 92, 246, 0.1), 0 2px 4px rgba(139, 92, 246, 0.06)',
        'gemini-lg': '0 10px 30px rgba(139, 92, 246, 0.12), 0 4px 8px rgba(139, 92, 246, 0.06)',
        'card': '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      }
    }
  },
  plugins: []
}