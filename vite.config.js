import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    root: '.',
    base: '/pdf-mockup-generator/',
    build: {
        outDir: 'build',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                popup: resolve(__dirname, 'popup.html'),
            }
        }
    }
});

