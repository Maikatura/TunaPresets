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

const applyScrolling = () => {
  
  const detailsElement = document.querySelector('.details');

  const titleWidth = title.scrollWidth;
  const detailsWidth = detailsElement.scrollWidth;
  const overflowWidth = titleWidth - detailsWidth;
  const letterCount = title.textContent.length;
  const animationDuration = letterCount / 3;

  console.log(`Title Width: ${titleWidth}px, Container Width: ${detailsWidth}px, Overflow Width: ${overflowWidth}px`);

  if (overflowWidth > 0) {
    title.style.setProperty('--scroll-distance', `${overflowWidth}px`);
    title.style.setProperty('--scroll-offset', `${detailsWidth + 10}px`);
    title.style.animationDuration = `${animationDuration}s`;
    title.classList.add('scrolling-text');
  } else {
    title.classList.remove('scrolling-text');
    title.style.animationDuration = `0s`;
    title.style.removeProperty('--scroll-distance');
  }

};

const updateNowPlaying = (data) => {
  if (!data || data.cover_path === "n/a" || !data.title || !data.artists) {
    nowPlaying.classList.add('hidden');
    coverImage.classList.add('hidden');
    PlayChangeAnimation(0, false);
    return;
  }

  coverImage.src = data.cover_path;
  title.textContent = data.title;
  artists.textContent = data.artists[0];

  //applyScrolling();

  console.log("update cover");

  const themePresets = urlParams.get('theme');

  if (themePresets !== null && themePresets.toLowerCase() === "simple") {
    updateCoverBackground("");
  } else {
    updateCoverBackground(data.cover_path);
  }
  nowPlaying.classList.remove('hidden'); // Show the element again
  coverImage.classList.remove('hidden');
  applyScrolling();
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
      title.classList.remove('scrolling-text');
      title.style.animationDuration = `0s`;
      title.style.removeProperty('--scroll-distance');
      updateNowPlaying(data);
      PlayChangeAnimation(1, false, () => {
        isUpdateInProgress = false;
      });
    } else {
      PlayChangeAnimation(0, false);
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
      PlayChangeAnimation(0, false);
    });
};

updateNowPlayingData();
PlayChangeAnimation(0, true);

setInterval(updateNowPlayingData, 1000); // Periodically update the Now Playing data every 1 seconds