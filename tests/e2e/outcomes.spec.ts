import { expect, test } from '@playwright/test';
import { approveAndReadCode, calmAnswers, makeRequest, pairPhones, phones, scamAnswers } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await page.goto('demo.html');
  await pairPhones(page);
});

test('a refusal stops the payment on both phones', async ({ page }) => {
  const { parent, key } = phones(page);
  await makeRequest(parent, { amount: '8400', payee: 'Account protection service', kind: /safe/, answers: scamAnswers });
  await key.getByRole('button', { name: 'I don’t agree' }).click();
  await expect(key.getByRole('heading', { name: 'You said no' })).toBeVisible();
  await expect(key.getByText('Do not send the money.')).toBeVisible();

  await parent.getByRole('button', { name: 'Tom said no' }).click();
  await expect(parent.getByRole('heading', { name: 'Do not send the money' })).toBeVisible();
  await expect(parent.getByText('Call your bank on the number on the back of your card.')).toBeVisible();
});

test('three wrong codes lock the request', async ({ page }) => {
  const { parent, key } = phones(page);
  await makeRequest(parent, { amount: '250', payee: 'Martin Plumbing', kind: /A business I chose myself/, answers: calmAnswers });
  const real = await approveAndReadCode(key);
  const wrong = String((Number(real) + 1) % 1_000_000).padStart(6, '0');
  const input = parent.getByLabel(/The code Tom reads to you/);
  const check = parent.getByRole('button', { name: 'Check the code' });

  await input.fill(wrong);
  await check.click();
  await expect(parent.getByRole('alert')).toHaveText('That code does not match. 2 tries left.');
  await input.fill(wrong);
  await check.click();
  await expect(parent.getByRole('alert')).toHaveText('That code does not match. 1 try left.');
  await input.fill(wrong);
  await check.click();
  await expect(parent.getByRole('heading', { name: 'Do not send the money' })).toBeVisible();
  await expect(parent.getByText('Three codes did not match')).toBeVisible();

  // Even the right code no longer opens a locked request.
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('sk:parent:requests')!)[0].id;
    (document.getElementById('parent') as HTMLIFrameElement).contentWindow!.location.hash = `#/wait/${id}`;
  });
  await expect(parent.getByRole('heading', { name: 'Do not send the money' })).toBeVisible();
});

test('receipts list every outcome on both phones after a reload', async ({ page }) => {
  const { parent, key } = phones(page);
  await makeRequest(parent, { amount: '250', payee: 'Martin Plumbing', kind: /A business I chose myself/, answers: calmAnswers });
  const code = await approveAndReadCode(key);
  await parent.getByLabel(/The code Tom reads to you/).fill(code);
  await parent.getByRole('button', { name: 'Check the code' }).click();
  await parent.getByRole('button', { name: 'Done' }).click();
  await key.getByRole('button', { name: 'Done' }).click();

  await makeRequest(parent, { amount: '8400', payee: 'Account protection service', kind: /safe/, answers: scamAnswers });
  await key.getByRole('button', { name: 'I don’t agree' }).click();
  await parent.getByRole('button', { name: 'Tom said no' }).click();

  await page.reload();
  for (const [phone, link] of [[parent, 'My receipts'], [key, 'Receipts']] as const) {
    await phone.getByRole('link', { name: link, exact: true }).click();
    const rows = phone.locator('.receipts li');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('€8,400');
    await expect(rows.nth(0)).toContainText('Refused');
    await expect(rows.nth(0)).toContainText('Matched: The fake bank adviser');
    await expect(rows.nth(1)).toContainText('€250');
    await expect(rows.nth(1)).toContainText('Approved');
  }
});
