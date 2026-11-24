/**
 * Inline SVG UI icons replacing Unicode symbols (\u2316, \u26F6, \u229F) that
 * lack glyphs in standard Windows, Linux, and Android font stacks (#11065).
 */

export function renderExpandIconSvg(size: number | string = 14): string {
  const s = String(size);
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`;
}

export function renderCollapseIconSvg(size: number | string = 14): string {
  const s = String(size);
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>`;
}

export function renderCrosshairIconSvg(size: number | string = '1em'): string {
  const s = String(size);
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>`;
}

const interfaceIcons = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
  laptop: '<rect x="5" y="4" width="14" height="12" rx="2"/><path d="m5 16-3 4h20l-3-4"/>',
  chart: '<path d="M3 4v16h18M7 14l4-4 4 3 5-6"/>',
  boxes: '<path d="m12 2 4 2.5v5L12 12 8 9.5v-5L12 2ZM8 10l-5 3v5l5 3 4-3v-6m4-2 5 3v5l-5 3-4-3"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19m0-14-1.5 1.5m-11 11L5 19"/>',
  moon: '<path d="M20 15A8.5 8.5 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  link: '<path d="M10 13a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7m2.4 4.5a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  dashboard: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M11 9v11"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0v5l-2 3h16l-2-3V8Zm-8 12a2 2 0 0 0 4 0"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  pizza: '<path d="M11 21 3 5a18 18 0 0 1 18 1L11 21ZM4 8a15 15 0 0 1 15 1"/><circle cx="11" cy="11" r=".7"/><circle cx="13" cy="15" r=".7"/>',
  user: '<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m10 3-.7 2.3-2 .9-2.1-1.1L3 8.9l1.6 1.7v2.8L3 15.1l2.2 3.8 2.1-1.1 2 .9.7 2.3h4l.7-2.3 2-.9 2.1 1.1 2.2-3.8-1.6-1.7v-2.8L21 8.9l-2.2-3.8-2.1 1.1-2-.9L14 3Z"/>',
};

export function renderUiIconSvg(icon: keyof typeof interfaceIcons, size = 16): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${interfaceIcons[icon]}</svg>`;
}
