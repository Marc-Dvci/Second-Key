// The demo page: two phones side by side. It carries links between them the way
// a camera or a text message would, and shows when one phone calls the other.
import './demo.css';

type Deliver = { type: 'sk-deliver'; to: 'parent' | 'key'; hash: string; via: string };
type Call = { type: 'sk-call'; caller: string; callee: string; phone: string };

const frames = {
  parent: document.getElementById('parent') as HTMLIFrameElement,
  key: document.getElementById('key') as HTMLIFrameElement,
};
const toast = document.getElementById('toast')!;
const call = document.getElementById('call')!;

function show(el: HTMLElement, html: string, ms: number): void {
  el.innerHTML = html;
  el.hidden = false;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
  window.clearTimeout(Number(el.dataset.timer));
  el.dataset.timer = String(window.setTimeout(() => (el.hidden = true), ms));
}

window.addEventListener('message', (event: MessageEvent<Deliver | Call>) => {
  if (event.origin !== location.origin) return;
  const msg = event.data;
  if (msg?.type === 'sk-deliver') {
    const target = frames[msg.to];
    const arrow = msg.to === 'key' ? '→' : '←';
    show(toast, `<span class="arrow">${arrow}</span> Sent by ${msg.via}`, 4000);
    target.contentWindow!.location.hash = msg.hash;
  } else if (msg?.type === 'sk-call') {
    show(
      call,
      `<span class="ring" aria-hidden="true">☎</span><strong>${msg.caller} is calling ${msg.callee}</strong><span>${msg.phone}</span><small>number saved at pairing</small>`,
      9000,
    );
  }
});

document.getElementById('reset')!.addEventListener('click', () => {
  for (const k of Object.keys(localStorage)) if (k.startsWith('sk:parent:') || k.startsWith('sk:key:')) localStorage.removeItem(k);
  frames.parent.src = './?device=parent';
  frames.key.src = './?device=key';
});

function fit(): void {
  const scale = Math.min(1, (window.innerHeight - 180) / 844, (window.innerWidth - 80) / 2 / 390);
  document.documentElement.style.setProperty('--phone-scale', String(Math.max(0.45, scale)));
}
window.addEventListener('resize', fit);
fit();
frames.parent.src = './?device=parent';
frames.key.src = './?device=key';
