---
doc: prd
status: approved
---

# Second Key — Product Requirements

A two-phone check for families: before a parent sends money to someone new, their second key calls them back and reads a release code. For the adult child of a parent aged 70 or more.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Two people, two phones. The **parent** sends money; the **second key** is the family member who approves.

1. **Pairing (once, same room).** The parent opens Second Key, chooses "I send the money", and types their own name and phone number and their second key's name and phone number. A QR code and three check words appear. The second key scans the QR code with their phone camera; Second Key opens on their phone with the same three check words. Both tap "The words match". The phones are paired.
2. **Request.** Later, someone asks the parent for money. The parent taps "Someone is asking me to send money", enters the amount and the payee's name, picks who the payee is from five choices, and answers four yes/no questions, one per screen.
3. **Send.** A summary screen shows everything. The parent taps "Send to Tom". Their text-message app opens with a link already written; they press send.
4. **Wait.** The parent's screen says: "Tom will call you on this phone. Only Tom has the code. If anyone else gives you a code or asks you for one, hang up." It has six boxes for the code and a button "Tom said no".
5. **Review.** Tom opens the link. He sees who is asking, the amount, the payee, the answers, and either a matched scam script ("This looks like the fake bank adviser script") or "No known scam script matched". A large button calls Anne on the number saved at pairing.
6. **Decide.** On the call, Tom asks the suggested questions. If he agrees, he ticks "I am on the phone with Anne, on her saved number" and taps "Show the code". The six-digit code appears in large type; he reads it aloud. If he refuses, he taps "I don't agree" and sees what to tell her.
7. **Unlock or stop.** Anne types the code. If it is right, the screen says "Second key turned. You can make this payment in your bank's app." If Tom said no, she taps "Tom said no" and sees: "Do not send the money. Hang up. Call your bank on the number on the back of your card."
8. **Receipts.** Both phones list every request: when, how much, to whom, the matched script, and the decision.

Success: a request goes from Anne's phone to Tom's and comes back as a decision Anne can act on, with the code only ever travelling by voice.

## Screens and Layout
One-column phone layout, one decision per screen, a large primary button at the bottom.

**Parent's phone (warm paper background):**
- Welcome: two choices, "I send the money" and "I'm someone's second key".
- Pairing: four fields, then the QR code with the three check words.
- Home: one large button "Someone is asking me to send money", a smaller "My receipts" link, and the name of the second key.
- Request steps: amount and payee, who the payee is, then the four questions one per screen, then the summary.
- Waiting: the six code boxes, the warning text, and "Tom said no".
- Unlocked: the turned key, the receipt line, and "Done".
- Stopped: the instruction to hang up and call the bank.

**Second key's phone (pale blue background, so the two roles never look alike):**
- Pairing confirmation: the parent's name and the three check words.
- Home: "You are Anne's second key", and "Receipts".
- Request review: the request, the matched script, the questions to ask, the call button, then "Show the code" or "I don't agree".
- Code: the six digits in large type, and "Done".
- Refused: what to tell the parent.

**Demo page:** both phones side by side in phone frames, each running the real app with its own storage, so one screen shows the whole exchange. Links that would travel by text message are delivered to the other phone directly.

## Look and Feel
- Calm, plain, large. Body text at least 20 px, buttons at least 56 px tall.
- Typeface: Atkinson Hyperlegible, designed by the Braille Institute for low-vision readers.
- Colours: warm paper and dark ink for the parent, pale blue for the second key, brass for the key mark, green only for "key turned", red only for "stop".
- One ornament: a brass key that turns when the code is accepted.
- Copy: short sentences, no jargon, never the word "safe" as a verdict.
- Avoid: dashboards, scores, gauges, gradients, stock-photo friendliness.

## Features and Behavior

### Pairing
- As a parent, I want to pair once with my son in the same room so that only his phone can ever give me a code.
  - [ ] Pairing shows a QR code and three check words on the parent's phone.
  - [ ] Opening the QR link on the other phone shows the same three words and the parent's name.
  - [ ] After "The words match" on both phones, the parent's home shows "Your second key: Tom" and the second key's home shows "You are Anne's second key".
  - [ ] Phone numbers must be filled in; pairing does not start without them.

