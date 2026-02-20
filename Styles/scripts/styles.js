// styles.js

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

const updateBackgroundColor = () => {
  const bg = urlParams.get('bgcolor');
  if (bg) {
    nowPlaying.classList.add(`bg-${bg}-800`, 'shadow-lg');
  }
};

const updatePosition = () => {
  const position = urlParams.get('position')?.toLowerCase() ?? '';
  const classes = POSITION_CLASSES[position] ?? POSITION_CLASSES.topleft;
  body.classList.add(...classes);

  const duration = urlParams.get('duration');
  setTransitionDuration(duration ? parseInt(duration, 10) : 1000);
};

updateBackgroundColor();
updatePosition();