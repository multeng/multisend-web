import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { siteManifest } from './src/features/auth/manifest.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const manifest = siteManifest(env.VITE_PUBLIC_SITE_URL ?? '');

  return {
    plugins: [
      react(),
      {
        name: 'tonconnect-manifest',
        configureServer(server) {
          if (manifest)
            server.middlewares.use('/tonconnect-manifest.json', (_req, res) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(manifest));
            });
        },
        generateBundle() {
          if (manifest)
            this.emitFile({
              type: 'asset',
              fileName: 'tonconnect-manifest.json',
              source: JSON.stringify(manifest),
            });
        },
      },
    ],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: env.API_PROXY_TARGET || 'http://127.0.0.1:8080' },
      },
    },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      clearMocks: true,
      restoreMocks: true,
      unstubGlobals: true,
    },
  };
});
