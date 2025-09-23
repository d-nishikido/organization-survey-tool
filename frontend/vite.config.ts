/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@api': path.resolve(__dirname, './src/api'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: !isDev,
      minify: isDev ? false : 'esbuild',
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for stable dependencies
            vendor: ['react', 'react-dom'],
            // Router chunk for navigation
            router: ['react-router-dom'],
            // State management chunk
            state: ['zustand', 'react-query'],
            // UI utilities chunk
            ui: ['axios', 'react-hook-form', 'zod', '@hookform/resolvers'],
            // Charts and utilities
            utils: ['recharts', 'date-fns', 'clsx'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        'react-query',
        'axios',
      ],
    },
    define: {
      // Enable production optimizations
      __DEV__: isDev,
    },
    esbuild: {
      // Remove console.log in production
      drop: isDev ? [] : ['console', 'debugger'],
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './src/test-setup.ts',
    },
  };
});