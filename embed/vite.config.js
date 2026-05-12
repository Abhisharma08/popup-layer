import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'PopLayer',
      fileName: 'poplayer',
      formats: ['iife'],
    },
    rollupOptions: {
      output: { inlineDynamicImports: true }
    },
    minify: true,
  }
});
