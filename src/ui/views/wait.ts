// The parent waits for the call and types the code the second key reads out.
import { releaseCode, sameCode } from '../../core/code.ts';
import { formatAmount } from '../../core/request.ts';
import { getRequest, saveRequest, type Pairing } from '../../state/storage.ts';
import { backLink, button, go, h, screen } from '../dom.ts';

export function renderWait(pairing: Pairing, id: string): void {
  const request = getRequest(id);
  if (!request) return go('#/home');
  if (request.status === 'approved') return go(`#/done/${id}`);

  const keyName = pairing.key.name;
  const error = h('p', { class: 'error', role: 'alert' });
  const input = h('input', {
    id: 'code',
    class: 'code-input',
    inputmode: 'numeric',
    autocomplete: 'one-time-code',
    maxlength: 6,
    pattern: '[0-9]*',
    'aria-describedby': 'code-help',
  });

  const check = async () => {
    const typed = input.value.replace(/\D/g, '');
    if (typed.length !== 6) return void (error.textContent = 'The code has six digits.');
    const current = getRequest(id)!;
    const expected = await releaseCode(pairing.secret, current);
    if (sameCode(typed, expected)) {
      saveRequest({ ...current, status: 'approved', decidedAt: new Date().toISOString() });
      return go(`#/done/${id}`);
    }
    input.value = '';
    error.textContent = 'That code does not match.';
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void check();
  });

  screen(
    `Wait for ${keyName} to call you`,
    'parent',
    backLink('Home', '#/home'),
    h('p', { class: 'request-line' }, `${formatAmount(request.amountCents)} to ${request.payee}`),
    h(
      'p',
      { class: 'warning' },
      `${keyName} will call you on this phone. Only ${keyName} has the code. If anyone else gives you a code or asks you for one, hang up.`,
    ),
    h('label', { for: 'code', id: 'code-help' }, `The code ${keyName} reads to you`),
    input,
    error,
    button('Check the code', () => void check()),
  );
  input.focus({ preventScroll: true });
}
