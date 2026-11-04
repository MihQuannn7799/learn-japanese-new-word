import { cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const siteFiles = ['index.html', 'favicon.svg', 'icons.svg', 'css', 'js', 'LICENSE'];

await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const file of siteFiles) {
  await cp(new URL(file, root), new URL(file, output), { recursive: true });
}
