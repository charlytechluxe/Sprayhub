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
                background: '#121214', // Luxury Dark Grey (Gunmetal)
                foreground: '#ffffff',
                surface: {
                    DEFAULT: '#1c1c1f', // Lighter grey for cards
                    light: '#27272a',
                },
                accent: {
                    pink: '#ff0055', // Neon Pink
                    blue: '#00ccff', // Neon Blue
                    green: '#ccff00', // Neon Lime
                    yellow: '#FFD700',
                    red: '#FB2056',
                },
                grimpe: {
                    pink: '#ff0055',
                    blue: '#00ccff',
                    dark: '#18181b',
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
