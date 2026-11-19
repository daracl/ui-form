import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/browser/fixture.html');
  await page.waitForFunction(() => window.DaraForm);
});

test('custom template text is safe by default and trusted HTML requires opt-in', async ({ page }) => {
  const result = await page.evaluate(() => {
    window.__securityTriggered = 0;
    const payload = '<img src=x onerror="window.__securityTriggered++">';
    window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'safe', label: 'Safe', renderType: 'custom', template: payload },
      { name: 'trusted', label: 'Trusted', renderType: 'custom', template: '<strong>OK</strong>', trustedTemplate: true },
    ] });
    return {
      safeText: document.querySelectorAll('.df-field')[0].textContent,
      imageCount: document.querySelectorAll('#form img').length,
      trustedTag: document.querySelectorAll('.df-field')[1].firstElementChild?.tagName,
      triggered: window.__securityTriggered,
    };
  });
  expect(result).toEqual({ safeText: '<img src=x onerror="window.__securityTriggered++">', imageCount: 0, trustedTag: 'STRONG', triggered: 0 });
});

test('선택지의 문구와 값은 HTML로 실행되지 않는다', async ({ page }) => {
  const result = await page.evaluate(() => {
    window.__securityTriggered = 0;
    const payload = '<img src=x onerror="window.__securityTriggered++">';
    const value = '"><img src=x onerror="window.__securityTriggered++">';
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'checkbox', label: 'Checkbox', renderType: 'checkbox', listItem: { list: [{ label: payload, value }] } },
      { name: 'radio', label: 'Radio', renderType: 'radio', listItem: { list: [{ label: payload, value }] } },
      { name: 'dropdown', label: 'Dropdown', renderType: 'dropdown', listItem: { list: [{ label: payload, value }] } },
    ] });
    form.setFieldItems('checkbox', [{ label: payload, value }]);
    form.setFieldItems('radio', [{ label: payload, value }]);
    form.setFieldItems('dropdown', [{ label: payload, value }]);
    return {
      images: document.querySelectorAll('#form img').length,
      labels: [...document.querySelectorAll('.df-field-item label')].map(element => element.textContent.trim()),
      values: [...document.querySelectorAll('.df-checkbox, .df-radio, .df-dropdown option:not([value=""])')].map(element => element.value),
      triggered: window.__securityTriggered,
    };
  });
  expect(result.images).toBe(0);
  expect(result.labels).toEqual([expect.stringContaining('<img'), expect.stringContaining('<img')]);
  expect(result.values).toHaveLength(3);
  expect(new Set(result.values).size).toBe(1);
  expect(result.triggered).toBe(0);
});

test('설명 툴팁 스타일과 검증 문구는 텍스트로 표시된다', async ({ page }) => {
  const result = await page.evaluate(() => {
    window.__securityTriggered = 0;
    const payload = '<img src=x onerror="window.__securityTriggered++">';
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'text', label: '<Unsafe>', tooltip: payload, description: payload, style: { customClass: `x\">${payload}` }, validator: () => ({ message: payload }) },
      { name: 'required', label: payload, required: true },
      { name: 'grid', label: 'Grid', renderType: 'grid', children: [{ name: 'child', label: payload, style: { width: `1\">${payload}` } }] },
    ] });
    form.setFieldValue('text', 'bad');
    form.getField('text').$instance.valid();
    form.getField('required').$instance.valid();
    return {
      images: document.querySelectorAll('#form img').length,
      description: document.querySelector('.df-description').textContent,
      tooltip: document.querySelector('.df-tooltip-text').textContent,
      validation: document.querySelector('.df-help-message').textContent,
      requiredMessage: document.querySelectorAll('.df-help-message')[1].textContent,
      gridHeader: document.querySelector('.df-grid-header').textContent,
      triggered: window.__securityTriggered,
    };
  });
  expect(result.images).toBe(0);
  expect(result.description).toContain('<img');
  expect(result.tooltip).toContain('<img');
  expect(result.validation).toContain('<img');
  expect(result.requiredMessage).toContain('<img');
  expect(result.gridHeader).toContain('<img');
  expect(result.triggered).toBe(0);
});

test('위험한 파일 URL은 열지 않고 다운로드 콜백으로 넘긴다', async ({ page }) => {
  const result = await page.evaluate(() => {
    window.__securityTriggered = 0;
    const form = window.DaraForm.create(document.querySelector('#form'), { fields: [
      { name: 'file', label: 'File', renderType: 'file', fileDownload: ({ file }) => { window.__downloadedFile = file.fileName; } },
    ] });
    form.setFieldItems('file', [{ fileId: 1, fileName: 'unsafe.txt', fileSize: 1, url: 'javascript:window.__securityTriggered++' }]);
    document.querySelector('.df-file-download').click();
    return { triggered: window.__securityTriggered, downloadedFile: window.__downloadedFile };
  });
  expect(result).toEqual({ triggered: 0, downloadedFile: 'unsafe.txt' });
});
