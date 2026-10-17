import { describe, expect, it } from 'vitest';
import { b64urlDecode, b64urlEncode, checkWords, hotp, newSecret, releaseCode, sameCode } from '../../src/core/code.ts';
import type { Request } from '../../src/core/request.ts';
import { WORDS } from '../../src/core/words.ts';

// RFC 6238 appendix B, SHA-256 column. The seed is the 32-byte ASCII string below.
const RFC_SEED = new TextEncoder().encode('12345678901234567890123456789012');
const RFC_VECTORS: [number, string][] = [
  [59, '46119246'],
  [1111111109, '68084774'],
  [1111111111, '67062674'],
  [1234567890, '91819424'],
  [2000000000, '90698825'],
  [20000000000, '77737706'],
];

const request: Request = {
  v: 1,
  pairId: 'pair1',
  id: 'req1',
  amountCents: 840000,
  currency: 'EUR',
  payee: 'Account protection service',
  payeeKind: 'safe_account',
  answers: { contactedFirst: true, hurry: true, authority: true, secrecy: true },
  createdAt: '2026-10-20T13:40:00.000Z',
};

describe('truncation', () => {
  it.each(RFC_VECTORS)('matches RFC 6238 SHA-256 at time %i', async (time, expected) => {
    expect(await hotp(RFC_SEED, Math.floor(time / 30), 8, 'SHA-256')).toBe(expected);
  });

  it('matches RFC 4226 HOTP SHA-1 test values', async () => {
    const seed = new TextEncoder().encode('12345678901234567890');
    const expected = ['755224', '287082', '359152', '969429', '338314'];
    for (let c = 0; c < expected.length; c++) expect(await hotp(seed, c, 6, 'SHA-1')).toBe(expected[c]);
  });
});

describe('release code', () => {
  const secret = newSecret();

  it('is six digits and the same on both phones', async () => {
    const a = await releaseCode(secret, request);
    const b = await releaseCode(secret, structuredClone(request));
    expect(a).toMatch(/^\d{6}$/);
    expect(a).toBe(b);
  });

  it('changes when any field of the request changes', async () => {
    const base = await releaseCode(secret, request);
    const variants: Request[] = [
      { ...request, amountCents: 840001 },
      { ...request, payee: 'Another account' },
      { ...request, payeeKind: 'business_chosen' },
      { ...request, answers: { ...request.answers, secrecy: false } },
      { ...request, id: 'req2' },
      { ...request, createdAt: '2026-10-20T13:41:00.000Z' },
    ];
    for (const v of variants) expect(await releaseCode(secret, v)).not.toBe(base);
  });

  it('differs for another pairing secret', async () => {
    expect(await releaseCode(newSecret(), request)).not.toBe(await releaseCode(secret, request));
  });
});

describe('helpers', () => {
  it('round-trips base64url', () => {
    const bytes = crypto.getRandomValues(new Uint8Array(33));
    expect(b64urlDecode(b64urlEncode(bytes))).toEqual(bytes);
  });

  it('compares codes', () => {
    expect(sameCode('123456', '123456')).toBe(true);
    expect(sameCode('123456', '123457')).toBe(false);
    expect(sameCode('12345', '123456')).toBe(false);
  });

  it('has 256 distinct check words and derives the same three on both phones', async () => {
    expect(WORDS.length).toBe(256);
    expect(new Set(WORDS).size).toBe(256);
    const secret = newSecret();
    const words = await checkWords(secret, 'pair1');
    expect(words).toHaveLength(3);
    expect(await checkWords(secret, 'pair1')).toEqual(words);
  });
});
