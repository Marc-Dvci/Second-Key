import { expect, type FrameLocator, type Page } from '@playwright/test';

export type Answers = { contactedFirst: boolean; hurry: boolean; authority: boolean; secrecy: boolean };

export const phones = (page: Page) => ({
  parent: page.frameLocator('#parent'),
  key: page.frameLocator('#key'),
});

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
