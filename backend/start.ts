import { fileURLToPath } from 'node:url';
import { createKotobaServer } from './server.ts';
import type { ViteDevServer } from 'vite';

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.PORT ?? 8000);
const hostIndex = args.indexOf('--host');
const preview = args.includes('--strictPort') && hostIndex >= 0 && args[hostIndex + 1] === '0.0.0.0';
const host = preview ? '0.0.0.0' : '127.0.0.1';
const databasePath = process.env.KOTOBA_DB_PATH ?? (preview ? ':memory:' : fileURLToPath(new URL('./storage/kotoba.sqlite', import.meta.url)));
const development = args.includes('--dev');
let vite: ViteDevServer | undefined;
const server = createKotobaServer({
  databasePath,
  previewHost: preview ? 'terminal.local' : undefined,
  frontendMiddleware: development ? (request, response) => vite!.middlewares(request, response) : undefined,
});

if (development) {
  const { createServer } = await import('vite');
  vite = await createServer({
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, ws: { server }, allowedHosts: preview ? ['terminal.local'] : [] },
  });
}

function shutdown() {
  void vite?.close();
  server.close();
  server.closeAllConnections();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

server.listen(port, host, () => {
  const address = server.address();
  if (address && typeof address !== 'string') console.log(`Kotoba đang chạy tại http://localhost:${address.port}`);
});