### Making a Request
- As a parent under pressure, I want a few simple questions so that I do not have to explain the situation in writing.
  - [ ] Amount and payee name are required; the amount must be a positive number.
  - [ ] Who the payee is, one of: someone I know in person (family or friend); a business I chose myself; a business or person I already pay, with new bank details; someone I know only online, by phone or by message; an account they say is mine, or a "safe" account.
  - [ ] Four yes/no questions, one per screen: Did they contact you first? Are they rushing you, or warning that something bad happens if you wait? Do they say they are from your bank, the police, the government or a well-known company? Have they told you to keep this quiet, stay on the line, or not tell your bank or family?
  - [ ] The summary shows every answer and lets the parent go back.

### Sending to the Second Key
- [ ] "Send to Tom" opens the text-message app with Tom's number and a message containing the request link.
- [ ] A "Copy the link" fallback is shown under the button.
- [ ] After sending, the parent lands on the waiting screen for that request.

### Reviewing a Request
- As a second key, I want to see what my mother answered and what scam it resembles so that I know what to ask her on the call.
  - [ ] The review shows the parent's name, amount, payee, payee type and the four answers.
  - [ ] If the answers match a known scam script, the review names it, quotes what such callers typically say, and lists the questions to ask.
  - [ ] If no script matches, it says "No known scam script matched. You are still the second key: call before you decide."
  - [ ] A call button dials the parent's number saved at pairing. The number in the link is never used.
  - [ ] A request that does not belong to this pairing is refused with "This request is not from Anne's phone".

### Releasing the Code
- [ ] "Show the code" is disabled until the second key ticks "I am on the phone with Anne, on her saved number".
- [ ] The code is six digits and is computed from the pairing secret and every field of the request.
- [ ] The parent's phone never displays the code.
- [ ] The parent has three attempts. After three wrong codes the request is locked and the screen tells her to stop and call Tom.
- [ ] A code made for one request does not unlock any other request, and changing any field of the request (amount, payee) makes its code invalid.

### Refusing
- [ ] "I don't agree" on the second key's phone shows what to tell the parent: do not send, hang up, call the bank on the number on the card.
- [ ] "Tom said no" on the parent's phone shows the same instruction and records the refusal.

### Receipts
- [ ] Each phone lists requests newest first: date and time, amount, payee, matched script, decision (approved, refused, locked, waiting).

### Demo Page
- [ ] Opens both phones side by side with separate storage, pairing and request links delivered across without a text message.

## States and Boundaries
- **First use** — the welcome screen with the two roles.
- **Not paired** — the request button is not available; the home screen offers pairing.
- **Waiting** — a request was sent and has no decision yet; reopening the app returns to its waiting screen.
- **Wrong code** — "That code does not match. 2 tries left."
- **Locked** — three wrong codes; the request cannot be unlocked any more.
- **Foreign request** — a link from another pairing is refused on the second key's phone.
- **What persists** — pairing and receipts stay on each phone until the person removes them. Nothing is stored anywhere else.
- **Boundary** — Second Key never moves money and never connects to a bank. The parent still pays in their own bank's app after the key turns.

## Product Decisions
- The code travels only by voice, on the second key's call — this is the kernel; it makes the call-back mandatory.
- Every request to someone new goes to the second key, whatever the answers — a matched script informs the call, it does not replace it.
- Named scripts, no score — a number invites argument; a named script tells the second key what to ask.
- English interface for the proof of concept — French comes later.
- Pairing in person by QR code — the same setup a bank uses for this kind of trusted contact.
- No runtime AI model — a static page cannot hold a model API key, and every decision is a fixed rule.

## What We're Building
Pairing with check words; the request with five payee types and four questions; sending by text-message link; the review with scripts and the call button; the six-digit release code with three attempts; refusal on both phones; receipts on both phones; the side-by-side demo page.

## Deferred From the POC
- Several second keys and an unreachable-second-key fallback — needs rules for who wins when two disagree.
- Unpairing and re-pairing screens — clearing the browser's site data resets a phone for now.
- Speech input for the questions — needs a model and a server to hold its key.
- French interface.

## Possible Later Enhancements
- A family code word for "Hi Mum" message scams.
- A bank-side integration where a new payee only activates with the release code.
- Reminders to rehearse the routine once a month.

## Non-Goals
- Detecting scams automatically — the second key decides, with the parent, on a call.
- Holding or blocking payments — Second Key has no access to any bank.
- Storing data on a server — nothing leaves the phones except the text message the parent sends.

## Open Questions
None blocking `4-spec`.
