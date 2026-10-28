const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const Module = require('node:module');

// Compile the actual adapter while resolving core from the installed package.
const output = buildSync({
  entryPoints: ['src/util/utils.ts'], bundle: true, platform: 'node',
  format: 'cjs', write: false,
}).outputFiles[0].text;
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(output, __filename);
const utils = compiled.exports;

test('blank, nil and numeric checks retain form semantics', () => {
  for (const value of [null, undefined, '', ' \t\n']) assert.equal(utils.isBlank(value), true);
  for (const value of [0, false, [], {}]) assert.equal(utils.isBlank(value), false);
  assert.equal(utils.isEmpty(''), false);
  assert.equal(utils.isEmpty([]), false);
  assert.equal(utils.isEmpty(null), true);
  for (const value of ['12', '0x10', 0, true, Infinity]) assert.equal(utils.isNumber(value), true);
  for (const value of ['', ' ', null, undefined, '12px', NaN]) assert.equal(utils.isNumber(value), false);
});

test('own properties work with null prototypes and shadowed methods', () => {
  const value = Object.assign(Object.create(null), { field: 1 });
  assert.equal(utils.hasOwnProp(value, 'field'), true);
  assert.equal(utils.hasOwnProp({ hasOwnProperty: false }, 'hasOwnProperty'), true);
  assert.equal(utils.hasOwnProp({}, 'toString'), false);
  assert.equal(utils.hasOwnProp(null, 'field'), false);
});

test('merge combines form options without mutating sources', () => {
  const callback = () => {};
  const defaults = { style: { width: '100%', labelWidth: 3 }, fields: [], callback };
  const options = { style: { labelWidth: 4 }, fields: [{ name: 'email' }] };
  const result = utils.merge({}, defaults, options);
  assert.deepEqual(result.style, { width: '100%', labelWidth: 4 });
  assert.deepEqual(result.fields, [{ name: 'email' }]);
  assert.equal(result.callback, callback);
  result.fields[0].name = 'changed';
  assert.equal(options.fields[0].name, 'email');
  assert.equal(defaults.style.labelWidth, 3);
  assert.equal(utils.merge(null, options), null);
  assert.deepEqual(utils.merge({}, { _excludeKeys: ['name'], name: 'field' }), { _excludeKeys: ['name'], name: 'field' });
});

test('merge excludes prototype pollution keys', () => {
  const result = utils.merge({}, JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"name":"safe"}'));
  assert.equal({}.polluted, undefined);
  assert.equal(result.name, 'safe');
  assert.equal(Object.hasOwn(result, '__proto__'), false);
  assert.equal(Object.hasOwn(result, 'constructor'), false);
});

test('field prefix hashes retain their values and return types', () => {
  assert.equal(utils.getHashCode(''), 0);
  assert.equal(utils.getHashCode('abc'), '96354');
  assert.equal(utils.getHashCode('hello world'), '1794106052');
  assert.equal(utils.getHashCode('zzzzzz'), '_685785664');
  assert.equal(utils.getHashCode('\u{1F600}'), '1772899');
});

test('form escaping remains available', () => {
  const text = '<input name="a&b">';
  assert.equal(utils.replaceXss('&<>"\''), '&amp;&lt;&gt;&quot;&#39;');
  assert.equal(utils.replaceXss(''), '');
  assert.equal(utils.unReplace(''), '');
  assert.equal(utils.unReplace(utils.replaceXss(text)), text);
  assert.equal(utils.getXssFieldName({ name: 'a&b' }), 'df_a_b');
  assert.equal(utils.getXssFieldName({ name: '&<>"\'' }), 'df______');
});
