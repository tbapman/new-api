// Temporary low-memory build config for constrained environments.
// Disables minification and splits heavy libraries into separate chunks.
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from '@douyinfe/vite-plugin-semi';
import path from 'path';
const { vitePluginSemi } = pkg;

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!/src\/.*\.js$/.test(id)) return null;
        return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
      },
    },
    react(),
    vitePluginSemi({ cssLayer: true }),
  ],
  build: {
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vchart: ['@visactor/vchart', '@visactor/react-vchart', '@visactor/vchart-semi-theme'],
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'semi-ui': ['@douyinfe/semi-icons', '@douyinfe/semi-ui'],
          tools: ['axios', 'history', 'marked'],
          'react-components': [
            'react-dropzone', 'react-fireworks', 'react-telegram-login',
            'react-toastify', 'react-turnstile',
          ],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
      maxParallelFileOps: 5,
    },
  },
});
