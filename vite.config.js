import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Chart.js into separate chunk
          'chart': ['chart.js', 'react-chartjs-2'],
          // Split React into separate chunk
          'react-vendor': ['react', 'react-dom'],
        },
      },
      external: [
        // Mark Node.js modules as external (they won't be bundled for browser)
        'node:child_process',
        'node:util',
      ],
    },
    chunkSizeWarningLimit: 600, // Increase limit to 600kb
  },
});
