const urlParams = new URLSearchParams(window.location.search);
const body = document.getElementsByTagName("BODY")[0];
const nowPlaying = document.querySelector('.now-playing');
const coverImage = document.getElementById('coverImage');
const title = document.getElementById('title');
const artists = document.getElementById('artists');
const album = document.getElementById('album');
const coverBackground = document.querySelector('.cover-background');

let isUpdateInProgress = false;
let currentData = null;
let updateDuration = 1000; // Duration for scaling transitions in milliseconds


const loadThemeStylesheet = (theme) => {
  const head = document.getElementsByTagName('head')[0];
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = `css/${theme}.css`;
  head.appendChild(link);
};

const themePresets = urlParams.get('theme');
if (themePresets) {
  loadThemeStylesheet(themePresets);
}

const PlayChangeAnimation = (scale, shouldBeInstant, callback) => {
  const animationValue = urlParams.get('animation');
  const animationClass = animationValue ? animationValue.toLowerCase() : '';
  const transitionProperties = [];

  const defaultProperties = {
    duration: `${updateDuration}ms`,
    timingFunction: 'ease-in-out'
  };

  body.classList.add('overflow-hidden');

  switch (animationClass) {
    case "up":
      transitionProperties.push({ property: 'transform', value: `translateY(${(1 - scale) * 200}%)`, ...defaultProperties });
      break;
    case "down":
      transitionProperties.push({ property: 'transform', value: `translateY(${(1 - scale) * -200}%)`, ...defaultProperties });
      break;
    case "left":
      transitionProperties.push({ property: 'transform', value: `translateX(${(1 - scale) * -200}%)`, ...defaultProperties });
      break;
    case "right":
      transitionProperties.push({ property: 'transform', value: `translateX(${(1 - scale) * 200}%)`, ...defaultProperties });
      break;
    case "scale":
    default:
      transitionProperties.push({ property: 'transform', value: `scale(${scale})`, ...defaultProperties });
      break;
  }

  // Apply the transitions to the element
  nowPlaying.classList.add('transition-transform', shouldBeInstant ? 'duration-0' : `duration-${updateDuration}`);
  nowPlaying.style.transform = transitionProperties.map(property => property.value).join(' ');


  // Execute callback after animation duration
  setTimeout(callback, shouldBeInstant ? 0 : updateDuration);
};

const updateNowPlaying = (data) => {
  if (!data || data.cover_path === "n/a" || !data.title || !data.artists) {
    nowPlaying.classList.add('hidden');
    coverImage.classList.add('hidden');
    return;
  }

  coverImage.src = data.cover_path;
  title.textContent = data.title;
  artists.textContent = data.artists.join(', ');

  console.log("update cover");

  const themePresets = urlParams.get('theme');

  if (themePresets !== null && themePresets.toLowerCase() === "simple") {
    updateCoverBackground("");
  } else {
    updateCoverBackground(data.cover_path);
  }
  nowPlaying.classList.remove('hidden'); // Show the element again
  coverImage.classList.remove('hidden');
};

const updateCoverBackground = (imageUrl) => {
  coverBackground.style.backgroundImage = `url(${imageUrl})`;
};

const isSameData = (data1, data2) => {
  if (!data1 || !data2 || !data1.artists || !data2.artists) {
    return false;
  }

  return (
    JSON.stringify(data1.artists) === JSON.stringify(data2.artists) &&
    data1.cover_path === data2.cover_path &&
    data1.title === data2.title
  );
};

const isValidData = (data) => {
  return data && data.cover_path !== "n/a" && data.title && data.artists && data.status !== "unknown";
};

const updateNowPlayingDataWithAnimation = (data) => {
  if (isUpdateInProgress) {
    return;
  }

  if (isSameData(data, currentData)) {
    return;
  }

  isUpdateInProgress = true;

  PlayChangeAnimation(0, false, () => {
    if (isValidData(data)) {
      currentData = data;
      updateNowPlaying(data);
      PlayChangeAnimation(1, false, () => {
        isUpdateInProgress = false;
      });
    } else {
      nowPlaying.classList.add('hidden');
      coverImage.classList.add('hidden');
      isUpdateInProgress = false;
    }
  });
};


const updateNowPlayingData = () => {
  fetch('http://localhost:1608')
    .then(response => response.json())
    .then(data => {
      updateNowPlayingDataWithAnimation(data);
    })
    .catch(error => {
      console.error('Error fetching Now Playing data:', error);
      coverImage.src = '';
      title.textContent = '';
      artists.textContent = '';
      nowPlaying.classList.add('hidden');
      coverImage.classList.add('hidden');
      currentData = null;
      isUpdateInProgress = false;
    });
};

const updatePosition = () => {
  const position = urlParams.get('position');

  switch (position ? position.toLowerCase() : '') {
    case "topleft":
      body.classList.add('justify-start', 'items-start');
      break;
    case "bottomleft":
      body.classList.add('justify-start', 'items-end');
      break;
    case "centerleft":
      body.classList.add('justify-start', 'items-center');
      break;
    case "topright":
      body.classList.add('justify-end', 'items-start');
      break;
    case "bottomright":
      body.classList.add('justify-end', 'items-end');
      break;
    case "centerright":
      body.classList.add('justify-end', 'items-center');
      break;
    case "topcenter":
      body.classList.add('justify-center', 'items-start');
      break;
    case "bottomcenter":
      body.classList.add('justify-center', 'items-end');
      break;
    case "center":
      body.classList.add('justify-center', 'items-center');
      break;
    default:
      body.classList.add('justify-start', 'items-start');
      break;
  }

  const durTime = urlParams.get('duration');
  updateDuration = durTime ? parseInt(durTime, 10) : 1000;
};



updatePosition();
updateNowPlayingData();
PlayChangeAnimation(0, true);

setInterval(updateNowPlayingData, 2500); // Periodically update the Now Playing data every 2.5 seconds