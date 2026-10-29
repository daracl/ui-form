import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { build } from 'vite';
import esConfig from '../vite.config.mjs';
import umdConfig from '../vite.config.umd.mjs';
import { root } from '../vite.common.mjs';
import { buildFiles } from './build-files.mjs';

const require = createRequire(import.meta.url);
const selection = process.argv[2] ?? 'all';
if (!['all', 'es', 'umd'].includes(selection) || process.argv.length > 3) {
  throw new Error('Usage: node scripts/build.mjs [all|es|umd]');
}

function declarations() {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, [require.resolve('typescript/bin/tsc'), '--emitDeclarationOnly'], {
      cwd: root, stdio: 'inherit', shell: false,
    });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? done() : reject(new Error(`Declaration build failed: ${code}`)));
  });
}

async function bundles() {
  for (const [format, factory] of [['es', esConfig], ['umd', umdConfig]]) {
    if (selection !== 'all' && selection !== format) continue;
    for (const mode of ['production', 'development']) {
      await build({ ...factory({ command: 'build', mode }), root, configFile: false, mode });
    }
  }
}

const started = performance.now();
if (selection === 'all') buildFiles('clean-dist');
const results = await Promise.allSettled([bundles(), ...(selection === 'all' ? [declarations()] : [])]);
const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
if (errors.length) throw new AggregateError(errors, 'Build failed');
if (selection === 'all') {
  buildFiles('dts');
  buildFiles('unmin');
  buildFiles('clean-unmin');
  buildFiles('html');
}
console.log(`Build completed in ${((performance.now() - started) / 1000).toFixed(2)}s`);
