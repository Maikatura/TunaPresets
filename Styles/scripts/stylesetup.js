const urlStylesParams = new URLSearchParams(window.location.search);

const nowPlayingElement = document.querySelector('.now-playing');

const updateBackgroundColor = () => {
    const backgroundColor = urlStylesParams.get('bgcolor');
    if (backgroundColor) {
        nowPlayingElement.classList.add("bg-"+backgroundColor+"-800");
        nowPlayingElement.classList.add("shadow-lg");
    }
}

const updatePosition = () => {
    const position = urlStylesParams.get('position');

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


updateBackgroundColor();
updatePosition();