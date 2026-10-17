// Draws the two README figures as HTML and screenshots them with Playwright's Chromium.
// docs/images/release-code.png: how the release code travels between the two phones.
// docs/images/evaluation.png: every evaluation case, scored by the same matchScripts() as the app.
// Usage: node scripts/figures.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { matchScripts } from '../src/core/rules.ts';
import type { PayeeKind } from '../src/core/request.ts';

type Case = {
  id: string;
  kind: 'scam' | 'ordinary';
  family: string;
  title: string;
  answers: { payee_kind: PayeeKind; contacted_first: boolean; hurry: boolean; authority: boolean; secrecy: boolean };
};

const root = new URL('..', import.meta.url);
const { cases } = JSON.parse(readFileSync(new URL('cases/cases.json', root), 'utf8')) as { cases: Case[] };

const scored = cases.map((c) => {
  const matched = matchScripts({
    payeeKind: c.answers.payee_kind,
    answers: {
      contactedFirst: c.answers.contacted_first,
      hurry: c.answers.hurry,
      authority: c.answers.authority,
      secrecy: c.answers.secrecy,
    },
  });
  const main = matched.find((s) => s.named);
  return { ...c, raised: matched.length > 0, correct: Boolean(main && main.families.includes(c.family)) };
});

const HEAD = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#fff;font-family:'Atkinson Hyperlegible',sans-serif;color:#1B2433}
#fig{width:1200px;box-sizing:border-box;padding:28px 28px 24px}
</style>`;

const FLOW = `${HEAD}
<style>
#fig{display:grid;grid-template-columns:150px repeat(4,1fr);column-gap:16px;row-gap:12px}
.lane{font-size:16px;font-weight:700;align-self:center;line-height:1.25}
.lane span{display:block;font-weight:400;font-size:14px;color:#5b6472}
.step{border-radius:12px;padding:14px 16px;font-size:15px;line-height:1.4}
.p{background:#FBF7EF}.k{background:#EEF4FA}
.step b{display:block;font-size:17px;margin-bottom:4px}
.via{grid-column:span 1;font-size:14px;color:#5b6472;text-align:center;align-self:center;line-height:1.35}
.via i{font-style:normal;display:block;color:#A87A2A;font-size:18px}
.code{font-family:'IBM Plex Mono',monospace;font-size:12.5px;white-space:nowrap;color:#1B2433;margin-top:8px;line-height:1.55}
.code em{font-style:normal;font-size:20px;letter-spacing:3px;color:#A87A2A}
.ok{color:#1E6B45;font-weight:700}.no{color:#A3271F;font-weight:700}
.empty{visibility:hidden}
</style>
<div id="fig">
<div class="lane">Parent<span>sends the money</span></div>
<div class="step p"><b>1. Pair once</b>Shows a QR code. Both phones keep the same 32-byte secret and show the same three check words.</div>
<div class="step p"><b>2. Ask</b>Amount, payee, who the payee is, four yes/no answers.</div>
<div class="step empty"></div>
<div class="step p"><b>4. The key turns</b>Types the six digits. The phone recomputes the code and compares. <span class="ok">Match: send.</span> <span class="no">Three misses: locked.</span></div>

<div></div>
<div class="via"><i>&#8597;</i>same room</div>
<div class="via"><i>&#8595;</i>text message: the request, never the secret</div>
<div class="via"><i>&#8593;</i>voice call to the number saved at pairing</div>
<div class="via"></div>

<div class="lane">Second key<span>approves</span></div>
<div class="step k"><b>1. Pair once</b>Scans the QR code and keeps the secret.</div>
<div class="step k"><b>2. Briefing</b>The scam script the answers match, and the questions to ask.</div>
<div class="step k"><b>3. Call back</b>Reads the code aloud.<div class="code">HMAC-SHA-256(secret, request)<br>RFC 4226 truncation<br><em>482 913</em></div></div>
<div class="step empty"></div>
</div>`;

const families = [...new Set(scored.filter((r) => r.kind === 'scam').map((r) => r.family))];
const rows = families
  .map((f) => {
    const list = scored.filter((r) => r.family === f);
    const cells = list.map((r) => `<span class="sq ${r.correct ? 'named' : 'missed'}" title="${r.id}"></span>`).join('');
    return `<div class="lab">${f.replace(/_/g, ' ')}</div><div class="cells">${cells}</div><div class="n">${list.filter((r) => r.correct).length} of ${list.length}</div>`;
  })
  .join('');
const ordinary = scored.filter((r) => r.kind === 'ordinary');
const ordCells = ordinary.map((r) => `<span class="sq ${r.raised ? 'raised' : 'quiet'}" title="${r.id}"></span>`).join('');

const EVAL = `${HEAD}
<style>
#fig{display:grid;grid-template-columns:220px auto 1fr;column-gap:18px;row-gap:10px;align-items:center;width:760px}
.lab{font-size:16px;text-align:right}
.cells{display:flex;gap:7px}
.n{font-size:15px;color:#5b6472}
.sq{width:24px;height:24px;border-radius:5px;box-sizing:border-box;display:inline-block}
.named{background:#1B2433}
.missed{border:2px solid #A3271F}
.quiet{border:2px solid #b8bec7}
.raised{background:#A87A2A}
.gap{grid-column:1 / 4;height:8px}
.key{grid-column:2 / 4;font-size:14px;color:#5b6472;display:flex;gap:18px;margin-top:6px}
.key span.sq{width:14px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:5px}
</style>
<div id="fig">
${rows}
<div class="gap"></div>
<div class="lab">ordinary payments</div><div class="cells">${ordCells}</div><div class="n">${ordinary.filter((r) => !r.raised).length} of ${ordinary.length} quiet</div>
<div></div><div class="key"><span><span class="sq named"></span>scam named</span><span><span class="sq missed"></span>missed</span><span><span class="sq quiet"></span>no script raised</span><span><span class="sq raised"></span>script raised</span></div>
</div>`;

const browser = await chromium.launch();
for (const [html, out] of [
  [FLOW, 'docs/images/release-code.png'],
  [EVAL, 'docs/images/evaluation.png'],
] as const) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1260, height: 900 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#fig').screenshot({ path: fileURLToPath(new URL(out, root)) });
  await page.close();
  console.log(out);
}
await browser.close();
