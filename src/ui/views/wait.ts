// The parent waits for the call and types the code the second key reads out.
import { releaseCode, sameCode } from '../../core/code.ts';
import { formatAmount } from '../../core/request.ts';
import { getRequest, saveRequest, type Pairing } from '../../state/storage.ts';
import { backLink, button, go, h, screen } from '../dom.ts';

export function renderWait(pairing: Pairing, id: string): void {
  const request = getRequest(id);
  if (!request) return go('#/home');
  if (request.status === 'approved') return go(`#/done/${id}`);
  if (request.status !== 'waiting') return go(`#/stopped/${id}`);

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
    const now = new Date().toISOString();
    if (sameCode(typed, expected)) {
      saveRequest({ ...current, status: 'approved', decidedAt: now });
      return go(`#/done/${id}`);
    }
    const left = current.attemptsLeft - 1;
    if (left <= 0) {
      saveRequest({ ...current, attemptsLeft: 0, status: 'locked', decidedAt: now });
      return go(`#/stopped/${id}`);
    }
    saveRequest({ ...current, attemptsLeft: left });
    input.value = '';
    error.textContent = `That code does not match. ${left} ${left === 1 ? 'try' : 'tries'} left.`;
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
    button(`${keyName} said no`, () => {
      saveRequest({ ...getRequest(id)!, status: 'refused', decidedAt: new Date().toISOString() });
      go(`#/stopped/${id}`);
    }, 'danger'),
  );
  input.focus({ preventScroll: true });
}

export function renderStopped(pairing: Pairing, id: string): void {
  const request = getRequest(id);
  if (!request) return go('#/home');
  const locked = request.status === 'locked';
  screen(
    'Do not send the money',
    'parent',
    h('div', { class: 'stop-mark', 'aria-hidden': 'true' }, '✋'),
    h(
      'p',
      { class: 'lead' },
      locked
        ? `Three codes did not match, so this request is locked.`
        : `${pairing.key.name} did not agree to this payment.`,
    ),
    h(
      'ol',
      { class: 'steps stop' },
      h('li', {}, 'Hang up, or stop replying to the message.'),
      h('li', {}, 'Call your bank on the number on the back of your card.'),
      h('li', {}, `Then call ${pairing.key.name}.`),
    ),
    h('p', { class: 'request-line' }, `${formatAmount(request.amountCents)} to ${request.payee}`),
    button('Home', () => go('#/home'), 'secondary'),
  );
}
