// main.js — poll Tuna (localhost:1608) and render the overlay.
//
// URL params:
//   ?theme=name            whitelisted stylesheet in css/
//   ?animation=name         see animations.js (default: scale)
//   ?preview=1 | ?demo=1   render placeholder data, no polling
//   ?cover=0               hide cover art
//   ?album=1               show album line (if Tuna provides it)
//   ?progress=1            show progress bar (if Tuna provides progress/duration)
//   ?stay=1                keep last song visible when stopped (default: hide)
//   ?hidepaused=1          also hide when status === paused
//
// Tuna payload shapes differ by source/version. We normalize:
//   { title, artists[]|artist, album, cover_path|cover_url|cover,
//     status: playing|paused|stopped|unknown, progress, duration }

const coverImage = document.getElementById('coverImage');
const titleEl = document.getElementById('title');
const artistsEl = document.getElementById('artists');
const albumEl = document.getElementById('album');
const coverBackground = document.querySelector('.cover-background');
const progressWrap = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');

const POLL_INTERVAL_MS = 1000;
const MAX_MISSES_BEFORE_HIDE = 3;

const THEME_WHITELIST = new Set([
  'default', 'compact', 'simple',
  'neon', 'pill', 'vinyl', 'lowerthird', 'mono',
]);

const themeParam = (urlParams.get('theme') || '').toLowerCase();
const theme = THEME_WHITELIST.has(themeParam) ? themeParam : '';
const animation = (urlParams.get('animation') || 'scale').toLowerCase();
const showCover = urlParams.get('cover') !== '0';
const showAlbum = urlParams.get('album') === '1';
const showProgress = urlParams.get('progress') === '1';
const stayOnStop = urlParams.get('stay') === '1';
const hideOnPause = urlParams.get('hidepaused') === '1';
const isPreview = urlParams.get('preview') === '1' || urlParams.get('demo') === '1';

if (theme) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = `css/${theme}.css`;
  document.head.appendChild(link);
}

let currentData = null;
let misses = 0;
let progressRaf = 0;

const PLACEHOLDER_COVER =
  'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="16" fill="#1b1b22"/><text x="64" y="74" font-size="52" text-anchor="middle" fill="#555">♪</text></svg>`
  );

// ---------- helpers ----------

const normalize = (data) => {
  if (!data || typeof data !== 'object') return null;
  const artists = Array.isArray(data.artists)
    ? data.artists.filter(Boolean)
    : (data.artist ? [String(data.artist)] : []);
  return {
    title: String(data.title || '').trim(),
    artists,
    album: String(data.album || '').trim(),
    cover: data.cover_path || data.cover_url || data.cover || '',
    status: String(data.status || 'unknown').toLowerCase(),
    progress: Number(data.progress),
    duration: Number(data.duration),
    timeLeft: Number(data.time_left),
  };
};

const isValid = (d) =>
  !!d && !!d.title && d.artists.length > 0 && d.cover && d.cover !== 'n/a' && d.status !== 'unknown';

const isSameSong = (a, b) =>
  !!a && !!b &&
  a.title === b.title &&
  a.cover === b.cover &&
  a.status === b.status &&
  a.album === b.album &&
  JSON.stringify(a.artists) === JSON.stringify(b.artists);

const shouldHide = (d) => {
  if (!d) return !stayOnStop;
  if (d.status === 'stopped') return !stayOnStop;
  if (d.status === 'paused' && hideOnPause) return true;
  return false;
};

// Marquee: scroll any overflowing line (title / artist) via CSS vars.
const applyScrolling = (el, container) => {
  if (!el || !container) return;
  el.classList.remove('scrolling-text');
  el.style.removeProperty('--scroll-distance');
  el.style.removeProperty('--scroll-offset');
  el.style.animationDuration = '';
  // Wait a frame so scrollWidth is measured after textContent update.
  requestAnimationFrame(() => {
    const overflow = el.scrollWidth - container.clientWidth;
    if (overflow > 8) {
      el.style.setProperty('--scroll-distance', `${overflow}px`);
      el.style.setProperty('--scroll-offset', `${container.clientWidth + 12}px`);
      el.style.animationDuration = `${Math.min(Math.max(el.textContent.length / 4, 4), 15)}s`;
      el.classList.add('scrolling-text');
    }
  });
};

const resetScrolling = () => {
  [titleEl, artistsEl].forEach(el => {
    if (!el) return;
    el.classList.remove('scrolling-text');
    el.style.animationDuration = '';
    el.style.removeProperty('--scroll-distance');
    el.style.removeProperty('--scroll-offset');
  });
};

const setCover = (src) => {
  if (!coverImage) return;
  const next = src && src !== 'n/a' ? src : PLACEHOLDER_COVER;
  // Cache-bust file:// covers (VLC rewrites the same path); remote URLs keep as-is.
  const bust = next.startsWith('data:') || next.includes('?') ? next : `${next}${next.includes('?') ? '&' : '?'}t=${Date.now()}`;
  if (coverImage.dataset.cur === next) return;
  coverImage.dataset.cur = next;
  coverImage.src = bust;
  if (coverBackground && theme !== 'simple') {
    coverBackground.style.backgroundImage = `url("${bust}")`;
  }
};

if (coverImage) {
  coverImage.addEventListener('error', () => {
    coverImage.dataset.cur = PLACEHOLDER_COVER;
    coverImage.src = PLACEHOLDER_COVER;
  });
}

const setPausedVisual = (paused) => {
  if (nowPlaying) nowPlaying.classList.toggle('is-paused', !!paused);
};

