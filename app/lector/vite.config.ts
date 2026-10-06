import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: './',
  build: {
    minify: mode === 'production',
    sourcemap: mode !== 'production',
    target: 'safari16',
    outDir: '../../dist/lector',
    emptyOutDir: true,
  },
  test: { environment: 'jsdom' },
}));
