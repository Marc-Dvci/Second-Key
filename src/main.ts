// Router. Incoming #pair= and #req= links are handled first; otherwise the
// screen follows the hash and what this phone has stored.
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './styles.css';
import { decodeRequest } from './core/links.ts';
import { ATTEMPTS, canonical } from './core/request.ts';
import { getPairing, getRequest, saveRequest } from './state/storage.ts';
import { h, screen } from './ui/dom.ts';
import { renderAsk } from './ui/views/ask.ts';
import { renderDone, renderHome } from './ui/views/home.ts';
import { renderReview } from './ui/views/review.ts';
import { renderWait } from './ui/views/wait.ts';

function replaceHash(hash: string): void {
  history.replaceState(null, '', location.pathname + location.search + hash);
}

function incomingRequest(payload: string): void {
  const pairing = getPairing();
  const request = decodeRequest(payload);
  if (!request) return notice('This link is damaged', 'Ask for the request to be sent again.');
  if (!pairing || pairing.role !== 'key') {
    return notice('This phone is not paired yet', 'Open the link in the browser you used for pairing.');
  }
  const known = getRequest(request.id);
  if (known && canonical(known) !== canonical(request)) {
    return notice(
      'This request has been changed',
      `It no longer matches the one ${pairing.parent.name} sent you. Do not approve it. Call ${pairing.parent.name} on the number saved at pairing.`,
    );
  }
  if (!known) saveRequest({ ...request, status: 'waiting', attemptsLeft: ATTEMPTS, scripts: [] });
  replaceHash(`#/review/${request.id}`);
  renderReview(pairing, request.id);
}

function notice(title: string, text: string): void {
  screen(title, 'none', h('p', { class: 'lead' }, text));
}

function route(): void {
  const hash = location.hash;
  if (hash.startsWith('#req=')) return incomingRequest(hash.slice(5));

  const pairing = getPairing();
  if (!pairing) return notice('Not paired yet', 'Open the demo page to pair two phones.');

  const [path, arg = ''] = hash.replace(/^#\/?/, '').split('/');
  if (pairing.role === 'parent') {
    if (path === 'ask') return renderAsk(pairing, Number(arg) || 0);
    if (path === 'wait' && arg) return renderWait(pairing, arg);
    if (path === 'done' && arg) return renderDone(pairing, arg);
  } else if (path === 'review' && arg) {
    return renderReview(pairing, arg);
  }
  renderHome(pairing);
}

window.addEventListener('hashchange', route);
route();
