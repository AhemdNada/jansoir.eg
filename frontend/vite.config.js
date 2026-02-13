import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression as viteCompression } from 'vite-plugin-compression2'
import compress from 'compression'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({

  plugins: [
    react(),

    // ── Pre-compression (gzip + brotli) ────────────────────────────────
    viteCompression({ algorithm: 'gzip' }),
    viteCompression({ algorithm: 'brotliCompress' }),

    // ── Preview compression ────────────────────────────────────────────
    {
      name: 'preview-compression',
      configurePreviewServer(server) {
        server.middlewares.use(compress());
      }
    },

    // ── HTML optimizer ────────────────────────────────────────────────
    {
      name: 'html-optimizer',
      enforce: 'post',
      transformIndexHtml(html) {
        if (mode !== 'production') return html;
        let result = html;

        // Defer main CSS
        result = result.replace(
          /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)"[^>]*>/g,
          (match, cssPath) =>
            `<link rel="stylesheet" crossorigin href="${cssPath}" media="print" onload="this.media='all'">` +
            `<noscript><link rel="stylesheet" crossorigin href="${cssPath}"></noscript>`
        );

        // Remove charts preload
        result = result.replace(
          /\s*<link rel="modulepreload" crossorigin href="\/assets\/charts-[^"]+\.js">/g,
          ''
        );

        return result;
      }
    },

    // ── Home chunk preloader ──────────────────────────────────────────
    {
      name: 'preload-home-chunk',
      enforce: 'post',

      generateBundle(_, bundle) {
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'chunk' && chunk.name === 'Home') {
            this._homeChunk = fileName;
            break;
          }
        }
      },

      writeBundle(options) {
        if (!this._homeChunk) return;

        const outDir = options.dir || 'dist';
        const htmlPath = resolve(outDir, 'index.html');

        let html = readFileSync(htmlPath, 'utf8');

        const chunkName = this._homeChunk.replace(/^assets\//, '');

        const preloadTag =
          `<link rel="modulepreload" crossorigin href="/assets/${chunkName}">`;

        html = html.replace(
          '<script type="module"',
          preloadTag + '\n    <script type="module"'
        );

        writeFileSync(htmlPath, html);
      }
    }
  ],

  build: {
    sourcemap: false,
    minify: 'esbuild',

    // 🔥 Performance improvements
    cssCodeSplit: true,
    target: 'es2018',
    chunkSizeWarningLimit: 600,
    assetsInlineLimit: 4096,

    modulePreload: {
      polyfill: false
    },

    rollupOptions: {
      output: {

        manualChunks(id) {

          // React core
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/@remix-run/')
          ) {
            return 'react';
          }

          // Charts (admin only)
          if (
            id.includes('node_modules/chart.js/') ||
            id.includes('node_modules/react-chartjs-2/')
          ) {
            return 'charts';
          }

          // Swiper carousel
          if (id.includes('node_modules/swiper/')) {
            return 'swiper';
          }

          // FontAwesome icons
          if (id.includes('node_modules/@fortawesome/')) {
            return 'fontawesome';
          }

          // 🔥 Vendor fallback
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },

  esbuild: {
    drop: mode === 'production'
      ? ['console', 'debugger']
      : [],
  },

}))