// ---------- progress prediction ----------
// Tuna only reports position ~once/sec, so between polls we predict forward
// from the last report. Reports never move the bar directly — they only steer
// its *speed* (phase-locked loop), so it glides without ever jumping.
// Small disagreements (<0.6s, e.g. Tuna rounding to whole seconds) are ignored;
// big ones (>4s, e.g. a seek) snap. The estimate freezes while paused.
let progressEst = null; // { pos, duration, at, paused, rate } — seconds + timestamp

const normalizeTime = (progress, duration) => {
  let p = progress, d = duration;
  // Some sources report milliseconds — detect and convert to seconds.
  if (d > 36000 || (d > 0 && p > d * 2 && p > 600)) { p /= 1000; d /= 1000; }
  return { p, d };
};

const predictPos = (est, now) => {
  if (!est) return 0;
  if (est.paused) return est.pos;
  return Math.min(est.pos + ((now - est.at) / 1000) * est.rate, est.duration);
};

// Smooth progress bar driven by rAF between polls.
const tickProgress = () => {
  cancelAnimationFrame(progressRaf);
  if (!showProgress || !progressWrap || !progressFill || !progressEst) {
    if (progressWrap) progressWrap.style.display = 'none';
    return;
  }
  progressWrap.style.display = '';
  const step = () => {
    if (!progressEst) return;
    const ratio = predictPos(progressEst, Date.now()) / progressEst.duration;
    progressFill.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
    if (ratio < 1) progressRaf = requestAnimationFrame(step);
  };
  step();
};

// Feed a fresh Tuna report into the estimate.
const feedProgress = (d, reset) => {
  if (!showProgress || !Number.isFinite(d.progress) || !Number.isFinite(d.duration) || d.duration <= 0) {
    progressEst = null;
    tickProgress();
    return;
  }
  const { p, d: dur } = normalizeTime(d.progress, d.duration);
  const now = Date.now();
  const paused = d.status === 'paused';
  const pos = Math.min(Math.max(p, 0), dur);
  if (!reset && progressEst && progressEst.duration === dur) {
    // Same song: steer the speed toward the report; never move the bar instantly.
    const predicted = predictPos(progressEst, now);
    const err = pos - predicted;
    if (Math.abs(err) > 4) {
      progressEst = { pos, duration: dur, at: now, paused, rate: 1 }; // seek: snap
    } else {
      const over = Math.max(Math.abs(err) - 0.6, 0); // deadband absorbs rounding
      const adj = Math.max(Math.min(over * Math.sign(err) * 0.35, 0.25), -0.2);
      progressEst = { pos: predicted, duration: dur, at: now, paused, rate: paused ? 1 : 1 + adj };
    }
  } else {
    progressEst = { pos, duration: dur, at: now, paused, rate: 1 };
  }
  tickProgress();
};

// ---------- render ----------

const render = (d) => {
  titleEl.textContent = d.title;
  artistsEl.textContent = d.artists.join(', ');
  titleEl.title = d.title;
  artistsEl.title = d.artists.join(', ');

  if (albumEl) {
    if (showAlbum && d.album) {
      albumEl.textContent = d.album;
      albumEl.style.display = '';
    } else {
      albumEl.style.display = 'none';
    }
  }

  if (showCover) setCover(d.cover);
  else if (coverImage) coverImage.style.display = 'none';

  feedProgress(d, true); // new song: snap to the reported position

  setPausedVisual(d.status === 'paused');
  nowPlaying.classList.remove('hidden');
  if (coverImage && showCover) coverImage.classList.remove('hidden');

  const details = document.querySelector('.details');
  applyScrolling(titleEl, details);
  applyScrolling(artistsEl, details);
};

const hideOverlay = async () => {
  cancelAnimationFrame(progressRaf);
  progressEst = null;
  if (currentData !== null) {
    await animate(nowPlaying, 0, animation);
    currentData = null;
  } else {
    // Already hidden — make sure it stays hidden instantly.
    await animate(nowPlaying, 0, animation, true);
  }
  nowPlaying.classList.add('hidden');
};

const update = async (raw) => {
  const data = normalize(raw);

  if (shouldHide(data)) {
    await hideOverlay();
    return;
  }

  if (!isValid(data)) {
    // Invalid/unknown payload: keep showing the last good song instead of
    // flashing empty. Only hide if we never had anything valid.
    if (!currentData && !stayOnStop) await hideOverlay();
    return;
  }

  if (isSameSong(data, currentData)) {
    // Same song re-polled: blend the report into the prediction + update paused state.
    feedProgress(data, false);
    setPausedVisual(data.status === 'paused');
    return;
  }

  await animate(nowPlaying, 0, animation);
  currentData = data;
  resetScrolling();
  render(data);
  await animate(nowPlaying, 1, animation);
};

// ---------- polling ----------

const poll = async () => {
  try {
    const res = await fetch('http://localhost:1608', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    misses = 0;
    await update(data);
  } catch (err) {
    misses += 1;
    // Tolerate a few blips (Tuna restarting, source switching) before hiding.
    if (misses >= MAX_MISSES_BEFORE_HIDE) {
      console.warn('Tuna unreachable, hiding overlay.', err);
      await update({ status: 'stopped' });
    }
  } finally {
    setTimeout(poll, POLL_INTERVAL_MS);
  }
};

// ---------- boot ----------

if (isPreview) {
  const demo = normalize({
    title: 'Midnight City Lights (超 Long Title To Demo Scrolling Text Behaviour)',
    artists: ['Demo Artist', 'Feat. Someone'],
    album: 'Demo Album',
    cover_path: '',
    status: 'playing',
    progress: 42,
    duration: 213,
  });
  currentData = null;
  resetScrolling();
  // Use placeholder art in preview so OBS styling works without Tuna running.
  render({ ...demo, cover: '' });
  setCover('');
  animate(nowPlaying, 1, animation, true);
} else {
  animate(nowPlaying, 0, animation, true).then(poll);
}
