import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
for (const name of ['index.cjs', 'index.min.cjs']) {
  assert.equal(typeof require(`../dist/${name}`).DaraForm.create, 'function', name);
}
for (const name of ['index.js', 'index.min.js']) {
  const { outputFiles } = buildSync({
    absWorkingDir: root, entryPoints: [`dist/${name}`], bundle: true,
    platform: 'node', format: 'cjs', write: false,
    external: ['@daracl/core/utils', '@daracl/datetimepicker'],
  });
  const sandbox = { module: { exports: {} }, require };
  vm.runInNewContext(outputFiles[0].text, sandbox);
  assert.equal(typeof sandbox.module.exports.DaraForm.create, 'function', name);
}
for (const name of ['daracl.form.umd.js', 'daracl.form.min.umd.js']) {
  const sandbox = { window: {}, setTimeout, clearTimeout, console };
  vm.runInNewContext(readFileSync(new URL(`../dist/${name}`, import.meta.url), 'utf8'), sandbox);
  assert.equal(typeof sandbox.window.Daracl.form.create, 'function', name);
}
for (const name of ['daracl.form.css', 'daracl.form.min.css']) {
  const css = readFileSync(new URL(`../dist/${name}`, import.meta.url), 'utf8');
  assert.match(css, /\.daracl-form/);
  assert.match(css, /--dui-/);
}
for (const name of ['index.d.ts', 'DaraForm.d.ts', 'types/FormField.d.ts', 'types/FormOptions.d.ts', 'index.html']) {
  assert.ok(existsSync(new URL(`../dist/${name}`, import.meta.url)), name);
}
for (const name of ['index.js', 'index.min.js', 'index.cjs', 'index.min.cjs', 'daracl.form.umd.js', 'daracl.form.min.umd.js']) {
  const map = JSON.parse(readFileSync(new URL(`../dist/${name}.map`, import.meta.url), 'utf8'));
  assert.ok(map.sources.length > 0, `${name} sourcemap`);
}
console.log('Package smoke passed: ES/CJS/UMD, CSS, declarations and sourcemaps');
