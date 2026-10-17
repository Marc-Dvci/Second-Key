// Every request this phone has seen, newest first, with its outcome.
import { formatAmount, type Status } from '../../core/request.ts';
import { scriptById } from '../../core/rules.ts';
import { getRequests, type Pairing } from '../../state/storage.ts';
import { backLink, h, screen } from '../dom.ts';

const STATUS: Record<Status, string> = {
  waiting: 'Waiting',
  approved: 'Approved',
  refused: 'Refused',
  locked: 'Locked',
};

const when = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export function renderReceipts(pairing: Pairing): void {
  const list = getRequests();
  const other = pairing.role === 'parent' ? pairing.key.name : pairing.parent.name;
  screen(
    'Receipts',
    pairing.role,
    backLink('Home', '#/home'),
    list.length === 0
      ? h('p', { class: 'lead' }, 'No requests yet.')
      : h(
          'ul',
          { class: 'receipts' },
          ...list.map((r) => {
            const script = r.scripts.map(scriptById).find((s) => s?.named) ?? null;
            return h(
              'li',
              {},
              h('div', { class: 'receipt-top' }, h('strong', {}, formatAmount(r.amountCents)), h('span', { class: `chip ${r.status}` }, STATUS[r.status])),
              h('div', {}, `To ${r.payee}`),
              h('div', { class: 'receipt-meta' }, when.format(new Date(r.decidedAt ?? r.createdAt)), ` · with ${other}`),
              script && h('div', { class: 'receipt-script' }, `Matched: ${script.name}`),
            );
          }),
        ),
  );
}
