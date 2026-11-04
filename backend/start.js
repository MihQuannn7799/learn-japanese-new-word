import { fileURLToPath } from 'node:url';
import { createKotobaServer } from './server.js';

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.PORT ?? 8000);
const hostIndex = args.indexOf('--host');
const preview = args.includes('--strictPort') && hostIndex >= 0 && args[hostIndex + 1] === '0.0.0.0';
const host = preview ? '0.0.0.0' : '127.0.0.1';
const databasePath = process.env.KOTOBA_DB_PATH ?? (preview ? ':memory:' : fileURLToPath(new URL('./storage/kotoba.sqlite', import.meta.url)));
const server = createKotobaServer({ databasePath, previewHost: preview ? 'terminal.local' : undefined });

server.listen(port, host, () => {
  console.log(`Kotoba đang chạy tại http://localhost:${server.address().port}`);
});
