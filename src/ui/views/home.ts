// Home screens for both roles, and the parent's "key turned" screen.
import { formatAmount } from '../../core/request.ts';
import { getRequest, getRequests, type Pairing } from '../../state/storage.ts';
import { keyMark } from '../key.ts';
import { button, go, h, screen } from '../dom.ts';
import { startRequest } from './ask.ts';

export function renderHome(pairing: Pairing): void {
  if (pairing.role === 'parent') {
    const waiting = getRequests().find((r) => r.status === 'waiting');
    screen(
      `Hello, ${pairing.parent.name}`,
      'parent',
      h('p', { class: 'lead' }, `Your second key: ${pairing.key.name}`),
      button('Someone is asking me to send money', startRequest, 'primary big'),
      waiting &&
        button(`Waiting for ${pairing.key.name}: ${formatAmount(waiting.amountCents)} to ${waiting.payee}`, () =>
          go(`#/wait/${waiting.id}`),
        'secondary'),
      h('a', { class: 'link', href: '#/receipts' }, 'My receipts'),
    );
  } else {
    screen(
      `You are ${pairing.parent.name}’s second key`,
      'key',
      h(
        'p',
        { class: 'lead' },
        `When ${pairing.parent.name} is asked to send money to someone new, the request opens here.`,
      ),
      waitingForKey(),
      h('a', { class: 'link', href: '#/receipts' }, 'Receipts'),
    );
  }
}

function waitingForKey(): HTMLElement | null {
  const waiting = getRequests().find((r) => r.status === 'waiting');
  if (!waiting) return null;
  return button(`Open the waiting request: ${formatAmount(waiting.amountCents)} to ${waiting.payee}`, () =>
    go(`#/review/${waiting.id}`),
  'primary');
}

export function renderDone(pairing: Pairing, id: string): void {
  const request = getRequest(id);
  if (!request || request.status !== 'approved') return go('#/home');
  screen(
    'Second key turned',
    'parent',
    h('div', { class: 'turned' }, keyMark('big-key turning')),
    h('p', { class: 'lead' }, `${pairing.key.name} agreed. You can make this payment in your bank’s app.`),
    h('p', { class: 'request-line' }, `${formatAmount(request.amountCents)} to ${request.payee}`),
    button('Done', () => go('#/home')),
  );
}
