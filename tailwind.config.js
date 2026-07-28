/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 淡蓝主题色板 - 个人偏好的清新淡蓝
        sky: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#BAE0FF',
          300: '#8FCBF7',
          400: '#7EB6E6',  // 主色
          500: '#5B9BD5',
          600: '#4A87C0',
          700: '#3A6FA0',
          800: '#2D5680',
          900: '#1F3D5C'
        }
      },
      fontFamily: {
        sans: ['"Noto Sans CJK SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
