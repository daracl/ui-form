import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/browser/fixture.html');
  await page.waitForFunction(() => window.DaraForm);
});

test('sparse nested fields render without mutating caller options; inputs validate and serialize', async ({ page }) => {
  const initial = await page.evaluate(() => {
    const options = { fields: [{ name: 'hidden', renderType: 'hidden', defaultValue: 'saved' }, , null, { name: 'group', renderType: 'group', children: [{ name: 'name', label: 'Name', required: true }, , undefined] }] };
    window.form = window.DaraForm.create(document.querySelector('#form'), options);
    return { fields: window.form.getFields().length, original: options.fields.length, sparse: !(1 in options.fields), valid: window.form.isValidForm() };
  });
  expect(initial).toEqual({ fields: 2, original: 4, sparse: true, valid: false });
  await page.locator('#form input[name="df_name"]').fill('Alice');
  await page.locator('#form input[name="df_name"]').blur();
  const result = await page.evaluate(async () => ({ values: await window.form.getValue(true), data: Object.fromEntries(await window.form.getFormDataValue(true)) }));
  expect(result.values).toEqual({ hidden: 'saved', group: null, name: 'Alice' });
  expect(result.data).toEqual({ hidden: 'saved', group: 'null', name: 'Alice' });
});

test('dynamic group addition tolerates empty children and removal cleans up values', async ({ page }) => {
  const result = await page.evaluate(() => {
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [] });
    form.addField({ name: 'group', renderType: 'group', children: [{ name: 'child', label: 'Child' }, , undefined] });
    form.setFieldValue('child', 'value');
    const before = { ...form.getValue() };
    form.removeField('group');
    return { before, after: form.getValue(), fields: form.getFields().length, inputs: document.querySelectorAll('#form input').length };
  });
  expect(result).toEqual({ before: { group: null, child: 'value' }, after: {}, fields: 0, inputs: 0 });
});

test('setFields replaces rendered fields and removes stale values', async ({ page }) => {
  const result = await page.evaluate(() => {
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [{ name: 'old', label: 'Old' }] });
    form.setFieldValue('old', 'obsolete');
    form.getValue();
    form.setFields([undefined, { name: 'new', label: 'New' }]);
    return { values: form.getValue(), inputs: Array.from(document.querySelectorAll('#form input'), input => input.name), fields: form.getFields().map(field => field.name) };
  });
  expect(result).toEqual({ values: { new: '' }, inputs: ['df_new'], fields: ['new'] });
});

test('numeric option values including zero render and can be selected', async ({ page }) => {
  await page.evaluate(() => {
    const list = [{ label: 'Zero', value: 0 }, { label: 'One', value: 1 }];
    window.form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'dropdown', label: 'Dropdown', renderType: 'dropdown', listItem: { list } },
      { name: 'radio', label: 'Radio', renderType: 'radio', listItem: { list } },
      { name: 'checkbox', label: 'Checkbox', renderType: 'checkbox', listItem: { list } },
    ] });
  });
  await page.locator('select[name="df_dropdown"]').selectOption('0');
  await page.locator('input[name="df_radio"][value="0"]').check();
  await page.locator('input[name="df_checkbox"][value="0"]').check();
  const values = await page.evaluate(() => window.form.getValue());
  expect(values.dropdown).toBe('0');
  expect(values.radio).toBe('0');
  expect(values.checkbox).toContain('0');
});

test('grid round trips zero and false values and supports adding/removing rows', async ({ page }) => {
  await page.evaluate(() => {
    window.form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'grid', label: 'Grid', renderType: 'grid', children: [{ name: 'amount', label: 'Amount', renderType: 'number' }, { name: 'flag', label: 'Flag' }] },
    ] });
    window.form.setValue({ grid: [{ amount: 0, flag: false }] });
  });
  expect(await page.evaluate(() => window.form.getValue().grid)).toEqual([{ amount: '0', flag: 'false' }]);
  await page.locator('.df-grid-row-remove').click();
  expect(await page.evaluate(() => window.form.getValue().grid)).toEqual([]);
  await page.evaluate(() => window.form.getField('grid').$instance.addRow({ amount: 2, flag: 'again' }));
  expect(await page.evaluate(() => window.form.getValue().grid)).toEqual([{ amount: '2', flag: 'again' }]);
});

test('date selection calls the configured callback and stores the selected value', async ({ page }) => {
  const result = await page.evaluate(() => {
    const selected = [];
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'date', label: 'Date', renderType: 'date', rendererOptions: { onSelect: value => selected.push(value) } },
    ] });
    form.getField('date').rendererOptions.onSelect('2026-10-29', new Event('change'));
    return { selected, value: form.getValue().date };
  });
  expect(result).toEqual({ selected: ['2026-10-29'], value: '2026-10-29' });
});

