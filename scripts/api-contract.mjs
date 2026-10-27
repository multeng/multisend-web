import { createClient } from '@hey-api/openapi-ts';
import { format, resolveConfig } from 'prettier';
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  mkdtemp,
  rm,
} from 'node:fs/promises';
import { resolve, join } from 'node:path';
import process from 'node:process';
import { relative, isAbsolute } from 'node:path';

async function removeTemporary(artifacts, temporary) {
  const child = relative(artifacts, temporary);
  if (!child || child.startsWith('..') || isAbsolute(child))
    throw new Error('Refusing cleanup outside artifacts');
  await rm(temporary, { recursive: true, force: true });
}

const root = resolve(import.meta.dirname, '..');
const artifacts = join(root, '.artifacts');
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, 'api-'));
try {
  await createClient({
    input: join(root, 'api/openapi.yaml'),
    output: temporary,
    plugins: ['@hey-api/typescript'],
  });
  const target = join(root, 'src/api/generated');
  const names = (await readdir(temporary)).filter((name) =>
    name.endsWith('.ts'),
  );
  const options = await resolveConfig(join(root, 'package.json'));
  for (const name of names) {
    const content = await format(
      await readFile(join(temporary, name), 'utf8'),
      {
        ...options,
        parser: 'typescript',
      },
    );
    if (process.argv.includes('--write')) {
      await mkdir(target, { recursive: true });
      await writeFile(join(target, name), content);
    } else if ((await readFile(join(target, name), 'utf8')) !== content) {
      throw new Error('API types are stale. Run npm run api:generate.');
    }
  }
} finally {
  // mkdtemp created this exact child of the workspace artifacts directory.
  await removeTemporary(artifacts, temporary);
}
