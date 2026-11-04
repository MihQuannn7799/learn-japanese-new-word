import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname } from 'node:path';
import { openNotebookDatabase } from './database.js';
import { json, notebookApi } from './notebook-api.js';

const frontend = new URL('../frontend/', import.meta.url);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export function createKotobaServer({ databasePath, previewHost } = {}) {
  const database = openNotebookDatabase(databasePath);
  const hosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (previewHost) hosts.add(previewHost);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (!hosts.has(url.hostname) || url.host !== request.headers.host) return json(response, 403, { error: 'Địa chỉ máy chủ không hợp lệ.' });
      if (url.pathname === '/api/notebook') return await notebookApi(request, response, database, url.origin);
      if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { error: 'Phương thức không hỗ trợ.' });

      const path = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
      if (!/^\/(?:[\w-]+\/)*[\w.-]+$/.test(path) || !mime[extname(path)] || path.split('/').some((part) => part.startsWith('.'))) {
        return json(response, 404, { error: 'Không tìm thấy.' });
      }
      let file = await readFile(new URL(path.slice(1), frontend));
      if (path === '/index.html') file = file.toString().replace('</head>', '  <meta name="kotoba-backend" content="local">\n</head>');
      response.writeHead(200, {
        'Content-Type': mime[extname(path)],
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : file);
    } catch (error) {
      if (response.headersSent || response.destroyed) return;
      if (error.code === 'ENOENT' || error instanceof URIError) return json(response, 404, { error: 'Không tìm thấy.' });
      console.error(error);
      json(response, 500, { error: 'Không truy cập được dữ liệu sổ tay.' });
    }
  });
  server.on('close', () => database.close());
  return server;
}
