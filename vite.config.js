import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Compute __dirname in ESM land
const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    root: '.',
    base: '/pdf-mockup-generator/',
    build: {
        outDir: 'build',
        rollupOptions: {
            input: {
                // main: '/index.html',
                // popup: '/popup.html',
                main: resolve(__dirname, 'index.html'),
                popup: resolve(__dirname, 'popup.html'),
            }
        }
    }
});

