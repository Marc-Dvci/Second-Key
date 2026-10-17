import { describe, expect, it } from 'vitest';
import { newSecret } from '../../src/core/code.ts';
import {
  decodePair,
  decodeRequest,
  encodePayload,
  pairLink,
  requestLink,
  smsHref,
  telHref,
  type PairPayload,
} from '../../src/core/links.ts';
import { canonical, formatAmount, parseAmount, type Request } from '../../src/core/request.ts';

const request: Request = {
  v: 1,
  pairId: 'pair1',
  id: 'req1',
  amountCents: 25000,
  currency: 'EUR',
  payee: 'Martin Plumbing',
  payeeKind: 'business_chosen',
  answers: { contactedFirst: false, hurry: false, authority: false, secrecy: false },
  createdAt: '2026-10-20T13:40:00.000Z',
};

const pair: PairPayload = {
  v: 1,
  pairId: 'pair1',
  secret: newSecret(),
  parent: { name: 'Anne', phone: '+33 6 12 34 56 78' },
  key: { name: 'Tom', phone: '+33 6 98 76 54 32' },
  createdAt: '2026-10-20T13:00:00.000Z',
};

describe('links', () => {
  it('round-trips a request through its link', () => {
    const link = requestLink('https://example.org/Second-Key/', request);
    expect(link.startsWith('https://example.org/Second-Key/#req=')).toBe(true);
    expect(decodeRequest(link.split('#req=')[1])).toEqual(request);
  });

  it('round-trips a pairing through its link', () => {
    const link = pairLink('https://example.org/Second-Key/', pair);
    expect(decodePair(link.split('#pair=')[1])).toEqual(pair);
  });

  it('never puts the secret in a request link', () => {
    expect(requestLink('https://x/', request)).not.toContain(pair.secret);
  });

  it('rejects damaged or invalid payloads', () => {
    expect(decodeRequest('not-base64!')).toBeNull();
    expect(decodeRequest(encodePayload({ ...request, amountCents: -5 }))).toBeNull();
    expect(decodeRequest(encodePayload({ ...request, payeeKind: 'other' }))).toBeNull();
    expect(decodeRequest(encodePayload({ ...request, answers: { hurry: 'yes' } }))).toBeNull();
    expect(decodePair(encodePayload({ ...pair, secret: 'short' }))).toBeNull();
    expect(decodePair(encodePayload({ ...pair, parent: { name: 'Anne' } }))).toBeNull();
  });

  it('drops unknown fields on decode', () => {
    const decoded = decodeRequest(encodePayload({ ...request, extra: 'x' })) as Record<string, unknown>;
    expect(decoded.extra).toBeUndefined();
  });

  it('builds sms and tel links from saved numbers', () => {
    expect(telHref('+33 6 12 34 56 78')).toBe('tel:+33612345678');
    expect(smsHref('+33 6 98 76 54 32', 'a b')).toBe('sms:+33698765432?body=a%20b');
  });
});

describe('amounts and canonical text', () => {
  it('parses common ways of writing an amount', () => {
    expect(parseAmount('8400')).toBe(840000);
    expect(parseAmount('8,400')).toBe(840000);
    expect(parseAmount('8 400,50')).toBe(840050);
    expect(parseAmount('€8400.5')).toBe(840050);
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });

  it('formats euros without needless cents', () => {
    expect(formatAmount(840000)).toBe('€8,400');
    expect(formatAmount(840050)).toBe('€8,400.50');
  });

  it('lists every field in the canonical text', () => {
    expect(canonical(request).split('\n')).toEqual([
      'v1',
      'pair1',
      'req1',
      '25000',
      'EUR',
      'Martin Plumbing',
      'business_chosen',
      '0000',
      '2026-10-20T13:40:00.000Z',
    ]);
  });
});
