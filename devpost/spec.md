---
doc: spec
status: approved
---

# Second Key — Technical Spec

## How This Works, In Plain Language
Second Key is a web page that each phone opens in its browser. There is no server and no account: everything a phone knows is kept in that phone's browser storage.

At pairing, the parent's phone makes a long random secret and shows it inside a QR code. The second key's phone reads the QR code and keeps the same secret. From then on, both phones can do the same calculation: take the secret and a request (amount, payee, answers, time), and turn them into a six-digit number. That number is the release code.

The parent's phone sends the request to the second key as a link in a text message. The link carries the request, never the secret. The second key's phone recomputes the code and shows it; the parent's phone recomputes it too, but only to compare it with what the parent types. A scammer without the secret cannot make the code, and if anyone changes the amount or the payee in the link, the second key's phone computes a different code that the parent's phone will refuse.

A fixed table of scam scripts reads the parent's answers and names the script they match, so the second key knows what to ask on the call. The table was written and committed before the evaluation cases were collected.

Why this shape: a static page is free to host, works with any bank, keeps nothing on a server, and the in-person QR setup is the same trust step a bank asks for.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. Parent picks "I send the money" → `views/pair.ts` → `core/code.ts` makes a 32-byte secret with `crypto.getRandomValues` → `core/links.ts` builds `…/#pair=<payload>` → `ui/qr.ts` draws it → `core/code.ts` derives three check words.
2. Second key's camera opens the link → `main.ts` sees `#pair=` → `views/pair.ts` shows the parent's name and the same words → "The words match" → `state/storage.ts` saves the pairing.
3. Parent taps "Someone is asking me to send money" → `views/ask.ts` walks the steps → `core/request.ts` builds the request (id, amount in cents, payee, payee type, answers, time).
4. "Send to Tom" → `core/links.ts` builds `…/#req=<payload>` → opens `sms:<number>?body=<text with link>` → parent goes to `views/wait.ts`.
5. Second key opens the link → `main.ts` sees `#req=` → checks the pairing id → saves it → `views/review.ts` → `core/rules.ts` matches the answers against `core/scripts.ts` → shows the script and the call button (`tel:` with the saved number).
6. Second key ticks the call box and taps "Show the code" → `core/code.ts` computes the code → shows it → saves the decision.
7. Parent types the code → `core/code.ts` computes the expected code and compares → unlocked, or an attempt is used → saves the outcome.
8. Either phone opens "Receipts" → `views/receipts.ts` lists the saved requests.

## Stack
- **TypeScript 5 and Vite** with no UI framework. The app has a dozen small screens; plain DOM functions keep it light and readable. Docs: https://vite.dev/guide/ , https://www.typescriptlang.org/docs/
- **Web Crypto API** (`crypto.subtle`) for HMAC-SHA-256 and SHA-256, built into every modern browser. Docs: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
- **qrcode** (npm, MIT) to draw the pairing QR code as SVG. Docs: https://github.com/soldair/node-qrcode
- **@fontsource/atkinson-hyperlegible** (OFL) so the font is bundled with the app, with no third-party font request. Docs: https://fontsource.org/fonts/atkinson-hyperlegible
- **Vitest** for unit tests and **Playwright** with **@axe-core/playwright** for two-phone browser tests and accessibility checks. Docs: https://vitest.dev/ , https://playwright.dev/ , https://github.com/dequelabs/axe-core-npm
- Node 24 runs the evaluation script directly (built-in TypeScript type stripping).

## Where It Runs and How Someone Tries It
- Runtime: any modern phone or desktop browser. No API key.
- Local: `npm install`, then `npm run dev`, then open `http://localhost:5173/Second-Key/demo.html` for both phones side by side, or `http://localhost:5173/Second-Key/` on each phone on the same network (`npm run dev -- --host`).
- Tests: `npm test` (unit), `npm run e2e` (two-phone browser tests), `npm run evaluate` (case set).
- Deployment: GitHub Pages from GitHub Actions on every push to `main`, at `https://marc-dvci.github.io/Second-Key/`. The demo video is recorded from the deployed demo page.

