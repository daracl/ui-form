import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/browser/fixture.html');
  await page.waitForFunction(() => window.DaraForm);
});

test('view mode locks choice and action controls and restores their disabled state', async ({ page }) => {
  const result = await page.evaluate(() => {
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'choice', label: 'Choice', renderType: 'checkbox', listItem: { list: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true }] } },
      { name: 'select', label: 'Select', renderType: 'dropdown', listItem: { list: [{ value: 'a', label: 'A' }] } },
      { name: 'action', label: 'Action', renderType: 'button' },
    ] });
    form.changeMode('view');
    const inView = [...document.querySelectorAll('.df-checkbox, .df-dropdown, .df-field-container > button')].map(el => el.disabled);
    form.setFieldItems('choice', [{ value: 'c', label: 'C' }]);
    const newItemDisabled = document.querySelector('.df-checkbox').disabled;
    form.changeMode('modify');
    const afterEdit = [...document.querySelectorAll('.df-checkbox, .df-dropdown, .df-field-container > button')].map(el => el.disabled);
    return { inView, newItemDisabled, afterEdit };
  });
  expect(result).toEqual({ inView: [true, true, true, true], newItemDisabled: true, afterEdit: [false, false, false] });
});

test('changing an unrelated field skips indexed conditions', async ({ page }) => {
  const result = await page.evaluate(() => {
    let customChecks = 0;
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'toggle', label: 'Toggle' },
      { name: 'other', label: 'Other' },
      { name: 'detail', label: 'Detail', conditional: { field: 'toggle', eq: 'yes' } },
      { name: 'custom', label: 'Custom', conditional: { custom: () => { customChecks++; return true; } } },
    ] });
    let toggleReads = 0;
    const toggle = form.getField('toggle').$instance;
    const originalGetValue = toggle.getValue.bind(toggle);
    toggle.getValue = () => { toggleReads++; return originalGetValue(); };
    form.setFieldValue('other', 'x');
    const unrelated = { toggleReads, customChecks };
    form.setFieldValue('toggle', 'yes');
    return { unrelated, toggleReads, visible: !form.getField('detail').$instance.getElement().closest('.df-hidden') };
  });
  expect(result.unrelated.toggleReads).toBe(0);
  expect(result.unrelated.customChecks).toBeGreaterThan(0);
  expect(result.toggleReads).toBeGreaterThan(0);
  expect(result.visible).toBe(true);
});

test('a file batch skips duplicates and allows adding a removed file again', async ({ page }) => {
  const result = await page.evaluate(() => {
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'files', label: 'Files', renderType: 'file' },
    ] });
    const renderer = form.getField('files').$instance;
    const first = new File(['x'], 'same.txt', { type: 'text/plain' });
    const second = new File(['y'], 'same.txt', { type: 'text/plain' });
    renderer.addFiles([first, second]);
    const afterBatch = document.querySelectorAll('.df-file-item').length;
    document.querySelector('.df-file-remove').click();
    renderer.addFiles([first]);
    return { afterBatch, afterReadd: document.querySelectorAll('.df-file-item').length, uploads: form.getValue().files.length };
  });
  expect(result).toEqual({ afterBatch: 1, afterReadd: 1, uploads: 1 });
});

test('file sizes use MB by default and the configured display unit', async ({ page }) => {
  const result = await page.evaluate(() => {
    const defaultForm = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'files', label: 'Files', renderType: 'file' },
    ] });
    defaultForm.setFieldItems('files', [
      { fileId: 1, fileName: 'saved.txt', fileSize: 1048576 },
      { fileId: 2, fileName: 'unknown.txt' },
    ]);
    const defaultSizes = [...document.querySelectorAll('#form .df-file-size')].map(el => el.textContent);
    const secondHost = document.createElement('div');
    document.body.append(secondHost);
    const kbForm = window.DaraForm.create(secondHost, { fields: [
      { name: 'files', label: 'Files', renderType: 'file', rendererOptions: { sizeUnit: 'kb' } },
    ] });
    kbForm.setFieldItems('files', [{ fileId: 3, fileName: 'stored.txt', fileSize: '1536' }]);
    kbForm.getField('files').$instance.addFiles([new File([new Uint8Array(2048)], 'new.txt')]);
    const kbSizes = [...secondHost.querySelectorAll('.df-file-size')].map(el => el.textContent);
    return { defaultSizes, kbSizes, missingSize: document.querySelectorAll('#form .df-file-item')[1].querySelector('.df-file-size') === null };
  });
  expect(result).toEqual({ defaultSizes: ['1.00 MB'], kbSizes: ['1.50 KB', '2.00 KB'], missingSize: true });
});

test('조건이 거짓인 그룹과 파일 필드는 모든 값 경로에서 제외된다', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'toggle', label: 'Toggle' },
      { name: 'group', label: 'Group', renderType: 'group', conditional: { field: 'toggle', eq: 'yes' }, children: [{ name: 'child', label: 'Child' }] },
      { name: 'files', label: 'Files', renderType: 'file', conditional: { field: 'toggle', eq: 'yes' } },
    ] });
    form.setValue({ toggle: 'yes', child: 'saved', files: [{ fileId: 3, fileName: 'old.txt', fileSize: 2 }], extra: 'kept' });
    const visible = form.getValue();
    form.setFieldValue('toggle', 'no');
    const plain = form.getValue();
    const validated = await form.getValue(true);
    const data = Object.fromEntries(await form.getFormDataValue(true));
    plain.extra = 'changed';
    return { visible, plainKeys: Object.keys(plain), validated, data, afterMutation: form.getValue().extra };
  });
  expect(result.visible.child).toBe('saved');
  expect(result.plainKeys.sort()).toEqual(['extra', 'toggle']);
  expect(result.validated).toEqual({ toggle: 'no', extra: 'kept' });
  expect(result.data).toEqual({ toggle: 'no', extra: 'kept' });
  expect(result.afterMutation).toBe('kept');
});

