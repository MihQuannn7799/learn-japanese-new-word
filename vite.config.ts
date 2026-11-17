import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./frontend/', import.meta.url)),
  base: './',
  server: {
    fs: {
      allow: ['frontend', 'shared', 'node_modules'].map((path) => fileURLToPath(new URL(`./${path}/`, import.meta.url))),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  plugins: [{
    name: 'kotoba-licenses',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'LICENSE.txt', source: readFileSync(new URL('./LICENSE', import.meta.url), 'utf8') });
      this.emitFile({ type: 'asset', fileName: 'LICENSE-WANAKANA.txt', source: readFileSync(new URL('./node_modules/wanakana/LICENSE', import.meta.url), 'utf8') });
    },
  }, {
    name: 'kotoba-notebook-dev',
    apply: 'serve',
    transformIndexHtml() {
      return [{ tag: 'meta', attrs: { name: 'kotoba-backend', content: 'local' }, injectTo: 'head' }];
    },
  }],
});
