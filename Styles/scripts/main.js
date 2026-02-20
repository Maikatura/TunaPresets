const coverImage = document.getElementById('coverImage');
const title = document.getElementById('title');
const artists = document.getElementById('artists');
const coverBackground = document.querySelector('.cover-background');

const POLL_INTERVAL_MS = 1000;
const theme = urlParams.get('theme')?.toLowerCase() ?? '';
const animation = urlParams.get('animation')?.toLowerCase() ?? 'scale';

let currentData = null;

if (theme) {
  const link = Object.assign(document.createElement('link'), {
    rel: 'stylesheet', type: 'text/css', href: `css/${theme}.css`
  });
  document.head.appendChild(link);
}

const applyScrolling = () => {
  const details = document.querySelector('.details');
  const overflow = title.scrollWidth - details.scrollWidth;
  if (overflow > 0) {
    title.style.setProperty('--scroll-distance', `${overflow}px`);
    title.style.setProperty('--scroll-offset', `${details.scrollWidth + 10}px`);
    title.style.animationDuration = `${title.textContent.length / 3}s`;
    title.classList.add('scrolling-text');
  } else {
    title.classList.remove('scrolling-text');
    title.style.animationDuration = '0s';
    title.style.removeProperty('--scroll-distance');
  }
};

const resetScrolling = () => {
  title.classList.remove('scrolling-text');
  title.style.animationDuration = '0s';
  title.style.removeProperty('--scroll-distance');
};

const isValid = (data) =>
  data?.cover_path !== 'n/a' && data?.title && data?.artists && data?.status !== 'unknown';

const isSame = (a, b) =>
  a && b &&
  a.title === b.title &&
  a.cover_path === b.cover_path &&
  JSON.stringify(a.artists) === JSON.stringify(b.artists);

const render = (data) => {
  coverImage.src = data.cover_path;
  title.textContent = data.title;
  artists.textContent = data.artists[0];
  coverBackground.style.backgroundImage = theme === 'simple' ? '' : `url(${data.cover_path})`;
  nowPlaying.classList.remove('hidden');
  coverImage.classList.remove('hidden');
  applyScrolling();
};

const hide = () => {
  nowPlaying.classList.add('hidden');
  coverImage.classList.add('hidden');
};

const update = async (data) => {
  if (isSame(data, currentData)) return;

  await animate(nowPlaying, 0, animation);

  if (isValid(data)) {
    currentData = data;
    resetScrolling();
    render(data);
    await animate(nowPlaying, 1, animation);
  } else {
    currentData = null;
    hide();
  }
};

const poll = async () => {
  try {
    const res = await fetch('http://localhost:1608');
    const data = await res.json();
    await update(data);
  } catch (err) {
    console.error('Error fetching Now Playing data:', err);
    await update(null);
  } finally {
    setTimeout(poll, POLL_INTERVAL_MS);
  }
};

animate(nowPlaying, 0, animation, true).then(poll);