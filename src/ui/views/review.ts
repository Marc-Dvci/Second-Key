// The second key reviews a request, calls the parent, and decides.
import { releaseCode } from '../../core/code.ts';
import { QUESTIONS, formatAmount, payeeKindLabel, type StoredRequest } from '../../core/request.ts';
import { getRequest, saveRequest, type Pairing } from '../../state/storage.ts';
import { backLink, button, go, h, screen } from '../dom.ts';

export function renderReview(pairing: Pairing, id: string): void {
  const request = getRequest(id);
  if (!request) return go('#/home');
  if (request.status === 'approved') return void showCode(pairing, request);

  const parentName = pairing.parent.name;
  const onCall = h('input', { type: 'checkbox', id: 'on-call' });
  const show = button('Show the code', () => {
    saveRequest({ ...request, status: 'approved', decidedAt: new Date().toISOString() });
    void showCode(pairing, getRequest(id)!);
  });
  show.disabled = true;
  onCall.addEventListener('change', () => (show.disabled = !onCall.checked));

  screen(
    `${parentName} is asking you to approve a payment`,
    'key',
    backLink('Home', '#/home'),
    details(request),
    h('label', { class: 'check' }, onCall, ` I called ${parentName} on the number saved at pairing, and we are talking now`),
    show,
  );
}

export function details(request: StoredRequest): HTMLElement {
  return h(
    'dl',
    { class: 'summary' },
    h('dt', {}, 'Amount'),
    h('dd', { class: 'amount' }, formatAmount(request.amountCents)),
    h('dt', {}, 'To'),
    h('dd', {}, request.payee),
    h('dt', {}, 'Who they are'),
    h('dd', {}, payeeKindLabel(request.payeeKind)),
    ...QUESTIONS.flatMap((q) => [h('dt', {}, q.text), h('dd', {}, request.answers[q.id] ? 'Yes' : 'No')]),
  );
}

async function showCode(pairing: Pairing, request: StoredRequest): Promise<void> {
  const code = await releaseCode(pairing.secret, request);
  screen(
    `Read this code to ${pairing.parent.name}`,
    'key',
    h('p', { class: 'request-line' }, `${formatAmount(request.amountCents)} to ${request.payee}`),
    h('p', { class: 'code-display', 'aria-label': code.split('').join(' ') }, `${code.slice(0, 3)} ${code.slice(3)}`),
    h('p', { class: 'note' }, 'Read it slowly, on the call you made. This code only works for this payment.'),
    button('Done', () => go('#/home'), 'secondary'),
  );
}