## Look and Feel
Implements `prd.md > Look and Feel`.
- CSS custom properties in `src/styles.css`. Parent: paper `#FBF7EF`, ink `#1B2433`. Second key: `#EEF4FA` with the same ink. Brass `#A87A2A` for the key mark only. Green `#1E6B45` for "key turned", red `#A3271F` for "stop".
- Atkinson Hyperlegible 400 and 700; body 20 px, headings 28 to 34 px, buttons 56 px minimum height, 16 px side gutter.
- One column, max width 440 px, generous spacing. Each screen: a short heading, at most three lines of text, one primary button.
- The key mark is an inline SVG that rotates 90 degrees when the code is accepted; motion is disabled under `prefers-reduced-motion`.

## Components

### App Shell and Router
`src/main.ts`. Reads the URL hash, routes incoming `#pair=` and `#req=` links, otherwise picks the screen from stored state. Reads `?device=` to give each demo phone its own storage namespace.
PRD ref: `prd.md > Screens and Layout`, `prd.md > States and Boundaries`.

### Storage
`src/state/storage.ts`. Wraps `localStorage` under the key prefix `sk:<device>:`. Holds the pairing and the request list. All reads tolerate missing or corrupt values.
PRD ref: `prd.md > States and Boundaries` (what persists).

### Release Code
`src/core/code.ts`. `newSecret()`, `checkWords(secret, pairId)`, `releaseCode(secret, request)`. The code is HMAC-SHA-256 over the canonical request text, reduced to six digits with the dynamic truncation of RFC 4226 section 5.3. Tested against the SHA-256 vectors of RFC 6238.
PRD ref: `prd.md > Releasing the Code`, `prd.md > Pairing`.

### Links
`src/core/links.ts`. Encodes and decodes the pairing and request payloads as base64url JSON in the URL fragment, which browsers never send to the web server. Validates every field on decode.
PRD ref: `prd.md > Sending to the Second Key`, `prd.md > Pairing`.

### Requests
`src/core/request.ts`. The request type, the five payee types, the four questions with their wording, and the canonical text used by the release code.
PRD ref: `prd.md > Making a Request`.

### Scam Scripts and Matching
`src/core/scripts.ts` (data) and `src/core/rules.ts` (matching). Each script has an id, a name, what such callers typically say, the questions to ask, and a condition on the payee type and the four answers. `matchScripts(request)` returns every matching script in table order; the first is shown as the main match.
PRD ref: `prd.md > Reviewing a Request`.

### Screens
`src/ui/views/`: `welcome.ts`, `pair.ts`, `home.ts`, `ask.ts`, `wait.ts`, `review.ts`, `receipts.ts`. Each exports a function that renders into the app root and wires its buttons. Shared helpers in `src/ui/dom.ts`, the key mark in `src/ui/key.ts`, the QR code in `src/ui/qr.ts`.
PRD ref: `prd.md > Features and Behavior`.

### Demo Page
`demo.html` and `src/demo.ts`. Two phone frames, each an iframe of the app with `?device=parent` and `?device=key`. Inside the demo, the app posts a message instead of opening the text-message app or the dialler, and the demo page delivers the link to the other phone and shows a call banner.
PRD ref: `prd.md > Demo Page`.

### Evaluation
`cases/cases.json` (public scam warnings and ordinary payments, each with the answers a person would give) and `scripts/evaluate.ts`, which runs `matchScripts` over every case and writes `docs/evaluation.md`.
PRD ref: `prd.md > Reviewing a Request`.

