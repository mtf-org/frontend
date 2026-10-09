import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Load .env files before Vite initializes
dotenv.config();

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: {
      port: 4200,
    },
    define: {
      'import.meta.env.VITE_MODE': JSON.stringify(mode),
    },
    build: {
      outDir: mode === 'production' ? 'dist-prod' : mode === 'localdev' ? 'dist-local' : 'dist-dev',
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'esbuild' : false,
    }
  };
});