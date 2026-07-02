import { React } from './html.js';

const reduceMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tween a number toward `target` with an ease-out cubic. Returns [display, animating].
// - animateOnMount: sweep up from `from` on first render (rings/bars booting up)
// - otherwise the first render shows `target` instantly and only *changes* animate
//   (so tab switches don't re-count, but logging an expense visibly rolls the number).
export function useAnimatedNumber(target, { duration = 700, animateOnMount = false, from = 0 } = {}) {
  const initial = animateOnMount ? from : target;
  const [display, setDisplay] = React.useState(initial);
  const [animating, setAnimating] = React.useState(false);
  const dispRef = React.useRef(initial);
  const firstRef = React.useRef(true);

  React.useEffect(() => {
    const first = firstRef.current;
    firstRef.current = false;
    if (first && !animateOnMount) return; // already showing target

    const start = dispRef.current;
    if (!Number.isFinite(target) || start === target) return;
    if (reduceMotion()) {
      dispRef.current = target;
      setDisplay(target);
      return;
    }

    let raf;
    const t0 = performance.now();
    setAnimating(true);
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (target - start) * eased;
      dispRef.current = v;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(step);
      else setAnimating(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return [display, animating];
}
