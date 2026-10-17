// The scam scripts the second key is briefed with. Fixed data: each script names
// what such callers typically say, why it is a scam, what to ask on the call, and
// the answers that point to it. `families` maps a script to the scam families of
// the evaluation cases; generic scripts (named: false) do not count as naming one.
import type { Answers, PayeeKind } from './request.ts';

export type ScriptInput = { payeeKind: PayeeKind; answers: Answers };

export type Script = {
  id: string;
  name: string;
  says: string;
  why: string;
  ask: string[];
  families: string[];
  named: boolean;
  when: (r: ScriptInput) => boolean;
};

export const SCRIPTS: readonly Script[] = [
  {
    id: 'safe_account',
    name: 'The fake bank adviser',
    says: '“Your account is under attack. Move your savings to this safe account while we block the fraud.”',
    why: 'A bank never asks you to move money to protect it. A “safe account” belongs to the caller.',
    ask: [
      'Who called whom first?',
      'Who gave you this account number?',
      'Will you hang up now and call the number on the back of your card with me?',
    ],
    families: ['bank_impersonation', 'official_impersonation'],
    named: true,
    when: (r) => r.payeeKind === 'safe_account',
  },
  {
    id: 'impersonation',
    name: 'Someone posing as your bank, the police, an official or a big company',
    says: '“This is your bank’s fraud team.” “This is the police.” “This is technical support.” “You must act now.”',
    why: 'Real institutions do not call you to ask for a transfer, and the number on the screen can be faked.',
    ask: [
      'Which organisation did they say they were from?',
      'Did you look up their number yourself, or did they give it to you?',
      'Did they ask you to install an app or read out a code?',
    ],
    families: ['bank_impersonation', 'official_impersonation', 'tech_support'],
    named: true,
    when: (r) => r.answers.authority && r.answers.contactedFirst && r.payeeKind !== 'known_in_person',
  },
  {
    id: 'changed_details',
    name: 'Changed bank details',
    says: '“We have changed banks. Please send this payment to our new account.”',
    why: 'Criminals copy or hack emails from builders, solicitors and suppliers, then send new details just before a payment is due.',
    ask: [
      'How did the new details arrive: email, text or letter?',
      'Will you call them on a number from an old invoice or their website, not from the message?',
    ],
    families: ['invoice_redirection'],
    named: true,
    when: (r) => r.payeeKind === 'business_new_details',
  },
  {
    id: 'family_emergency',
    name: 'The family emergency message',
    says: '“Hi Mum, I dropped my phone, this is my new number. I need to pay something urgently.”',
    why: 'The message comes from a new number and asks for money before you can hear their voice.',
    ask: [
      'Did the message come from their usual number?',
      'Have you heard their voice on a call to the number you already had?',
    ],
    families: ['family_emergency'],
    named: true,
    when: (r) => r.payeeKind === 'known_in_person' && r.answers.contactedFirst && (r.answers.hurry || r.answers.secrecy),
  },
  {
    id: 'online_only',
    name: 'Someone you only know online',
    says: '“I wish I could be with you. I just need help with one fee.” “This investment will double in a month.”',
    why: 'Romance and investment scammers build trust for weeks before they ask for money. You have never met them.',
    ask: [
      'Have you ever met this person, or seen them on a live video call?',
      'Whose idea was this payment?',
      'Has anyone else in the family heard of this person or company?',
    ],
    families: ['romance', 'investment', 'purchase'],
    named: true,
    when: (r) => r.payeeKind === 'online_only',
  },
  {
    id: 'offer_came_to_you',
    name: 'An offer that came to you',
    says: '“A special opportunity, today only. Pay by transfer now to secure it.”',
    why: 'Investment and purchase scams start with an advert, a call or a message, and push for a transfer before you can check.',
    ask: [
      'Where did you first see this offer?',
      'Can we find the company on the official register, or reviews from people we trust?',
      'Why does it have to be a transfer, and why today?',
    ],
    families: ['investment', 'purchase'],
    named: true,
    when: (r) => r.payeeKind === 'business_chosen' && r.answers.contactedFirst,
  },
  {
    id: 'secrecy',
    name: 'Told to keep it quiet',
    says: '“Don’t tell your bank, they may be involved.” “Stay on the line.”',
    why: 'Keeping you alone on the line is how a scam stops anyone else from noticing.',
    ask: ['Who told you to keep this quiet, and what reason did they give?'],
    families: [],
    named: false,
    when: (r) => r.answers.secrecy,
  },
  {
    id: 'pressure',
    name: 'Pressure to act now',
    says: '“If you don’t pay in the next hour, it will be too late.”',
    why: 'Urgency is there to stop you from checking.',
    ask: ['What happens, according to them, if you wait until tomorrow?'],
    families: [],
    named: false,
    when: (r) => r.answers.hurry && r.answers.contactedFirst,
  },
];
