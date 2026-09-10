// animations.js — transitions for the now-playing widget.
//
// Supported `animation` values (URL param `?animation=`):
//   up, down, left, right,
//   fade, fadezoom, fadeup, fadedown, fadeleft, faderight,
//   zoomin, zoomout, flipx, flipy, spin, glitch, cassette,
//   pop, blur, wipe
//
// `animate(element, scale, animation, instant)` returns a Promise that
// resolves when the transition finishes. scale: 1 = visible, 0 = hidden.

let TRANSITION_MS = 1000;

window.setTransitionDuration = (ms) => {
  const n = Number(ms);
  TRANSITION_MS = Number.isFinite(n) ? Math.min(Math.max(n, 0), 5000) : 1000;
};

window.getTransitionDuration = () => TRANSITION_MS;

window.TUNA_ANIMATIONS = [
  'up', 'down', 'left', 'right',
  'fade', 'fadezoom', 'fadeup', 'fadedown', 'fadeleft', 'faderight',
  'zoomin', 'zoomout', 'flipx', 'flipy', 'spin', 'glitch', 'cassette',
  'pop', 'blur', 'wipe',
];

// Per-element pending timeout so rapid song changes don't stack timers.
const pendingTimers = new WeakMap();

const getStyles = (scale, animation, element, instant) => {
  const d = (1 - scale) * 200;
  switch (animation) {
    case 'up': return { transform: `translateY(${d}%)` };
    case 'down': return { transform: `translateY(${-d}%)` };
    case 'left': return { transform: `translateX(${-d}%)` };
    case 'right': return { transform: `translateX(${d}%)` };
    case 'fade': return { opacity: scale };
    case 'fadezoom': return { opacity: scale, transform: `scale(${0.8 + scale * 0.2})` };
    case 'fadeup': return { opacity: scale, transform: `translateY(${d}%)` };
    case 'fadedown': return { opacity: scale, transform: `translateY(${-d}%)` };
    case 'fadeleft': return { opacity: scale, transform: `translateX(${-d}%)` };
    case 'faderight': return { opacity: scale, transform: `translateX(${d}%)` };
    case 'zoomin': return { opacity: scale, transform: `scale(${1.5 - scale * 0.5})` };
    case 'zoomout': return { opacity: scale, transform: `scale(${0.5 + scale * 0.5})` };
    case 'flipx': return { opacity: scale, transform: `perspective(600px) rotateX(${(1 - scale) * 90}deg)` };
    case 'flipy': return { opacity: scale, transform: `perspective(600px) rotateY(${(1 - scale) * 90}deg)` };
    case 'spin': return { opacity: scale, transform: `rotate(${(1 - scale) * 180}deg) scale(${scale})` };
    case 'pop': return { opacity: scale, transform: `scale(${scale === 1 ? 1 : 0.6})` };
    case 'blur': return { opacity: scale, filter: `blur(${(1 - scale) * 12}px)` };
    case 'wipe': return { opacity: scale, clipPath: scale === 1 ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)' };

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
      if (instant) return { opacity: scale, transform: 'translateX(0) scaleX(1)' };

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
    if (!element) { resolve(); return; }

    // Cancel any pending resolve from a previous interrupted animation.
    const prev = pendingTimers.get(element);
    if (prev) clearTimeout(prev);

    // `pop` wants a bouncy easing, `wipe` wants clip-path eased linearly.
    let easing = 'ease-in-out';
    if (animation === 'pop') easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
    if (animation === 'wipe') easing = 'ease';

    try {
      element.getAnimations().forEach(a => { try { a.cancel(); } catch (_) {} });
    } catch (_) {}

    const styles = getStyles(scale, animation, element, instant);

    // WAAPI-driven effects (glitch/cassette) handle themselves.
    if (Object.keys(styles).length === 0) {
      if (instant) { resolve(); return; }
      const t = setTimeout(resolve, TRANSITION_MS);
      pendingTimers.set(element, t);
      return;
    }

    // Clear properties this effect doesn't use so old values don't leak.
    if (styles.opacity === undefined) element.style.opacity = '';
    if (styles.transform === undefined) element.style.transform = '';
    if (styles.filter === undefined) element.style.filter = '';
    if (styles.clipPath === undefined) element.style.clipPath = '';

    if (instant || TRANSITION_MS === 0) {
      element.style.transition = 'none';
      Object.assign(element.style, styles);
      // Force reflow so the next animated change transitions correctly.
      void element.offsetWidth;
      resolve();
      return;
    }

    element.style.transition = Object.keys(styles)
      .map(p => {
        const cssProp = p.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        return `${cssProp} ${TRANSITION_MS}ms ${easing}`;
      })
      .join(', ');

    // Assign in next frame so the transition actually runs when the
    // previous state was just set (e.g. rapid song changes).
    requestAnimationFrame(() => {
      Object.assign(element.style, styles);
    });

    const t = setTimeout(resolve, TRANSITION_MS + 30);
    pendingTimers.set(element, t);
  });
