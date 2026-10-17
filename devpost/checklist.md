---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. A request travels to the second key and the code read back unlocks it**
  Becomes usable: On the demo page, the parent makes a request, the second key's phone shows it with a "Show the code" button, and typing that code on the parent's phone turns the key. Pairing is seeded by a test link for now.
  Why now: This is the kernel. Scaffold, release code, links, both phones and the demo delivery all have to work for it, so every later slice lands on a working path.
  PRD ref: `prd.md > The Core Journey` (steps 2-7), `prd.md > Making a Request`, `prd.md > Releasing the Code`, `prd.md > Demo Page`
  Spec ref: `spec.md > Release Code`, `spec.md > Links`, `spec.md > Requests`, `spec.md > App Shell and Router`, `spec.md > Demo Page`, `spec.md > File Structure`
  Build: Scaffold Vite + TypeScript, storage namespaced by `?device=`, `core/code.ts` with RFC 6238 SHA-256 vectors, `core/links.ts`, `core/request.ts`, the ask, wait and review screens, the demo page with two iframes and message delivery.
  Verify (mechanical): `npm test` passes the RFC vectors and link round-trips; a Playwright test drives both demo phones from request to "Second key turned"; a tampered amount in the link yields a code the parent's phone refuses.
  Learner check: Open the demo page, make a request on the left phone, read the code on the right phone, type it on the left, and watch the key turn.
  Commit: `Request, release code and unlock across two phones`

- [x] **2. Two phones pair by QR code with matching check words**
  Becomes usable: The welcome screen, pairing form, QR code and three check words on the parent's phone; the confirmation on the second key's phone; homes that name each other.
  Why now: Replaces the seeded pairing with the real setup before scripts and receipts build on it.
  PRD ref: `prd.md > Pairing`, `prd.md > Screens and Layout`
  Spec ref: `spec.md > Release Code`, `spec.md > Links`, `spec.md > Storage`, `spec.md > Screens`
  Build: Welcome and pair screens, QR SVG, check words from `core/words.ts`, confirmation on both sides, home screens, required phone numbers.
  Verify (mechanical): Unit test that check words are deterministic and match on both sides; Playwright pairs two fresh browser contexts by opening the QR link and reaches both homes.
  Learner check: Start from empty phones on the demo page, pair them, and check the words match.
  Commit: `Pair two phones by QR code`

- [x] **3. The second key sees which scam script the answers match**
  Becomes usable: The review names the matching script, quotes what such callers say, lists questions to ask, or says no known script matched; the call button dials the saved number; foreign requests are refused.
  Why now: Turns the review into the second key's briefing for the call. The table is committed before the evaluation cases exist.
  PRD ref: `prd.md > Reviewing a Request`
  Spec ref: `spec.md > Scam Scripts and Matching`, `spec.md > Screens`
  Build: `core/scripts.ts` table and `core/rules.ts` matching, review layout, `tel:` button with the paired number, demo call banner, pairing-id check.
  Verify (mechanical): Unit tests for each script condition and the no-match case; Playwright checks a "safe account" request shows the fake bank adviser script.
  Learner check: Make a "safe account" request and an ordinary one, and compare what the second key sees.
  Commit: `Name the matching scam script for the second key`

- [x] **4. Refusal, lock and receipts on both phones**
  Becomes usable: "I don't agree" and "Tom said no" paths, three-attempt lock, and a receipts list on each phone.
  Why now: Completes the loop for the outcome that matters most, the refusal.
  PRD ref: `prd.md > Refusing`, `prd.md > Receipts`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Storage`, `spec.md > Data Model`, `spec.md > Screens`
  Build: Refusal screens, attempt counter and lock, receipts view, waiting request reopens on launch.
  Verify (mechanical): Playwright: refusal on both phones; three wrong codes lock the request; receipts list the outcomes after reload.
  Learner check: Refuse a request, then try three wrong codes on another, then open receipts on both phones.
  Commit: `Refusal, lock and receipts`

- [x] **5. The case set shows what the scripts catch**
  Becomes usable: `npm run evaluate` prints and writes how many public scam cases get a named script and how many ordinary payments raise none.
  Why now: Evidence for the impact claim, computed on the frozen table.
  PRD ref: `prd.md > Reviewing a Request`
  Spec ref: `spec.md > Evaluation`
  Build: `cases/cases.json` with sources, `scripts/evaluate.ts`, `docs/evaluation.md`.
  Verify (mechanical): The script runs, every case parses, totals add up, and the table commit predates the cases commit.
  Learner check: Read `docs/evaluation.md` and spot-check two cases against their sources.
  Commit: `Evaluate the scripts on public scam cases`

- [x] **6. Look and feel, accessibility and deployment**
  Becomes usable: The final typography, colours and key animation, an installable manifest, an axe-clean app, and the live site on GitHub Pages.
  Why now: The behaviour is settled, so styling and deployment no longer move under the tests.
  PRD ref: `prd.md > Look and Feel`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Final styles, reduced-motion support, manifest and icon, README, MIT licence, Pages workflow.
  Verify (mechanical): Playwright axe scan reports no violations on every screen; production build succeeds; the deployed URL serves the demo page.
  Learner check: Open the live demo page on a phone and run the whole journey.
  Commit: `Final look, accessibility and Pages deploy`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 1, on the demo page: the journey ran end to end; an empty call box showed between the phones and the phone frames had extra bottom padding, both fixed before slice 2
- [x] Final kick-the-tires exploration and feedback completed — full journey on the deployed site (pair, request, scam briefing, call banner), plus refusal, lock and receipts in the browser tests

## Final Review

- [x] Final review complete — feedback resolved and learner confirms ready to ship
  Findings: none open after the slice 1 layout fixes. Verified: 31 unit tests, 11 browser tests including an axe WCAG 2.2 AA scan of every screen, production build, live deploy.

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: focused alternative, connected to practice that happened during slice 1. The acceptance criterion `prd.md > Releasing the Code` ("changing any field of the request makes its code invalid") became the browser test "a code made for a tampered link does not unlock the real request" in `tests/e2e/journey.spec.ts`; writing it showed the second key's phone ignored a changed copy of a saved request, which led to the refusal in `src/main.ts` (`canonical(known)`).
Route and stops: reference route in the app map: `src/ui/views/wait.ts` (`const check = async`) → `src/core/code.ts` (`releaseCode`) → `src/ui/views/home.ts` (`renderDone`).
Edit outcome: not applicable.
Reflection: not applicable.
Activity mode: focused alternative, prior practice connected.

## Revisions

- Slice 3 landed in two commits, the script table first (`Add scam script table`) — the evaluation cases had to arrive after a committed table, so the table could not be tuned on them.
