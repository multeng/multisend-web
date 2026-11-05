import assert from 'node:assert/strict';
import { log } from 'node:console';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Validate the actual production output, not configuration source text.
const dist = resolve(import.meta.dirname, '../dist');
const html = await readFile(resolve(dist, 'index.html'), 'utf8');
const links = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => {
  const attrs = Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [
      key,
      value,
    ]),
  );
  return attrs;
});
async function asset(url) {
  const file = resolve(dist, '.' + url);
  assert.ok(
    (url.startsWith('/') && file.startsWith(dist + '/')) ||
      (url.startsWith('/') && file.startsWith(dist + '\\')),
    'Asset must stay in dist',
  );
  return readFile(file);
}
const manifestLink = links.find((link) => link.rel === 'manifest');
assert.ok(manifestLink, 'Built HTML must link a web app manifest');
const manifest = JSON.parse(await asset(manifestLink.href));
assert.equal(manifest.id, '/');
assert.equal(manifest.start_url, '/');
assert.equal(manifest.scope, '/');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.name, 'TON Multisend');
async function png(url, width) {
  const data = await asset(url);
  assert.equal(
    data.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    'Icon must be PNG',
  );
  assert.equal(data.readUInt32BE(16), width);
  assert.equal(data.readUInt32BE(20), width);
}
for (const size of [192, 512]) {
  const icon = manifest.icons.find((icon) => icon.sizes === `${size}x${size}`);
  assert.ok(icon);
  assert.equal(icon.type, 'image/png');
  await png(icon.src, size);
}
assert.ok(
  manifest.icons.some((icon) => icon.purpose?.split(' ').includes('maskable')),
);
const apple = links.find((link) => link.rel === 'apple-touch-icon');
assert.ok(apple);
await png(apple.href, 180);
log('Production install metadata and PNG dimensions PASS');
