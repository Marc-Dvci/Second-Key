// Pairing, once, in the same room: the parent's phone shows a QR code holding the
// shared secret; the second key's camera opens it. Both screens show three check words.
import { checkWords, newSecret, randomId } from '../../core/code.ts';
import { appBase, decodePair, pairLink, type PairPayload } from '../../core/links.ts';
import { getPairing, setPairing, type Pairing } from '../../state/storage.ts';
import { backLink, button, deliver, embedded, go, h, screen } from '../dom.ts';
import { qrFigure } from '../qr.ts';

const PHONE = /^\+?[\d\s().-]{6,20}$/;

export function renderPairForm(): void {
  const field = (id: string, label: string, type = 'text') => {
    const input = h('input', { id, type, autocomplete: 'off', maxlength: type === 'tel' ? 20 : 40 });
    return [h('label', { for: id }, label), input] as const;
  };
  const [l1, myName] = field('my-name', 'Your first name');
  const [l2, myPhone] = field('my-phone', 'Your phone number', 'tel');
  const [l3, keyName] = field('key-name', 'Your second key’s first name');
  const [l4, keyPhone] = field('key-phone', 'Their phone number', 'tel');
  const error = h('p', { class: 'error', role: 'alert' });

  const start = () => {
    const values = [myName, myPhone, keyName, keyPhone].map((i) => i.value.trim());
    if (values.some((v) => !v)) return void (error.textContent = 'Fill in all four lines.');
    if (!PHONE.test(values[1]) || !PHONE.test(values[3])) {
      return void (error.textContent = 'Check the phone numbers: digits, spaces and + only.');
    }
    setPairing({
      v: 1,
      pairId: randomId(),
      secret: newSecret(),
      parent: { name: values[0], phone: values[1] },
      key: { name: values[2], phone: values[3] },
      createdAt: new Date().toISOString(),
      role: 'parent',
      confirmed: false,
    });
    go('#/pair/show');
  };

  screen(
    'Choose your second key',
    'parent',
    backLink('Back', '#/'),
    h('p', {}, 'Someone you trust, who will answer when you call and call you back.'),
    l1,
    myName,
    l2,
    myPhone,
    l3,
    keyName,
    l4,
    keyPhone,
    error,
    button('Next', start),
  );
}

export async function renderPairShow(pairing: Pairing): Promise<void> {
  const payload: PairPayload = {
    v: 1,
    pairId: pairing.pairId,
    secret: pairing.secret,
    parent: pairing.parent,
    key: pairing.key,
    createdAt: pairing.createdAt,
  };
  const link = pairLink(appBase(), payload);
  const [qr, words] = await Promise.all([
    qrFigure(link, `Pairing code for ${pairing.key.name}'s phone`),
    checkWords(pairing.secret, pairing.pairId),
  ]);
  screen(
    `Show this to ${pairing.key.name}`,
    'parent',
    h('p', {}, `${pairing.key.name} points their phone’s camera at this code. Show it to nobody else.`),
    qr,
    embedded &&
      button(`Scan with ${pairing.key.name}’s phone`, () => deliver('key', link.slice(link.indexOf('#')), 'camera'), 'secondary demo-only'),
    h('p', { class: 'words-label' }, `${pairing.key.name}’s phone will show these three words:`),
    wordList(words),
    button(`The words match on ${pairing.key.name}’s phone`, () => {
      setPairing({ ...pairing, confirmed: true });
      go('#/home');
    }),
  );
}

export async function incomingPair(payloadText: string): Promise<void> {
  const payload = decodePair(payloadText);
  if (!payload) {
    return screen('This pairing code is damaged', 'none', h('p', { class: 'lead' }, 'Ask for the code to be shown again.'));
  }
  const existing = getPairing();
  if (existing?.pairId === payload.pairId && existing.role === 'key') return go('#/home');
  if (existing?.role === 'parent') {
    return screen(
      'This phone already sends money with Second Key',
      'parent',
      h('p', { class: 'lead' }, `Open the code on ${payload.key.name}’s phone instead.`),
    );
  }
  const words = await checkWords(payload.secret, payload.pairId);
  screen(
    `Become ${payload.parent.name}’s second key?`,
    'key',
    h('p', {}, `Check that ${payload.parent.name}’s phone shows the same three words:`),
    wordList(words),
    h('p', { class: 'note' }, `When ${payload.parent.name} asks to send money to someone new, you will call ${payload.parent.phone} and decide together.`),
    button('The words match', () => {
      setPairing({ ...payload, role: 'key', confirmed: true });
      go('#/home');
    }),
    button('They don’t match', () =>
      screen('Do not pair', 'key', h('p', { class: 'lead' }, `Ask ${payload.parent.name} to start pairing again, in the same room.`)),
    'secondary'),
  );
}

function wordList(words: string[]): HTMLElement {
  return h('ul', { class: 'words' }, ...words.map((w) => h('li', {}, w)));
}
