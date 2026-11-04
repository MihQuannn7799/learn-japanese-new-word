import { cp, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);

await rm(output, { recursive: true, force: true });
await cp(new URL('frontend/', root), output, { recursive: true });
await cp(new URL('LICENSE', root), new URL('LICENSE', output));
