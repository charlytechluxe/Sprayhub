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
                    pink: '#FB2056',
                    blue: '#32A9D6',
                    green: '#A4C639',
                    yellow: '#FFD700',
                    red: '#FB2056',
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
