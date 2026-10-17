// Small DOM helpers shared by every screen.
import type { Role } from '../state/storage.ts';
import { keyMark } from './key.ts';

type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (name.startsWith('on') && typeof value === 'function') {
      el.addEventListener(name.slice(2).toLowerCase(), value);
    } else if (value === true) {
      el.setAttribute(name, '');
    } else {
      el.setAttribute(name, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === 'object' ? child : String(child));
  }
  return el;
}

/** Replaces the current screen. The heading takes focus so screen readers announce it. */
export function screen(title: string, role: Role | 'none', ...children: Child[]): void {
  document.body.dataset.role = role;
  document.title = `${title} · Second Key`;
  const heading = h('h1', { tabindex: -1 }, title);
  // A back link, when given first, sits above the heading.
  const first = children[0];
  const back = first instanceof HTMLAnchorElement && first.classList.contains('back') ? children.shift() : null;
  const app = document.getElementById('app')!;
  app.replaceChildren(
    h('header', { class: 'brand' }, keyMark('brand-key'), h('span', {}, 'Second Key'), roleTag(role)),
    h('main', {}, back, heading, ...children),
  );
  heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function roleTag(role: Role | 'none'): Child {
  if (role === 'parent') return h('span', { class: 'role-tag' }, 'Sends the money');
  if (role === 'key') return h('span', { class: 'role-tag' }, 'Second key');
  return null;
}

export function go(hash: string): void {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

/** True when the app runs inside one of the two phone frames of the demo page. */
export const embedded = window.parent !== window;

/** On the demo page, hands a link to the other phone instead of a text message or a camera. */
export function deliver(to: Role, hash: string, via: string): void {
  window.parent.postMessage({ type: 'sk-deliver', to, hash, via }, location.origin);
}

/** On the demo page, shows the call banner between the two phones. */
export function signalCall(caller: string, callee: string, phone: string): void {
  window.parent.postMessage({ type: 'sk-call', caller, callee, phone }, location.origin);
}

export function button(label: string, onClick: () => void, kind = 'primary', extra: Attrs = {}) {
  return h('button', { type: 'button', class: `btn ${kind}`, onclick: onClick as EventListener, ...extra }, label);
}

export function backLink(label: string, hash: string) {
  return h('a', { class: 'back', href: hash }, `‹ ${label}`);
}
