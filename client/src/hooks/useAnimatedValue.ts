import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from its previous value to a new target
 * using requestAnimationFrame with cubic ease-out.
 * Matches the original index.html anim() function.
 */
export function useAnimatedValue(target: number, duration: number = 600): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;

    if (from === to) {
      setDisplay(to);
      return;
    }

    const t0 = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplay(from + (to - from) * e);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
