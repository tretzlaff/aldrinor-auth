import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/main.ts'],
    splitting: false,
    sourcemap: true,
    clean: true,
    target: 'node20', // or whatever your target runtime is
    format: ['cjs'],
    noExternal: [], // Add libraries here if you need them bundled into the final output
});
