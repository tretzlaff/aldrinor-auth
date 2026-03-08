import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        root: './',
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['src/main.ts', 'dist/**', 'node_modules/**'],
        },
        include: ['**/*.spec.ts'],
    },
    plugins: [
        // Fast SWC compiler for Vitest
        swc.vite({
            module: { type: 'es6' },
        }),
    ],
});
