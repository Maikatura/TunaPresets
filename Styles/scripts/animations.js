// animations.js

let TRANSITION_MS = 1000;

window.setTransitionDuration = (ms) => {
    TRANSITION_MS = ms;
};

const getStyles = (scale, animation, element) => {
    const d = (1 - scale) * 200;
    switch (animation) {
        case 'up': return { transform: `translateY(${d}%)` };
        case 'down': return { transform: `translateY(${-d}%)` };
        case 'left': return { transform: `translateX(${-d}%)` };
        case 'right': return { transform: `translateX(${d}%)` };
        case 'fade': return { opacity: scale };
        case 'fadezoom': return { opacity: scale, transform: `scale(${0.8 + scale * 0.2})` };


        // new!
        case 'fadeup': return { opacity: scale, transform: `translateY(${d}%)` };
        case 'fadedown': return { opacity: scale, transform: `translateY(${-d}%)` };
        case 'fadeleft': return { opacity: scale, transform: `translateX(${-d}%)` };
        case 'faderight': return { opacity: scale, transform: `translateX(${d}%)` };
        case 'zoomin': return { opacity: scale, transform: `scale(${1.5 - scale * 0.5})` };
        case 'zoomout': return { opacity: scale, transform: `scale(${0.5 + scale * 0.5})` };
        case 'flipx': return { transform: `rotateX(${(1 - scale) * 90}deg)` };
        case 'flipy': return { transform: `rotateY(${(1 - scale) * 90}deg)` };
        case 'spin': return { opacity: scale, transform: `rotate(${(1 - scale) * 180}deg) scale(${scale})` };
        case 'glitch': {
            const visible = scale === 1;
            if (instant) return { opacity: scale, transform: 'translate(0, 0)' };

            const glitchKeyframes = [
                { opacity: 0, transform: 'translate(-5px, 2px) skewX(-10deg)', offset: 0 },
                { opacity: 1, transform: 'translate(5px, -2px) skewX(5deg)', offset: 0.2 },
                { opacity: 0.5, transform: 'translate(-3px, 0) skewX(8deg)', offset: 0.4 },
                { opacity: 1, transform: 'translate(3px, 1px) skewX(-5deg)', offset: 0.6 },
                { opacity: 0.8, transform: 'translate(-1px, -1px) skewX(2deg)', offset: 0.8 },
                { opacity: 1, transform: 'translate(0, 0) skewX(0deg)', offset: 1 },
            ];

            element.animate(
                visible ? glitchKeyframes : [...glitchKeyframes].reverse(),
                { duration: TRANSITION_MS, easing: 'ease-in-out', fill: 'forwards' }
            );

            return {};
        }

        case 'cassette': {
            const visible = scale === 1;

            const keyframes = visible ? [
                { opacity: 0, transform: 'translateX(-100%) scaleX(2) skewX(20deg)', offset: 0 },
                { opacity: 1, transform: 'translateX(10%) scaleX(0.95) skewX(-5deg)', offset: 0.6 },
                { opacity: 1, transform: 'translateX(-3%) scaleX(1.02) skewX(2deg)', offset: 0.8 },
                { opacity: 1, transform: 'translateX(0) scaleX(1) skewX(0deg)', offset: 1 },
            ] : [
                { opacity: 1, transform: 'translateX(0) scaleX(1) skewX(0deg)', offset: 0 },
                { opacity: 1, transform: 'translateX(-3%) scaleX(1.02) skewX(2deg)', offset: 0.2 },
                { opacity: 0, transform: 'translateX(100%) scaleX(2) skewX(-20deg)', offset: 1 },
            ];

            element.animate(keyframes, {
                duration: TRANSITION_MS,
                easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
                fill: 'forwards'
            });

            return {};
        }


        default: return { transform: `scale(${scale})` };
    }
};

window.animate = (element, scale, animation, instant = false) =>
    new Promise(resolve => {
        const styles = getStyles(scale, animation, element);

        if (styles.opacity === undefined) element.style.opacity = '';
        if (styles.transform === undefined) element.style.transform = '';

        // if getStyles handled it itself (e.g. glitch), just wait and resolve
        if (Object.keys(styles).length === 0) {
            setTimeout(resolve, instant ? 0 : TRANSITION_MS);
            return;
        }

        element.style.transition = instant ? 'none' : Object.keys(styles)
            .map(p => `${p} ${TRANSITION_MS}ms ease-in-out`)
            .join(', ');

        Object.assign(element.style, styles);
        setTimeout(resolve, instant ? 0 : TRANSITION_MS);
    });