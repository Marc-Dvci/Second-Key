---
doc: scope
status: approved
---

# Second Key

A two-person check a family runs before an elderly relative sends money to someone new: a trusted family member calls them back and reads out a release code.

## The Unique Kernel
The release code only reaches the parent by voice, on a call the second key makes to the parent's saved number. The code is computed on the second key's phone from a secret shared at setup and from the exact request (amount, payee, answers), so a scammer on the line cannot produce it, and a code read for one request does not unlock another.

This is the bank's own dual-control and call-back rule, moved into a family, with no bank integration, no account and no server.

## Who It's For
The adult child of a parent aged 70 or more who pays by bank app or phone. Today the child learns about a "safe account" transfer after the money has gone. The parent is the person who presses the buttons; the child is the person outside the pressure.

## The Core Loop
1. Someone asks the parent for money. The parent opens Second Key and taps "Someone is asking me to send money".
2. They enter the amount and the payee, say who the payee is, and answer four yes/no questions.
3. They send the request to their second key by text message.
4. The second key sees the request, the matching scam script if there is one, and calls the parent on the number saved at setup.
5. If they agree, they read the six-digit code aloud. The parent types it, and both phones keep a receipt. If they refuse, the parent's screen says what to do next.

They come back every time money goes to someone new.

## Inspiration & Identity
Calm, plain and large. Feels like a well-made bank letter, warm paper and dark ink, with a brass key as the only ornament. The parent's phone and the second key's phone look slightly different so nobody confuses the two roles. Never says "safe". References: KBC Guardian Angel (Belgium), https://www.kbc.be/retail/en/products/payments/self-banking/on-your-smartphone/mobile/engelbewaarder.html ; Atkinson Hyperlegible typeface, https://www.brailleinstitute.org/freefont/ .

## Why This Matters to the Learner
The learner audits these controls at a bank. A bank never lets one person send a large sum to a new beneficiary alone, and it calls back on a number it already holds. Families have neither. Manipulation fraud in France reached EUR 516 million in 2025, up 34%, with the fake bank adviser as the most frequent script (Banque de France, OSMP report 2025).

## What "Working" Looks Like
Two phones on a table. The parent pairs with the second key by QR code, makes a request for EUR 8,400 to a "safe account", sends it, and waits. The second key's phone names the scam ("fake bank adviser") and shows a button to call the parent's saved number. The second key refuses: the parent's screen says "Hang up. Call your bank on the number on your card." Second take with an ordinary payment: the code is read aloud on the call, typed in, and the key turns.

The "oh, that's cool" beat: the parent's phone never displays the code, and a tampered or replayed code is refused.

## The POC Boundary
- Pairing two phones by QR code, with matching check words on both screens.
- A request with amount, payee, payee type and four yes/no questions.
- Sending the request by text message link.
- The second key's review with a matched scam script from a fixed rule table.
- The release code: computed on both phones, shown only on the second key's phone, typed on the parent's phone, three attempts.
- Refusal path on both phones.
- A receipt list on both phones.
- A demo page showing both phones side by side, for the video.

## Later
- Speech input: the parent describes the call and the same four answers are filled in.
- French interface.
- Several second keys, and a fallback when the second key cannot be reached.
- A code word for "Hi Mum" message scams.
- A bank that gates new payees on the release code.

## Explicitly Cut
- Any connection to a real bank account: no access, no credentials, and the app must work whatever bank the parent uses.
- A risk score: a number invites the parent to argue with it. The app names a script or says none matched.
- Accounts and a server: the two phones share a secret once, in person, which is the setup a bank would require too.
- A runtime AI model: a static page cannot hold an API key safely, and every decision is a fixed rule.
