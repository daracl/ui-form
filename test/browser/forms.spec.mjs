import { test, expect } from '@playwright/test';

for (const example of ['index', 'renderer', 'selectbox-multi', 'sub-group', 'tab', 'grid']) {
  test(`${example}: renders and supports value, validation and reset APIs`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/uitest/${example}.html`);
    await expect.poll(async () => errors.length ? errors.join('\n') : page.evaluate(() => window.formBuilder ? 'ready' : 'waiting')).toBe('ready');
    expect(await page.locator('.daracl-form').count()).toBeGreaterThan(0);
    expect(await page.locator('.df-row').count()).toBeGreaterThan(0);
    const result = await page.evaluate(() => {
      const form = window.formBuilder;
      const values = form.getValue();
      form.setValue(values, false);
      const valid = form.isValidForm();
      form.resetForm();
      return { validType: typeof valid, valueType: typeof form.getValue() };
    });
    expect(result).toEqual({ validType: 'boolean', valueType: 'object' });
    expect(errors).toEqual([]);
  });
}