## Data Model
```ts
type PayeeKind = 'known_in_person' | 'business_chosen' | 'business_new_details' | 'online_only' | 'safe_account';
type Answers = { contactedFirst: boolean; hurry: boolean; authority: boolean; secrecy: boolean };

type Pairing = {
  v: 1; pairId: string; secret: string;            // base64url, 32 bytes
  role: 'parent' | 'key';
  parent: { name: string; phone: string };
  key: { name: string; phone: string };
  createdAt: string; confirmed: boolean;
};

type Request = {
  v: 1; pairId: string; id: string;                // id: 16 random bytes, base64url
  amountCents: number; currency: 'EUR';
  payee: string; payeeKind: PayeeKind; answers: Answers;
  createdAt: string;                               // ISO time, set on the parent's phone
};

type StoredRequest = Request & {
  status: 'waiting' | 'approved' | 'refused' | 'locked';
  attemptsLeft: number;                            // parent side, starts at 3
  decidedAt?: string; scripts: string[];           // matched script ids at review time
};
```
- `sk:<device>:pairing` holds one `Pairing`. `sk:<device>:requests` holds `StoredRequest[]`.
- Canonical text for the code: `v1`, pairId, id, amountCents, currency, payee trimmed, payeeKind, the four answers as `0`/`1`, createdAt, joined by newlines.
- Leaving and coming back: both phones reload their pairing and requests; a waiting request reopens on the parent's waiting screen.

## File Structure
```
second-key/
├── index.html                 # the app
├── demo.html                  # both phones side by side
├── public/
│   ├── manifest.webmanifest   # install name, colours, icon
│   └── key.svg                # app icon
├── src/
│   ├── main.ts                # router, device namespace, incoming links
│   ├── demo.ts                # delivers links between the two demo phones
│   ├── styles.css             # tokens, layout, both role themes
│   ├── core/
│   │   ├── code.ts            # secret, check words, release code
│   │   ├── words.ts           # 256 short words for check words
│   │   ├── links.ts           # #pair= and #req= payloads
│   │   ├── request.ts         # types, questions, canonical text
│   │   ├── scripts.ts         # the scam script table
│   │   └── rules.ts           # matchScripts()
│   ├── state/
│   │   └── storage.ts         # namespaced localStorage
│   └── ui/
│       ├── dom.ts             # element helper, screen mount
│       ├── key.ts             # brass key SVG
│       ├── qr.ts              # QR code SVG
│       └── views/             # one file per screen
├── tests/
│   ├── unit/                  # code, links, rules
│   └── e2e/                   # two-phone journeys, accessibility
├── cases/cases.json           # evaluation cases with sources
├── scripts/evaluate.ts        # writes docs/evaluation.md
├── docs/evaluation.md         # case-set results
├── .github/workflows/pages.yml
├── devpost/                   # Devpost learning workspace
├── LICENSE                    # MIT
└── README.md
```

## External Services and Dependencies
- **GitHub Pages** hosts the built files. Free, no key. Docs: https://docs.github.com/en/pages
- **The phone's text-message app** through an `sms:` link, and **the dialler** through a `tel:` link. No API, no cost.
- No other service. No analytics, no fonts from a CDN, no model API.

## Important Failure Modes
- **The link opens in a different browser from the one that was paired** (for example inside a messaging app's built-in browser) → the review says "This phone is not paired with Anne yet. Open the link in the browser you used for pairing." and offers "Copy the link".
- **The parent mistypes the code** → "That code does not match. 2 tries left."; after three, the request locks and the screen says to stop and call the second key.
- **The text-message app does not open** (desktop) → the "Copy the link" button under "Send to Tom".

## What Was Simplified and Why
- **Text-message link** instead of push notifications — no server and no account. The fuller version needs a push service and device registration.
- **One second key per parent** instead of several — keeps the decision rule obvious. The fuller version needs a rule for disagreement.
- **Euros only** — the case set and the demo use euros.
- **Reset by clearing site data** instead of unpair screens — pairing is a once-in-a-while action for a proof of concept.

## Decisions and Open Issues
- Six digits, three attempts: one chance in 333,333 of guessing a valid code. Chosen over four digits (one in 3,333) because the code is read once on a call, where six digits are still easy.
- The code covers every field of the request, so the second key approves exactly what they saw.
- The scam script table is frozen in its own commit before the evaluation cases are added; the evaluation reports the result without tuning the table on those cases.
- Uncertainty discussed: whether a link opened from a text message lands in the same browser storage as the pairing. Investigation during the build: open a request link on Android Chrome after pairing in Chrome; the failure mode above covers the case where it does not.
- Open: none.
