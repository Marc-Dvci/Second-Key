import { expect, type FrameLocator, type Page } from '@playwright/test';

export type Answers = { contactedFirst: boolean; hurry: boolean; authority: boolean; secrecy: boolean };

export const phones = (page: Page) => ({
  parent: page.frameLocator('#parent'),
  key: page.frameLocator('#key'),
});

/** Pairs the two demo phones as Anne (parent) and Tom (second key). */
export async function pairPhones(page: Page): Promise<void> {
  const { parent, key } = phones(page);
  await parent.getByRole('button', { name: 'I send the money' }).click();
  await parent.getByLabel('Your first name').fill('Anne');
  await parent.getByLabel('Your phone number').fill('+33 6 12 34 56 78');
  await parent.getByLabel('Your second key’s first name').fill('Tom');
  await parent.getByLabel('Their phone number').fill('+33 6 98 76 54 32');
  await parent.getByRole('button', { name: 'Next' }).click();
  await parent.getByRole('button', { name: 'Scan with Tom’s phone' }).click();
  await expect(key.getByRole('heading', { name: 'Become Anne’s second key?' })).toBeVisible();
  expect(await key.locator('.words').innerText()).toBe(await parent.locator('.words').innerText());
  await key.getByRole('button', { name: 'The words match' }).click();
  await parent.getByRole('button', { name: 'The words match on Tom’s phone' }).click();
  await expect(parent.getByRole('heading', { name: 'Hello, Anne' })).toBeVisible();
  await expect(key.getByRole('heading', { name: 'You are Anne’s second key' })).toBeVisible();
}

/** Walks the parent's request screens and presses "Send to …". */
export async function makeRequest(
  parent: FrameLocator,
  opts: { amount: string; payee: string; kind: RegExp; answers: Answers; keyName?: string },
): Promise<void> {
  await parent.getByRole('button', { name: 'Someone is asking me to send money' }).click();
  await parent.getByLabel('Amount').fill(opts.amount);
  await parent.getByLabel('Who would receive it').fill(opts.payee);
  await parent.getByRole('button', { name: 'Next' }).click();
  await parent.getByRole('button', { name: opts.kind }).click();
  for (const value of [opts.answers.contactedFirst, opts.answers.hurry, opts.answers.authority, opts.answers.secrecy]) {
    await parent.getByRole('button', { name: value ? 'Yes' : 'No', exact: true }).click();
  }
  await expect(parent.getByRole('heading', { name: 'Check before you send' })).toBeVisible();
  await parent.getByRole('button', { name: `Send to ${opts.keyName ?? 'Tom'}` }).click();
}

/** Reads the code from the second key's screen after ticking the call box. */
export async function approveAndReadCode(key: FrameLocator): Promise<string> {
  await key.getByRole('checkbox').check();
  await key.getByRole('button', { name: 'Show the code' }).click();
  const text = await key.locator('.code-display').innerText();
  return text.replace(/\D/g, '');
}

export const scamAnswers: Answers = { contactedFirst: true, hurry: true, authority: true, secrecy: true };
export const calmAnswers: Answers = { contactedFirst: false, hurry: false, authority: false, secrecy: false };
