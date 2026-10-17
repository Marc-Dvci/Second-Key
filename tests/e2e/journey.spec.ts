import { expect, test } from '@playwright/test';
import { approveAndReadCode, calmAnswers, makeRequest, pairPhones, phones } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await page.goto('demo.html');
  await pairPhones(page);
});

test('a request travels to the second key and the code read back turns the key', async ({ page }) => {
  const { parent, key } = phones(page);
  await makeRequest(parent, { amount: '250', payee: 'Martin Plumbing', kind: /A business I chose myself/, answers: calmAnswers });

  await expect(parent.getByRole('heading', { name: 'Wait for Tom to call you' })).toBeVisible();
  await expect(key.getByRole('heading', { name: 'Anne is asking you to approve a payment' })).toBeVisible();
  await expect(key.getByText('€250', { exact: true })).toBeVisible();

  const show = key.getByRole('button', { name: 'Show the code' });
  await expect(show).toBeDisabled();
  const code = await approveAndReadCode(key);
  expect(code).toMatch(/^\d{6}$/);

  // The parent's phone never displays the code.
  await expect(parent.locator('body')).not.toContainText(code);

  await parent.getByLabel(/The code Tom reads to you/).fill(code);
  await parent.getByRole('button', { name: 'Check the code' }).click();
  await expect(parent.getByRole('heading', { name: 'Second key turned' })).toBeVisible();
});

test('a code made for a tampered link does not unlock the real request', async ({ page }) => {
  const { parent, key } = phones(page);
  await makeRequest(parent, { amount: '250', payee: 'Martin Plumbing', kind: /A business I chose myself/, answers: calmAnswers });
  await expect(key.getByRole('heading', { name: /approve a payment/ })).toBeVisible();

  // Someone edits the amount in the link before the second key opens it.
  const tampered = await page.evaluate(() => {
    const [req] = JSON.parse(localStorage.getItem('sk:parent:requests')!);
    const { status, attemptsLeft, decidedAt, scripts, ...request } = req;
    void status, attemptsLeft, decidedAt, scripts;
    const bytes = new TextEncoder().encode(JSON.stringify({ ...request, id: request.id, amountCents: 2500000 }));
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return '#req=' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  });
  const open = (hash: string) =>
    page.evaluate((h) => {
      (document.getElementById('key') as HTMLIFrameElement).contentWindow!.location.hash = h;
    }, hash);

  // If the second key already saw the real request, the changed copy is refused outright.
  await open(tampered);
  await expect(key.getByRole('heading', { name: 'This request has been changed' })).toBeVisible();

  // If the changed copy arrives first, its code still cannot unlock the real request.
  await page.evaluate(() => localStorage.removeItem('sk:key:requests'));
  await open('#/home');
  await open(tampered);
  await expect(key.getByText('€25,000', { exact: true })).toBeVisible();
  const code = await approveAndReadCode(key);

  await parent.getByLabel(/The code Tom reads to you/).fill(code);
  await parent.getByRole('button', { name: 'Check the code' }).click();
  await expect(parent.getByText('That code does not match')).toBeVisible();
  await expect(parent.getByRole('heading', { name: 'Second key turned' })).toHaveCount(0);
});
