// The parent's request, one decision per screen.
import { randomId } from '../../core/code.ts';
import { appBase, requestLink, smsHref } from '../../core/links.ts';
import {
  ATTEMPTS,
  PAYEE_KINDS,
  QUESTIONS,
  formatAmount,
  parseAmount,
  payeeKindLabel,
  type Answers,
  type PayeeKind,
  type Request,
} from '../../core/request.ts';
import { matchScripts } from '../../core/rules.ts';
import { saveRequest, type Pairing } from '../../state/storage.ts';
import { backLink, button, deliver, embedded, go, h, screen } from '../dom.ts';

type Draft = { amount: string; payee: string; payeeKind?: PayeeKind; answers: Partial<Answers> };

let draft: Draft = { amount: '', payee: '', answers: {} };

export function startRequest(): void {
  draft = { amount: '', payee: '', answers: {} };
  go('#/ask/0');
}

export function renderAsk(pairing: Pairing, step: number): void {
  if (step > 0 && parseAmount(draft.amount) === null) return go('#/ask/0');
  if (step === 0) return amountStep();
  if (step === 1) return payeeStep();
  if (step >= 2 && step < 2 + QUESTIONS.length) return questionStep(step);
  return summaryStep(pairing);
}

function amountStep(): void {
  const error = h('p', { class: 'error', role: 'alert' });
  const amount = h('input', {
    id: 'amount',
    inputmode: 'decimal',
    autocomplete: 'off',
    value: draft.amount,
    placeholder: '0',
  });
  const payee = h('input', { id: 'payee', autocomplete: 'off', value: draft.payee, maxlength: 80 });
  const next = () => {
    draft.amount = amount.value;
    draft.payee = payee.value.trim();
    if (parseAmount(draft.amount) === null) return void (error.textContent = 'Type the amount in euros, for example 250.');
    if (!draft.payee) return void (error.textContent = 'Type who the money would go to.');
    go('#/ask/1');
  };
  screen(
    'How much, and to whom?',
    'parent',
    backLink('Home', '#/home'),
    h('label', { for: 'amount' }, 'Amount'),
    h('div', { class: 'money' }, h('span', { 'aria-hidden': 'true' }, '€'), amount),
    h('label', { for: 'payee' }, 'Who would receive it'),
    payee,
    error,
    button('Next', next),
  );
}

function payeeStep(): void {
  screen(
    'Who is this payee?',
    'parent',
    backLink('Back', '#/ask/0'),
    h(
      'div',
      { class: 'choices' },
      ...PAYEE_KINDS.map((k) =>
        button(
          k.label,
          () => {
            draft.payeeKind = k.id;
            go('#/ask/2');
          },
          `choice${draft.payeeKind === k.id ? ' selected' : ''}`,
        ),
      ),
    ),
  );
}

function questionStep(step: number): void {
  const i = step - 2;
  const q = QUESTIONS[i];
  const answer = (value: boolean) => {
    draft.answers[q.id] = value;
    go(`#/ask/${step + 1}`);
  };
  screen(
    q.text,
    'parent',
    backLink('Back', `#/ask/${step - 1}`),
    h('p', { class: 'step-count' }, `Question ${i + 1} of ${QUESTIONS.length}`),
    h(
      'div',
      { class: 'yes-no' },
      button('Yes', () => answer(true), 'choice', { 'aria-pressed': String(draft.answers[q.id] === true) }),
      button('No', () => answer(false), 'choice', { 'aria-pressed': String(draft.answers[q.id] === false) }),
    ),
  );
}

function summaryStep(pairing: Pairing): void {
  if (!draft.payeeKind) return go('#/ask/1');
  const missing = QUESTIONS.findIndex((q) => draft.answers[q.id] === undefined);
  if (missing >= 0) return go(`#/ask/${missing + 2}`);
  const cents = parseAmount(draft.amount)!;
  const keyName = pairing.key.name;
  const status = h('p', { class: 'note', role: 'status' });

  const build = (): Request => ({
    v: 1,
    pairId: pairing.pairId,
    id: randomId(),
    amountCents: cents,
    currency: 'EUR',
    payee: draft.payee,
    payeeKind: draft.payeeKind!,
    answers: draft.answers as Answers,
    createdAt: new Date().toISOString(),
  });
  let request: Request | null = null;
  const ensure = (): Request => {
    if (!request) {
      request = build();
      saveRequest({ ...request, status: 'waiting', attemptsLeft: ATTEMPTS, scripts: matchScripts(request).map((s) => s.id) });
    }
    return request;
  };

  const send = () => {
    const r = ensure();
    const link = requestLink(appBase(), r);
    if (embedded) deliver('key', link.slice(link.indexOf('#')), 'text message');
    else location.href = smsHref(pairing.key.phone, `${pairing.parent.name} is asking you to approve a payment: ${link}`);
    go(`#/wait/${r.id}`);
  };
  const copy = async () => {
    const r = ensure();
    try {
      await navigator.clipboard.writeText(requestLink(appBase(), r));
      status.textContent = `Link copied. Send it to ${keyName}, then come back here.`;
    } catch {
      status.textContent = 'This browser cannot copy. Use the button above.';
    }
  };

  screen(
    'Check before you send',
    'parent',
    backLink('Change something', '#/ask/0'),
    h(
      'dl',
      { class: 'summary' },
      h('dt', {}, 'Amount'),
      h('dd', { class: 'amount' }, formatAmount(cents)),
      h('dt', {}, 'To'),
      h('dd', {}, draft.payee),
      h('dt', {}, 'Who they are'),
      h('dd', {}, payeeKindLabel(draft.payeeKind)),
      ...QUESTIONS.flatMap((q) => [h('dt', {}, q.text), h('dd', {}, draft.answers[q.id] ? 'Yes' : 'No')]),
    ),
    button(`Send to ${keyName}`, send),
    button('Copy the link instead', copy, 'secondary'),
    status,
  );
}