test('instance lookup, subscriptions and destroy preserve independent form lifecycles', async ({ page }) => {
  const result = await page.evaluate(() => {
    const element = document.querySelector('#form');
    const form = window.DaraForm.create(element, { fields: [{ name: 'name', label: 'Name' }] });
    const lookup = window.DaraForm.instance(element) === form;
    let calls = 0;
    const unsubscribe = form.subscribe(() => calls++);
    form.setFieldValue('name', 'first');
    const notified = calls;
    unsubscribe();
    form.setFieldValue('name', 'second');
    const stopped = calls === notified;
    form.destroy();
    const removed = !window.DaraForm.instance(element);
    const replacement = window.DaraForm.create(element, { fields: [] });
    return { lookup, notified, stopped, removed, replaced: window.DaraForm.instance(element) === replacement };
  });
  expect(result.lookup).toBe(true);
  expect(result.notified).toBeGreaterThan(0);
  expect(result.stopped).toBe(true);
  expect(result.removed).toBe(true);
  expect(result.replaced).toBe(true);
});


test('tabs switch, retain panel values and reset defaults', async ({ page }) => {
  await page.evaluate(() => {
    window.form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'tabs', label: 'Tabs', renderType: 'tab', children: [
        { name: 'one', label: 'One', renderType: 'group', children: [{ name: 'name', label: 'Name', defaultValue: 'initial' }] },
        { name: 'two', label: 'Two', renderType: 'group', children: [{ name: 'city', label: 'City', defaultValue: 'Seoul' }] },
      ] },
    ] });
    window.form.setValue({ tabs: { one: { name: 'changed' }, two: { city: 'Busan' } } });
  });
  await page.locator('.df-tab-item').filter({ hasText: 'Two' }).click();
  await expect(page.locator('.df-tab-item.active')).toHaveText('Two');
  expect(await page.locator('input[name="df_city"]').inputValue()).toBe('Busan');
  await page.evaluate(() => window.form.resetForm());
  expect(await page.evaluate(() => window.form.getValue().tabs.two.city)).toBe('Seoul');
  expect(await page.evaluate(() => window.form.getValue().tabs.one.name)).toBe('initial');
});

test('file uploads serialize and reset without retaining removed files', async ({ page }) => {
  await page.evaluate(() => {
    window.form = window.DaraForm.create(document.querySelector('#form'), { fields: [{ name: 'file', label: 'File', renderType: 'file' }] });
  });
  await page.locator('input[type=file]').setInputFiles({ name: 'sample.txt', mimeType: 'text/plain', buffer: Buffer.from('sample') });
  const uploaded = await page.evaluate(() => ({
    names: window.form.getValue().file.map(file => file.name),
    data: window.form.getFormDataValue().getAll('file').map(file => file.name),
  }));
  expect(uploaded).toEqual({ names: ['sample.txt'], data: ['sample.txt'] });
  await page.evaluate(() => window.form.resetForm());
  expect(await page.evaluate(() => window.form.getValue().file.length)).toBe(0);
});

test('conditional visibility and disabled inputs react to field changes', async ({ page }) => {
  await page.evaluate(() => {
    window.form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'toggle', label: 'Toggle' },
      { name: 'detail', label: 'Detail', conditional: { field: 'toggle', eq: 'yes' } },
    ] });
  });
  await expect(page.locator('input[name="df_detail"]')).toBeHidden();
  await page.evaluate(() => window.form.setFieldValue('toggle', 'yes'));
  await expect(page.locator('input[name="df_detail"]')).toBeVisible();
  await page.evaluate(() => window.form.setFieldDisabled('detail', true));
  await expect(page.locator('input[name="df_detail"]')).toBeDisabled();
});

for (const file of ['index.js', 'index.min.js', 'daracl.form.umd.js', 'daracl.form.min.umd.js']) {
  test(file + ': built package creates sparse forms and replaces fields', async ({ page }) => {
    if (file.includes('.umd.')) await page.addScriptTag({ url: '/dist/' + file });
    const result = await page.evaluate(async file => {
      const Form = file.includes('.umd.') ? window.Daracl.form : (await import('/dist/' + file)).DaraForm;
      const form = Form.create(document.querySelector('#form'), { fields: [
        { name: 'hidden', renderType: 'hidden', defaultValue: 'saved' }, , undefined,
        { name: 'choice', label: 'Choice', renderType: 'checkbox', listItem: { list: [{ label: 'Zero', value: 0 }] } },
      ] });
      const original = form.getValue().hidden;
      form.setFields([undefined, { name: 'new', label: 'New', defaultValue: 'fresh' }]);
      return { original, values: form.getValue(), inputs: document.querySelectorAll('#form input').length };
    }, file);
    expect(result).toEqual({ original: 'saved', values: { new: 'fresh' }, inputs: 1 });
  });
}
