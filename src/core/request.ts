// A request is what the parent's phone sends to the second key: the payment and
// the parent's answers. Its canonical text is what the release code covers.

export type PayeeKind =
  | 'known_in_person'
  | 'business_chosen'
  | 'business_new_details'
  | 'online_only'
  | 'safe_account';

export type Answers = {
  contactedFirst: boolean;
  hurry: boolean;
  authority: boolean;
  secrecy: boolean;
};

export type Request = {
  v: 1;
  pairId: string;
  id: string;
  amountCents: number;
  currency: 'EUR';
  payee: string;
  payeeKind: PayeeKind;
  answers: Answers;
  createdAt: string;
};

export type Status = 'waiting' | 'approved' | 'refused' | 'locked';

export type StoredRequest = Request & {
  status: Status;
  attemptsLeft: number;
  decidedAt?: string;
  scripts: string[];
};

export const PAYEE_KINDS: { id: PayeeKind; label: string }[] = [
  { id: 'known_in_person', label: 'Someone I know in person (family or friend)' },
  { id: 'business_chosen', label: 'A business I chose myself' },
  { id: 'business_new_details', label: 'A business or person I already pay, with new bank details' },
  { id: 'online_only', label: 'Someone I know only online, by phone or by message' },
  { id: 'safe_account', label: 'An account they say is mine, or a “safe” account' },
];

export const QUESTIONS: { id: keyof Answers; text: string; short: string }[] = [
  { id: 'contactedFirst', text: 'Did they contact you first?', short: 'They contacted first' },
  {
    id: 'hurry',
    text: 'Are they rushing you, or warning that something bad happens if you wait?',
    short: 'Rushing or warning',
  },
  {
    id: 'authority',
    text: 'Do they say they are from your bank, the police, the government or a well-known company?',
    short: 'Say they are bank, police, government or a company',
  },
  {
    id: 'secrecy',
    text: 'Have they told you to keep this quiet, stay on the line, or not tell your bank or family?',
    short: 'Told to keep quiet or stay on the line',
  },
];

export const ATTEMPTS = 3;

export function payeeKindLabel(kind: PayeeKind): string {
  return PAYEE_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

/** The exact text the release code is computed over. Any change to a field changes the code. */
export function canonical(r: Request): string {
  const a = r.answers;
  return [
    'v1',
    r.pairId,
    r.id,
    String(r.amountCents),
    r.currency,
    r.payee.trim(),
    r.payeeKind,
    [a.contactedFirst, a.hurry, a.authority, a.secrecy].map((x) => (x ? '1' : '0')).join(''),
    r.createdAt,
  ].join('\n');
}

const money = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

export function formatAmount(cents: number): string {
  const text = money.format(cents / 100);
  return text.endsWith('.00') ? text.slice(0, -3) : text;
}

/** "8400", "8,400", "8 400,50" and "€8400.50" all parse. Returns cents, or null. */
export function parseAmount(input: string): number | null {
  let s = input.replace(/[€\s]/g, '');
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 && cents < 1e12 ? cents : null;
}
