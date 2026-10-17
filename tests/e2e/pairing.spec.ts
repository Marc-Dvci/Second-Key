import { expect, test } from '@playwright/test';

test('two separate phones pair through the QR link and show the same words', async ({ browser }) => {
  const anne = await (await browser.newContext()).newPage();
  const tom = await (await browser.newContext()).newPage();

  await anne.goto('./');
  await expect(anne.getByRole('heading', { name: 'Two people, one payment' })).toBeVisible();
  await anne.getByRole('button', { name: 'I send the money' }).click();
  await anne.getByRole('button', { name: 'Next' }).click();
  await expect(anne.getByRole('alert')).toHaveText('Fill in all four lines.');
  await anne.getByLabel('Your first name').fill('Anne');
  await anne.getByLabel('Your phone number').fill('+33 6 12 34 56 78');
  await anne.getByLabel('Your second key’s first name').fill('Tom');
  await anne.getByLabel('Their phone number').fill('call me');
  await anne.getByRole('button', { name: 'Next' }).click();
  await expect(anne.getByRole('alert')).toContainText('Check the phone numbers');
  await anne.getByLabel('Their phone number').fill('+33 6 98 76 54 32');
  await anne.getByRole('button', { name: 'Next' }).click();

  // Outside the demo page there is no shortcut button: the camera opens the link.
  await expect(anne.getByRole('button', { name: /Scan with/ })).toHaveCount(0);
  const link = await anne.locator('.qr').getAttribute('data-link');
  expect(link).toContain('#pair=');
  await expect(anne.locator('.qr svg')).toBeVisible();

  await tom.goto(link!);
  await expect(tom.getByRole('heading', { name: 'Become Anne’s second key?' })).toBeVisible();
  expect(await tom.locator('.words').innerText()).toBe(await anne.locator('.words').innerText());
  await tom.getByRole('button', { name: 'The words match' }).click();
  await expect(tom.getByRole('heading', { name: 'You are Anne’s second key' })).toBeVisible();

  await anne.getByRole('button', { name: 'The words match on Tom’s phone' }).click();
  await expect(anne.getByRole('heading', { name: 'Hello, Anne' })).toBeVisible();
  await expect(anne.getByText('Your second key: Tom')).toBeVisible();

  // Reloading keeps the pairing on both phones.
  await anne.reload();
  await tom.reload();
  await expect(anne.getByRole('heading', { name: 'Hello, Anne' })).toBeVisible();
  await expect(tom.getByRole('heading', { name: 'You are Anne’s second key' })).toBeVisible();
});
