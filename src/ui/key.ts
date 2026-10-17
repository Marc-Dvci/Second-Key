// The brass key, the app's only ornament. It turns when the code is accepted.
const SVG_NS = 'http://www.w3.org/2000/svg';

export function keyMark(className = ''): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `key-mark ${className}`.trim());
  svg.innerHTML =
    '<circle cx="20" cy="32" r="13" fill="none" stroke="currentColor" stroke-width="6"/>' +
    '<circle cx="20" cy="32" r="3.5" fill="currentColor"/>' +
    '<path d="M33 29h27v6h-5v8h-6v-8h-4v6h-6v-6h-6z" fill="currentColor"/>';
  return svg;
}
