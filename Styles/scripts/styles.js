// styles.js — position / background / accent handling from URL params.
//
// Params:
//   ?position=topleft|bottomleft|...|center (default: topleft)
//   ?duration=ms (0–5000, default 1000)
//   ?bgcolor=preset|hex  (e.g. blue, #7c3aed, transparent/none)
//   ?accent=#hex         (accent override, sets --np-accent)
//   ?align=left|center|right

const POSITION_CLASSES = {
  topleft:      ['justify-start', 'items-start'],
  bottomleft:   ['justify-start', 'items-end'],
  centerleft:   ['justify-start', 'items-center'],
  topright:     ['justify-end', 'items-start'],
  bottomright:  ['justify-end', 'items-end'],
  centerright:  ['justify-end', 'items-center'],
  topcenter:    ['justify-center', 'items-start'],
  bottomcenter: ['justify-center', 'items-end'],
  center:       ['justify-center', 'items-center'],
};

window.TUNA_POSITIONS = Object.keys(POSITION_CLASSES);

const BG_PRESETS = {
  blue:   'rgba(37, 99, 235, 0.85)',
  red:    'rgba(220, 38, 38, 0.85)',
  gray:   'rgba(55, 65, 81, 0.85)',
  purple: 'rgba(124, 58, 237, 0.85)',
  green:  'rgba(22, 163, 74, 0.85)',
  dark:   'rgba(10, 10, 14, 0.82)',
  black:  'rgba(0, 0, 0, 0.85)',
};

const isHexColor = (v) => /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v || '');

const updateBackgroundColor = () => {
  const raw = (urlParams.get('bgcolor') || '').trim().toLowerCase();
  if (!raw || raw === 'none' || raw === 'transparent') return;

  const resolved = BG_PRESETS[raw] || (isHexColor(raw) ? raw : null);
  if (!resolved) return;

  // Prefer CSS variable (used by overlay.css + all new themes).
  document.documentElement.style.setProperty('--np-bg', resolved);
  // Backward compat: old Tailwind-based bg-*-800 classes can't be generated
  // at runtime by the CDN, so also set an inline background as fallback.
  if (nowPlaying) {
    nowPlaying.style.background = resolved;
    nowPlaying.classList.add('has-custom-bg');
  }
};

const updateAccent = () => {
  const raw = (urlParams.get('accent') || '').trim();
  if (isHexColor(raw)) {
    document.documentElement.style.setProperty('--np-accent', raw);
  }
};

const updatePosition = () => {
  const position = (urlParams.get('position') || 'topleft').toLowerCase();
  const key = POSITION_CLASSES[position] ? position : 'topleft';
  const classes = POSITION_CLASSES[key];

  // Modern path: CSS in overlay.css positions via body[data-position].
  body.dataset.position = key;
  // Legacy path: keep Tailwind flex utilities working when present.
  body.classList.add('flex', 'w-full', ...classes);
  body.style.minHeight = '100vh';

  const rawDuration = urlParams.get('duration');
  const parsed = parseInt(rawDuration, 10);
  setTransitionDuration(Number.isFinite(parsed) ? parsed : 1000);
};

const updateAlign = () => {
  const align = (urlParams.get('align') || '').toLowerCase();
  if (['left', 'center', 'right'].includes(align)) {
    document.documentElement.style.setProperty('--np-align',
      align === 'left' ? 'left' : align === 'right' ? 'right' : 'center');
  }
};

updateBackgroundColor();
updateAccent();
updatePosition();
updateAlign();
