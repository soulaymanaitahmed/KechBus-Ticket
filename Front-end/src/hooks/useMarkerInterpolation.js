import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to interpolate between coordinates for smooth marker movement.
 */
export const useMarkerInterpolation = (targetPos, duration = 3000) => {
  const [currentPos, setCurrentPos] = useState(targetPos);
  const startPos = useRef(targetPos);
  const startTime = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    if (!targetPos) return;

    // Reset interpolation whenever targetPos changes
    startPos.current = currentPos || targetPos;
    startTime.current = performance.now();

    const animate = (time) => {
      if (!startTime.current) startTime.current = time;
      const elapsed = time - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease in-out quad for extra smoothness
      const easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const lat = startPos.current.lat + (targetPos.lat - startPos.current.lat) * easedProgress;
      const lng = startPos.current.lng + (targetPos.lng - startPos.current.lng) * easedProgress;

      setCurrentPos({ lat, lng });

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [targetPos, duration]);

  return currentPos;
};
