/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blue-state': {
          strong: '#1e40af',
          lean: '#3b82f6',
          tilt: '#93c5fd'
        },
        'red-state': {
          strong: '#991b1b',
          lean: '#ef4444',
          tilt: '#fca5a5'
        }
      }
    },
  },
  plugins: [],
}
