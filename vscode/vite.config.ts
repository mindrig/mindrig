import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const isWebview = process.env.BUILD_TARGET === 'webview';

export default defineConfig({
  plugins: [react()],
  build: isWebview ? {
    // Webview build configuration
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/index.tsx'),
      output: {
        entryFileNames: 'webview.js',
        chunkFileNames: 'webview-[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist/webview',
    sourcemap: true,
    minify: false,
  } : {
    // Extension build configuration  
    lib: {
      entry: resolve(__dirname, 'src/extension.ts'),
      name: 'extension',
      fileName: 'extension',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['vscode'],
      output: {
        globals: {
          vscode: 'vscode',
        },
      },
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node16',
    minify: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});