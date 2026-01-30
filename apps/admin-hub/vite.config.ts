import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react-swc'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        electron([
            {
                // Main-process entry file of the Electron App.
                entry: 'src/electron/main.ts',
            },
            {
                entry: 'src/electron/preload.ts',
                onstart(options) {
                    // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
                    // instead of restarting the entire Electron App.
                    options.reload()
                },
            },
        ]),
        renderer(),
    ],
})
