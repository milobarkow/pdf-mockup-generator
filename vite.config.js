import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    base: '/pdf-mockup-generator/',
    build: {
        outDir: 'build',
        rollupOptions: {
            input: {
                main: '/index.html',
                popup: '/popup.html',
            }
        }
    }
});