test('파일명은 텍스트로 표시하고 파일 옵션과 삭제 훅을 적용한다', async ({ page }) => {
  const initial = await page.evaluate(() => {
    window.removals = 0;
    window.changes = 0;
    window.allowRemove = false;
    window.form = window.DaraForm.create(document.querySelector('#form'), { fields: [{ name: 'files', label: 'Files', renderType: 'file',
      listItem: { valueField: 'id', labelField: 'title' },
      rendererOptions: { buttonLabel: '첨부 선택', multiple: false, accept: ['.txt'], onRemove: () => { window.removals++; return window.allowRemove; } },
      onChange: () => { window.changes++; },
    }] });
    window.form.setValue({ files: [{ id: 7, title: '<img src=x onerror=alert(1)>.txt', fileSize: 1 }] });
    return { name: document.querySelector('.df-file-name').textContent, imageCount: document.querySelectorAll('.df-file-name img').length,
      label: document.querySelector('.df-file-button-text').textContent, multiple: document.querySelector('input[type=file]').multiple,
      accept: document.querySelector('input[type=file]').accept, downloadable: !!document.querySelector('.df-file-download') };
  });
  expect(initial).toEqual({ name: '<img src=x onerror=alert(1)>.txt', imageCount: 0, label: '첨부 선택', multiple: false, accept: '.txt', downloadable: true });
  await page.locator('.df-file-remove').click();
  expect(await page.evaluate(() => ({ count: document.querySelectorAll('.df-file-item').length, removeIds: window.form.getValue().filesRemoveIds, removals: window.removals }))).toEqual({ count: 1, removeIds: [], removals: 1 });
  await page.evaluate(() => { window.allowRemove = true; });
  await page.locator('.df-file-remove').click();
  expect(await page.evaluate(() => ({ count: document.querySelectorAll('.df-file-item').length, removeIds: window.form.getValue().filesRemoveIds, changes: window.changes }))).toEqual({ count: 0, removeIds: [7], changes: 1 });
});

test('같은 파일을 다시 고를 수 있고 제한 위반은 검증을 막는다', async ({ page }) => {
  await page.evaluate(() => {
    window.form = window.DaraForm.create(document.querySelector('#form'), { fields: [{ name: 'files', label: 'Files', renderType: 'file', rule: { maxFileSize: 3, maxFiles: 1, accept: ['.txt'] } }] });
  });
  const input = page.locator('input[type=file]');
  await input.setInputFiles({ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('ab') });
  await page.locator('.df-file-remove').click();
  await input.setInputFiles({ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('ab') });
  expect(await page.locator('.df-file-item').count()).toBe(1);
  await input.setInputFiles({ name: 'large.txt', mimeType: 'text/plain', buffer: Buffer.from('abcd') });
  await expect(page.locator('.df-help-message')).toContainText('파일 크기');
  expect(await page.evaluate(() => window.form.getValue(true).then(() => false, () => true))).toBe(true);
  const data = await page.evaluate(() => window.form.getFormDataValue().getAll('files').map(file => file.name));
  expect(data).toEqual(['a.txt', 'large.txt']);
});

test('비활성 및 보기 모드에서 파일 삭제를 막고 설명은 텍스트로 삽입한다', async ({ page }) => {
  await page.evaluate(() => {
    window.form = window.DaraForm.create(document.querySelector('#form'), { fields: [{ name: 'files', label: 'Files', renderType: 'file' }, { name: 'text', label: 'Text' }] });
    window.form.setValue({ files: [{ fileId: 2, fileName: 'old.txt', fileSize: 1 }] });
    window.form.setFieldDisabled('files', true);
    window.form.setFieldDescription('text', '<b>x</b>');
  });
  await expect(page.locator('input[type=file]')).toBeDisabled();
  await expect(page.locator('.df-file-remove')).toBeHidden();
  expect(await page.evaluate(() => ({ disabled: window.form.setFieldDisabled('missing', true), description: window.form.setFieldDescription('missing', 'x'), markup: document.querySelector('.df-description').innerHTML }))).toEqual({ disabled: false, description: false, markup: '&lt;b&gt;x&lt;/b&gt;' });
  await page.evaluate(() => { window.form.setFieldDisabled('files', false); window.form.changeMode('view'); });
  await expect(page.locator('input[type=file]')).toBeDisabled();
  await expect(page.locator('.df-file-remove')).toBeHidden();
  await expect(page.locator('.df-file-download')).toBeVisible();
});

test('조건 반전과 삭제 ID FormData 반복 항목이 동작한다', async ({ page }) => {
  const result = await page.evaluate(() => {
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'toggle', label: 'Toggle' },
      { name: 'detail', label: 'Detail', conditional: { show: false, field: 'toggle', eq: 'yes' } },
      { name: 'files', label: 'Files', renderType: 'file' },
    ] });
    form.setValue({ toggle: 'yes', files: [{ fileId: 7, fileName: 'a.txt', fileSize: 1 }, { fileId: 8, fileName: 'b.txt', fileSize: 1 }] });
    const hidden = !('detail' in form.getValue());
    form.setFieldValue('toggle', 'no');
    const shown = 'detail' in form.getValue();
    document.querySelectorAll('.df-file-remove').forEach(element => element.click());
    return { hidden, shown, ids: form.getFormDataValue().getAll('filesRemoveIds') };
  });
  expect(result).toEqual({ hidden: true, shown: true, ids: ['7', '8'] });
});
