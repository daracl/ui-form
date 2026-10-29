const { test } = require('node:test');
const assert = require('node:assert/strict');

test('dev server has a restricted host and filesystem without disabling host validation', async () => {
  const { commonConfig, root } = await import('../vite.common.mjs');
  assert.equal(commonConfig.server.host, '127.0.0.1');
  assert.equal(commonConfig.preview.host, '127.0.0.1');
  assert.equal(commonConfig.server.fs.strict, true);
  assert.deepEqual(commonConfig.server.fs.allow, [root]);
  assert.notEqual(commonConfig.server.allowedHosts, true);
  assert.notEqual(commonConfig.server.cors, true);
});

test('dev server rejects untrusted hosts, cross-origin reads and files outside the project', async (t) => {
  const { createServer } = await import('vite');
  const { commonConfig, root } = await import('../vite.common.mjs');
  const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
  const { tmpdir } = require('node:os');
  const { join, resolve } = require('node:path');
  const directory = mkdtempSync(join(tmpdir(), 'daracl-vite-security-'));
  const outside = join(directory, 'sentinel.txt');
  writeFileSync(outside, 'must-not-be-served');
  const server = await createServer({
    ...commonConfig, root, configFile: false, logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { ...commonConfig.server, port: 0, open: false, watch: null },
  });
  t.after(async () => {
    await server.close();
    assert.ok(resolve(directory).startsWith(resolve(tmpdir(), 'daracl-vite-security-')));
    rmSync(directory, { recursive: true, force: true });
  });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const request = (path, headers = {}) => new Promise((done, reject) => {
    require('node:http').get(`${base}${path}`, { headers }, response => {
      response.resume();
      response.once('end', () => done(response));
    }).once('error', reject);
  });
  const page = await request('/uitest/index.html', { Origin: 'https://untrusted.invalid' });
  assert.equal(page.statusCode, 200);
  assert.equal(page.headers['access-control-allow-origin'], undefined);
  assert.equal((await request('/src/util/utils.ts')).statusCode, 200);
  assert.equal((await request('/', { Host: 'untrusted.invalid' })).statusCode, 403);
  // Some Windows path forms are rejected as missing before the access check.
  assert.ok([403, 404].includes((await request(`/@fs/${outside.replaceAll('\\', '/')}`)).statusCode));
});

test('ES/CJS externalizes peer subpaths while UMD remains standalone', async () => {
  const es = (await import('../vite.config.mjs')).default({ mode: 'production' });
  const umd = (await import('../vite.config.umd.mjs')).default({ mode: 'production' });
  const external = es.build.rollupOptions.external;
  for (const name of ['@daracl/core/utils', '@daracl/datetimepicker']) {
    assert.equal(external(name), true, name);
  }
  assert.equal(external('@daracl/core-other'), false);
  assert.equal(external('@daracl/datetimepicker/dist/daracl.datetimepicker.min.css'), false);
  assert.equal(umd.build.rollupOptions.external, undefined);
  assert.equal(es.build.emptyOutDir, false);
  assert.equal(umd.build.emptyOutDir, false);
});
