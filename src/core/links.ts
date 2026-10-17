// Pairing and request links. Payloads ride in the URL fragment (#...), which
// browsers keep on the phone and never send to the web server.
import { b64urlDecode, b64urlEncode } from './code.ts';
import { PAYEE_KINDS, type Request } from './request.ts';

export type Person = { name: string; phone: string };

export type PairPayload = {
  v: 1;
  pairId: string;
  secret: string;
  parent: Person;
  key: Person;
  createdAt: string;
};

const enc = new TextEncoder();
const dec = new TextDecoder();

export function encodePayload(value: unknown): string {
  return b64urlEncode(enc.encode(JSON.stringify(value)));
}

function decodeJson(text: string): unknown {
  try {
    return JSON.parse(dec.decode(b64urlDecode(text)));
  } catch {
    return null;
  }
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const isStr = (x: unknown, max = 200): x is string => typeof x === 'string' && x.length > 0 && x.length <= max;
const isId = (x: unknown): x is string => isStr(x, 64) && /^[A-Za-z0-9_-]+$/.test(x);
const isPerson = (x: unknown): x is Person => isObj(x) && isStr(x.name, 60) && isStr(x.phone, 30);
const isTime = (x: unknown): x is string => isStr(x, 40) && !Number.isNaN(Date.parse(x));

function byteLength(b64url: string): number {
  try {
    return b64urlDecode(b64url).length;
  } catch {
    return -1;
  }
}

export function decodePair(text: string): PairPayload | null {
  const p = decodeJson(text);
  if (!isObj(p) || p.v !== 1) return null;
  if (!isId(p.pairId) || !isId(p.secret) || byteLength(p.secret) !== 32) return null;
  if (!isPerson(p.parent) || !isPerson(p.key) || !isTime(p.createdAt)) return null;
  return {
    v: 1,
    pairId: p.pairId,
    secret: p.secret,
    parent: { name: p.parent.name, phone: p.parent.phone },
    key: { name: p.key.name, phone: p.key.phone },
    createdAt: p.createdAt,
  };
}

export function decodeRequest(text: string): Request | null {
  const r = decodeJson(text);
  if (!isObj(r) || r.v !== 1 || r.currency !== 'EUR') return null;
  if (!isId(r.pairId) || !isId(r.id) || !isStr(r.payee, 80) || !isTime(r.createdAt)) return null;
  if (typeof r.amountCents !== 'number' || !Number.isInteger(r.amountCents) || r.amountCents <= 0) return null;
  if (!PAYEE_KINDS.some((k) => k.id === r.payeeKind)) return null;
  const a = r.answers;
  if (!isObj(a)) return null;
  const flags = ['contactedFirst', 'hurry', 'authority', 'secrecy'] as const;
  if (!flags.every((f) => typeof a[f] === 'boolean')) return null;
  return {
    v: 1,
    pairId: r.pairId,
    id: r.id,
    amountCents: r.amountCents,
    currency: 'EUR',
    payee: r.payee,
    payeeKind: r.payeeKind as Request['payeeKind'],
    answers: {
      contactedFirst: a.contactedFirst as boolean,
      hurry: a.hurry as boolean,
      authority: a.authority as boolean,
      secrecy: a.secrecy as boolean,
    },
    createdAt: r.createdAt,
  };
}

/** The address of the app itself, without query or fragment. */
export function appBase(loc: Location = location): string {
  return loc.origin + loc.pathname.replace(/demo\.html$/, '');
}

export function pairLink(base: string, payload: PairPayload): string {
  return `${base}#pair=${encodePayload(payload)}`;
}

export function requestLink(base: string, request: Request): string {
  return `${base}#req=${encodePayload(request)}`;
}

export function smsHref(phone: string, body: string): string {
  return `sms:${phone.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(body)}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
