// The pairing QR code, drawn as SVG so it stays sharp at any size.
import QRCode from 'qrcode';
import { h } from './dom.ts';

export async function qrFigure(link: string, label: string): Promise<HTMLElement> {
  const svg = await QRCode.toString(link, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#1b2433', light: '#ffffff' },
  });
  const figure = h('figure', { class: 'qr', 'data-link': link, role: 'img', 'aria-label': label });
  figure.innerHTML = svg;
  return figure;
}
