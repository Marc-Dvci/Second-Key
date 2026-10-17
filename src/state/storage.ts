// Everything a phone knows lives in its own browser storage. The ?device= query
// gives each phone on the demo page its own namespace.
import type { PairPayload } from '../core/links.ts';
import type { StoredRequest } from '../core/request.ts';

export type Role = 'parent' | 'key';
export type Pairing = PairPayload & { role: Role; confirmed: boolean };

export const device = new URLSearchParams(location.search).get('device') ?? 'main';
const prefix = `sk:${device}:`;

function read<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(prefix + name);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(name: string, value: unknown): void {
  try {
    localStorage.setItem(prefix + name, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the screen still renders from memory.
  }
}

export function getPairing(): Pairing | null {
  const p = read<Pairing | null>('pairing', null);
  return p && p.pairId && p.secret ? p : null;
}

export function setPairing(p: Pairing): void {
  write('pairing', p);
}

export function getRequests(): StoredRequest[] {
  const list = read<StoredRequest[]>('requests', []);
  return Array.isArray(list) ? list : [];
}

export function getRequest(id: string): StoredRequest | null {
  return getRequests().find((r) => r.id === id) ?? null;
}

export function saveRequest(r: StoredRequest): void {
  const list = getRequests().filter((x) => x.id !== r.id);
  list.unshift(r);
  write('requests', list);
}

export function clearDevice(): void {
  write('pairing', null);
  write('requests', []);
}
