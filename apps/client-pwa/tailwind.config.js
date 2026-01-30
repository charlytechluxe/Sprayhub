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
        background: '#0a0a0a',
        foreground: '#ffffff',
        accent: {
          pink: '#FB2056', // Art de la Grimpe Primary Pink
          blue: '#32A9D6', // Art de la Grimpe Blue
          green: '#A4C639', // Art de la Grimpe Lime Green
          yellow: '#FFD700', // Art de la Grimpe Yellow
          red: '#FB2056',
          white: '#ffffff',
        },
        grimpe: {
          pink: '#FB2056',
          blue: '#32A9D6',
          dark: '#222222',
        }
      },
      height: {
        screen: '100dvh',
      },
      minHeight: {
        screen: '100dvh',
      }
    },
  },
  plugins: [],
}
