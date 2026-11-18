const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const Module = require('node:module');

const output = buildSync({ entryPoints: ['src/rule/fileValidator.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, tsconfig: 'tsconfig.json' }).outputFiles[0].text;
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(output, __filename);
const { fileValidator } = compiled.exports;

const field = (rule) => ({ name: 'attachments', renderType: 'file', rule });
const file = (name, size) => ({ name, size });

test('새 파일의 크기, 개수, 확장자를 검증한다', () => {
  const rule = { maxFileSize: 5, maxFiles: 1, accept: ['.png'] };
  assert.deepEqual(fileValidator(null, field(rule), [], [file('large.png', 6)]).constraint, ['maxFileSize']);
  assert.deepEqual(fileValidator(null, field(rule), [], [file('a.png', 1), file('b.png', 1)]).constraint, ['maxFiles']);
  assert.deepEqual(fileValidator(null, field(rule), [], [file('a.txt', 1)]).constraint, ['accept']);
  assert.equal(fileValidator(null, field(rule), [], [file('a.PNG', 5)]), true);
});

test('서버에 있는 파일은 새 파일 제한에서 제외한다', () => {
  const existing = [{ fileId: 7, fileName: 'old.png', fileSize: 100 }];
  assert.equal(fileValidator(null, field({ maxFileSize: 5, maxFiles: 1 }), existing, []), true);
});
