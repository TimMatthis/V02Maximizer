/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        positive: '#10B981',
        negative: '#EF4444',
        neutral: '#6B7280',
      },
    },
  },
  plugins: [],
}

