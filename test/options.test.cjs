const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const Module = require('node:module');

function loadOptions() {
  const output = buildSync({ entryPoints: ['src/defaultOption.ts'], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
  const compiled = new Module(__filename, module);
  compiled.filename = __filename;
  compiled.paths = module.paths;
  compiled._compile(output, __filename);
  return compiled.exports;
}

test('sparse and null field slots are omitted recursively after core merging', () => {
  const { initFormOptions } = loadOptions();
  const input = { fields: [{ name: 'first' }, , undefined, null, { name: 'group', children: [{ name: 'child' }, , null] }] };
  const result = initFormOptions(input);
  assert.deepEqual(result.fields.map(field => field.name), ['first', 'group']);
  assert.deepEqual(result.fields[1].children.map(field => field.name), ['child']);
  assert.equal(input.fields.length, 5);
  assert.equal(1 in input.fields, false);
  assert.equal(input.fields[4].children.length, 3);
});

test('normalization keeps ordinary option data and isolates separate forms', () => {
  const { initFormOptions } = loadOptions();
  const input = { fields: [{ name: 'first', listItem: { list: [0, false, undefined, null] } }] };
  const first = initFormOptions(input);
  const second = initFormOptions(input);
  assert.deepEqual(first.fields[0].listItem.list, [0, false, undefined, null]);
  first.fields[0].$key = 'runtime-key';
  assert.equal(second.fields[0].$key, undefined);
  assert.equal(input.fields[0].$key, undefined);
});

test('default field lists and explicit null field lists are normalized', () => {
  const { initFormOptions, setDefaultOptions } = loadOptions();
  setDefaultOptions({ fields: [undefined, { name: 'default' }] });
  assert.deepEqual(initFormOptions({}).fields.map(field => field.name), ['default']);
  assert.deepEqual(initFormOptions({ fields: null }).fields, []);
});
