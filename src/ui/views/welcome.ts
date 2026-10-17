// First screen on a phone that is not paired yet.
import { backLink, button, go, h, screen } from '../dom.ts';
import { keyMark } from '../key.ts';

export function renderWelcome(): void {
  screen(
    'Two people, one payment',
    'none',
    h('div', { class: 'turned' }, keyMark('big-key brass')),
    h(
      'p',
      { class: 'lead' },
      'Before money goes to someone new, a second person you trust calls you back and reads you a code. A bank never lets one person do this alone. Neither should a family.',
    ),
    button('I send the money', () => go('#/pair')),
    button('I’m someone’s second key', () => go('#/key-help'), 'secondary'),
  );
}

export function renderKeyHelp(): void {
  screen(
    'Becoming a second key',
    'key',
    backLink('Back', '#/'),
    h(
      'ol',
      { class: 'steps' },
      h('li', {}, 'Sit next to the person you protect.'),
      h('li', {}, 'On their phone, they open Second Key and choose “I send the money”.'),
      h('li', {}, 'Point your phone’s camera at the code on their screen and open the link.'),
    ),
  );
}
