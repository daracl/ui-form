const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const Module = require('node:module');

const output = buildSync({
  entryPoints: ['src/util/styleUtils.ts'], bundle: true, platform: 'node',
  format: 'cjs', write: false, external: ['@daracl/datetimepicker'],
}).outputFiles[0].text;
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(output, __filename);
const { resolveFieldStyle } = compiled.exports;

test('shared class normalization preserves CSS widths and field layout', () => {
  const options = { style: { position: 'left-left', labelWidth: 3, valueWidth: 9 } };
  const field = { orientation: 'horizontal', style: { width: '50%', customClass: '  custom\t\n extra  ' } };
  const style = resolveFieldStyle(options, field);
  assert.equal(style.fieldClass, 'custom extra');
  assert.equal(style.fieldStyle, 'width:50%;');
  assert.equal(style.rowStyleClass, 'df-horizontal');
  assert.equal(style.labelClass, 'df-col-xs-3');
  assert.equal(style.valueClass, 'df-col-xs-9');
  assert.equal(field.style.customClass, '  custom\t\n extra  ');
});

test('numeric string widths still select grid columns', () => {
  const style = resolveFieldStyle(
    { style: { position: 'left-left', labelWidth: 3, valueWidth: 9 } },
    { style: { width: '6' } },
  );
  assert.equal(style.fieldClass, 'df-col-xs-6');
  assert.equal(style.fieldStyle, '');
});
