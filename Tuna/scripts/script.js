const urlParams = new URLSearchParams(window.location.search);
const body = document.getElementsByTagName("BODY")[0];
const nowPlaying = document.querySelector('.now-playing');
const coverImage = document.getElementById('coverImage');
const title = document.getElementById('title');
const artists = document.getElementById('artists');
const album = document.getElementById('album');
const coverContainer = document.querySelector('.cover-container');
const coverBackground = document.querySelector('.cover-background');

let isUpdateInProgress = false;
let currentData = null;
let updateDuration = 1000; // Duration for scaling transitions in milliseconds

const PlayChangeAnimation = (scale, shouldBeInstant) => {
  const animationValue = urlParams.get('animation');
  const animationClass = animationValue ? animationValue.toLowerCase() : '';
  const transitionProperties = [];

  switch (animationClass) {
    case "up":
      transitionProperties.push({ property: 'transform', value: `translateY(${(1 - scale) * 200}%)`, duration: `${updateDuration}ms`, timingFunction: 'ease-in-out' });
      break;
    case "down":
      transitionProperties.push({ property: 'transform', value: `translateY(${(1 - scale) * -200}%)`, duration: `${updateDuration}ms`, timingFunction: 'ease-in-out' });
      break;
    case "left":
      transitionProperties.push({ property: 'transform', value: `translateX(${(1 - scale) * -200}%)`, duration: `${updateDuration}ms`, timingFunction: 'ease-in-out' });
      break;
    case "right":
      transitionProperties.push({ property: 'transform', value: `translateX(${(1 - scale) * 200}%)`, duration: `${updateDuration}ms`, timingFunction: 'ease-in-out' });
      break;
	case "scale":
    default:
      transitionProperties.push({ property: 'transform', value: `scale(${scale})`, duration: `${updateDuration}ms`, timingFunction: 'ease-in-out' });
      break;
  }

  // Apply the transitions to the element
  nowPlaying.style.transition = transitionProperties.map(property => `${property.property} ${shouldBeInstant ? 0 : property.duration} ${property.timingFunction}`).join(', ');

  // Apply the corresponding values for each property
  transitionProperties.forEach(property => {
    nowPlaying.style[property.property] = property.value;
  });
};

const updateNowPlaying = (data) => {
  if (!data || !data.cover_path || !data.title || !data.artists) 
  {
    return;
  }

  coverImage.src = data.cover_path;
  title.textContent = data.title;
  artists.textContent = data.artists.join(', ');

  const themePresets = urlParams.get('theme');

  if (themePresets !== null && themePresets.toLowerCase() === "simple") 
  {
    updateCoverBackground("");
  } 
  else 
  {
    updateCoverBackground(data.cover_path);
  }
};

const updateCoverBackground = (imageUrl) => {
  coverBackground.style.backgroundImage = `url(${imageUrl})`;
};

const isSameData = (data1, data2) => {
  if (!data1 || !data2 || !data1.artists || !data2.artists) 
  {
    return false;
  }

  return (
    JSON.stringify(data1.artists) === JSON.stringify(data2.artists) &&
    data1.cover_path === data2.cover_path &&
    data1.title === data2.title
  );
};

const updateNowPlayingDataWithAnimation = (data) => {
  if (isUpdateInProgress || isSameData(data, currentData)) 
  {
    return;
  }

  currentData = data;
  isUpdateInProgress = true;

  PlayChangeAnimation(0);
  

  setTimeout(() => {
    updateNowPlaying(data);
    PlayChangeAnimation(1);
    isUpdateInProgress = false;
  }, updateDuration);
};

const updateNowPlayingData = () => {
  fetch('http://localhost:1608')
    .then(response => response.json())
    .then(data => {
      updateNowPlayingDataWithAnimation(data);
    })
    .catch(error => {
      console.error('Error fetching Now Playing data:', error);
      isUpdateInProgress = false;
    });
};

const updatePosition = () => {
  const position = urlParams.get('position');

  switch (position ? position.toLowerCase() : '') {
    case "topleft":
      body.style.justifyContent = "flex-start";
      body.style.alignItems = "flex-start";
      break;
    case "bottomleft":
      body.style.justifyContent = "flex-start";
      body.style.alignItems = "flex-end";
      break;
    case "centerleft":
      body.style.justifyContent = "flex-start";
      body.style.alignItems = "center";
      break;
    case "topright":
      body.style.justifyContent = "flex-end";
      body.style.alignItems = "flex-start";
      break;
    case "bottomright":
      body.style.justifyContent = "flex-end";
      body.style.alignItems = "flex-end";
      break;
    case "centerright":
      body.style.justifyContent = "flex-end";
      body.style.alignItems = "center";
      break;
    case "topcenter":
      body.style.justifyContent = "center";
      body.style.alignItems = "flex-start";
      break;
    case "bottomcenter":
      body.style.justifyContent = "center";
      body.style.alignItems = "flex-end";
      break;
    case "center":
      body.style.justifyContent = "center";
      body.style.alignItems = "center";
      break;
    default:
      body.style.justifyContent = "flex-start";
      body.style.alignItems = "flex-start";
      break;
  }

  const durTime = urlParams.get('duration');
  updateDuration = durTime ? durTime : 1000;
};

updatePosition();
updateNowPlayingData();
PlayChangeAnimation(0, true);

setInterval(updateNowPlayingData, 2500); // Periodically update the Now Playing data every 2.5 seconds
