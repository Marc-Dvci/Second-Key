import { expect, test } from '@playwright/test';
import { calmAnswers, makeRequest, pairPhones, phones, scamAnswers } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await page.goto('demo.html');
  await pairPhones(page);
});

test('a safe-account request briefs the second key with the fake bank adviser script', async ({ page }) => {
  const { parent, key } = phones(page);
  await makeRequest(parent, { amount: '8400', payee: 'Account protection service', kind: /safe/, answers: scamAnswers });
  const briefing = key.getByRole('region', { name: 'Scam check' });
  await expect(briefing.getByRole('heading', { name: 'The fake bank adviser' })).toBeVisible();
  await expect(briefing).toContainText('Who gave you this account number?');
  await expect(briefing).toContainText('Also: someone posing as your bank');

  await key.getByRole('button', { name: 'Call Anne · +33 6 12 34 56 78' }).click();
  await expect(page.locator('#call')).toContainText('Tom is calling Anne');
  await expect(page.locator('#call')).toContainText('number saved at pairing');
});

test('an ordinary payment says no known script matched', async ({ page }) => {
  const { parent, key } = phones(page);
  await makeRequest(parent, { amount: '250', payee: 'Martin Plumbing', kind: /A business I chose myself/, answers: calmAnswers });
  await expect(key.getByRole('heading', { name: 'No known scam script matched' })).toBeVisible();
});

test('a request from another pairing is refused', async ({ page }) => {
  const { key } = phones(page);
  const foreign = await page.evaluate(() => {
    const req = {
      v: 1, pairId: 'someoneElse', id: 'abc123', amountCents: 50000, currency: 'EUR', payee: 'X',
      payeeKind: 'business_chosen', answers: { contactedFirst: false, hurry: false, authority: false, secrecy: false },
      createdAt: new Date().toISOString(),
    };
    const bytes = new TextEncoder().encode(JSON.stringify(req));
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return '#req=' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  });
  await page.evaluate((h) => {
    (document.getElementById('key') as HTMLIFrameElement).contentWindow!.location.hash = h;
  }, foreign);
  await expect(key.getByRole('heading', { name: 'This request is not from Anne’s phone' })).toBeVisible();
});

test('outside the demo the call button dials the saved number', async ({ page }) => {
  const { parent, key } = phones(page);
  await makeRequest(parent, { amount: '250', payee: 'Martin Plumbing', kind: /A business I chose myself/, answers: calmAnswers });
  await expect(key.getByRole('heading', { name: /approve a payment/ })).toBeVisible();
  // Open the second key's phone on its own, as a real phone would.
  await page.goto('./?device=key');
  const reqId = await page.evaluate(() => JSON.parse(localStorage.getItem('sk:key:requests')!)[0].id);
  await page.goto(`./?device=key#/review/${reqId}`);
  await expect(page.getByRole('link', { name: /Call Anne/ })).toHaveAttribute('href', 'tel:+33612345678');
});
