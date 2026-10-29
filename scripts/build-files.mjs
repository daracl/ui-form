import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');

function copyDeclarations(source, destination) {
  mkdirSync(destination, { recursive: true });
  for (const item of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, item.name);
    const to = join(destination, item.name);
    if (item.isDirectory()) copyDeclarations(from, to);
    else if (item.name.endsWith('.d.ts')) cpSync(from, to);
  }
}

export function buildFiles(action) {
  if (dirname(dist) !== resolve(root) || (existsSync(dist) && lstatSync(dist).isSymbolicLink())) {
    throw new Error('Unsafe build output directory');
  }
  switch (action) {
    case 'clean-dist': rmSync(dist, { recursive: true, force: true }); break;
    case 'dts': copyDeclarations(join(root, 'src'), dist); break;
    case 'unmin':
      for (const file of readdirSync(join(dist, 'unmin'), { withFileTypes: true })) {
        if (file.isFile()) cpSync(join(dist, 'unmin', file.name), join(dist, file.name));
      }
      break;
    case 'clean-unmin': rmSync(join(dist, 'unmin'), { recursive: true, force: true }); break;
    case 'html': cpSync(join(root, 'public'), dist, { recursive: true }); break;
    default: throw new Error(`Unknown build action: ${action}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error('Expected one build action');
  buildFiles(process.argv[2]);
}
