import AxeBuilder from '@axe-core/playwright';
import { devices, expect, test, type Page } from '@playwright/test';

test.use({ ...devices['Pixel 7'] });

const violations = async (page: Page, screen: string) => {
  const { violations: found } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(found.map((v) => `${screen}: ${v.id} (${v.nodes.length})`)).toEqual([]);
};

test('every screen on both phones passes axe WCAG 2.2 AA checks', async ({ browser }) => {
  const anne = await (await browser.newContext({ ...devices['Pixel 7'] })).newPage();
  const tom = await (await browser.newContext({ ...devices['Pixel 7'] })).newPage();

  await anne.goto('./');
  await violations(anne, 'welcome');
  await anne.getByRole('button', { name: 'I send the money' }).click();
  await violations(anne, 'pair form');
  await anne.getByLabel('Your first name').fill('Anne');
  await anne.getByLabel('Your phone number').fill('+33 6 12 34 56 78');
  await anne.getByLabel('Your second key’s first name').fill('Tom');
  await anne.getByLabel('Their phone number').fill('+33 6 98 76 54 32');
  await anne.getByRole('button', { name: 'Next' }).click();
  await expect(anne.locator('.qr svg')).toBeVisible();
  await violations(anne, 'pair QR');

  await tom.goto((await anne.locator('.qr').getAttribute('data-link'))!);
  await expect(tom.getByRole('button', { name: 'The words match' })).toBeVisible();
  await violations(tom, 'pair confirm');
  await tom.getByRole('button', { name: 'The words match' }).click();
  await violations(tom, 'key home');
  await anne.getByRole('button', { name: 'The words match on Tom’s phone' }).click();
  await violations(anne, 'parent home');

  await anne.getByRole('button', { name: 'Someone is asking me to send money' }).click();
  await violations(anne, 'amount');
  await anne.getByLabel('Amount').fill('8400');
  await anne.getByLabel('Who would receive it').fill('Account protection service');
  await anne.getByRole('button', { name: 'Next' }).click();
  await violations(anne, 'payee type');
  await anne.getByRole('button', { name: /safe/ }).click();
  await violations(anne, 'question');
  for (let i = 0; i < 4; i++) await anne.getByRole('button', { name: 'Yes', exact: true }).click();
  await violations(anne, 'summary');

  // Capture the link instead of opening the text-message app.
  await anne.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (t: string) => ((window as unknown as { copied: string }).copied = t) } });
  });
  await anne.getByRole('button', { name: 'Copy the link instead' }).click();
  const link = await anne.evaluate(() => (window as unknown as { copied: string }).copied);
  await anne.goto(anne.url().replace(/#.*$/, '') + '#/home');
  await anne.getByRole('button', { name: /Waiting for Tom/ }).click();
  await violations(anne, 'wait');

  await tom.goto(link);
  await expect(tom.getByRole('heading', { name: /approve a payment/ })).toBeVisible();
  await violations(tom, 'review');
  await tom.getByRole('checkbox').check();
  await tom.getByRole('button', { name: 'Show the code' }).click();
  await violations(tom, 'code');
  const code = (await tom.locator('.code-display').innerText()).replace(/\D/g, '');

  await anne.getByLabel(/The code Tom reads to you/).fill(code);
  await anne.getByRole('button', { name: 'Check the code' }).click();
  await expect(anne.getByRole('heading', { name: 'Second key turned' })).toBeVisible();
  await violations(anne, 'turned');
  await anne.getByRole('button', { name: 'Done' }).click();
  await anne.getByRole('link', { name: 'My receipts' }).click();
  await violations(anne, 'receipts');
});
