// Release code and check words. Both phones run the same calculation from the
// secret shared at pairing; only the second key's phone ever displays the code.
import { canonical, type Request } from './request.ts';
import { WORDS } from './words.ts';

const enc = new TextEncoder();

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function randomId(bytes = 16): string {
  return b64urlEncode(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** A new 32-byte pairing secret, base64url. */
export function newSecret(): string {
  return randomId(32);
}

export async function hmac(
  key: Uint8Array,
  message: Uint8Array,
  hash: 'SHA-1' | 'SHA-256' = 'SHA-256',
): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, message as BufferSource));
}

/** Dynamic truncation, RFC 4226 section 5.3. */
export function truncate(mac: Uint8Array, digits: number): string {
  const offset = mac[mac.length - 1] & 0x0f;
  const bin =
    ((mac[offset] & 0x7f) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

/** HOTP over an 8-byte big-endian counter (RFC 4226 / RFC 6238). Used to test truncate(). */
export async function hotp(
  secret: Uint8Array,
  counter: number,
  digits: number,
  hash: 'SHA-1' | 'SHA-256' = 'SHA-256',
): Promise<string> {
  const msg = new Uint8Array(8);
  new DataView(msg.buffer).setBigUint64(0, BigInt(counter));
  return truncate(await hmac(secret, msg, hash), digits);
}

/** The six-digit release code for one request. Covers every field of the request. */
export async function releaseCode(secret: string, request: Request): Promise<string> {
  return truncate(await hmac(b64urlDecode(secret), enc.encode(canonical(request))), 6);
}

/** Compares two codes without stopping at the first different digit. */
export function sameCode(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Three words both phones show at pairing, so the two people can see they hold the same secret. */
export async function checkWords(secret: string, pairId: string): Promise<string[]> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', enc.encode(`check\n${pairId}\n${secret}`)),
  );
  return [WORDS[digest[0]], WORDS[digest[1]], WORDS[digest[2]]];
}
