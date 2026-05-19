import { useEffect, useRef } from 'react';

export function NavigationCameraController({ mapRef, targetPosition, active, stopped }) {
  const targetRef = useRef(null);
  const rafRef = useRef(null);
  const initialFitDone = useRef(false);
  const userZoomRef = useRef(null);
  const lastZoomChangeRef = useRef(0);

  useEffect(() => {
    targetRef.current = targetPosition;
  }, [targetPosition?.lat, targetPosition?.lng]);

  // Listen for user-initiated zoom changes
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !active) return;
    const listener = map.addListener('zoom_changed', () => {
      userZoomRef.current = map.getZoom();
      lastZoomChangeRef.current = Date.now();
    });
    return () => {
      if (listener) window.google?.maps?.event?.removeListener(listener);
    };
  }, [active, mapRef]);

  useEffect(() => {
    if (!active || !mapRef?.current) {
      initialFitDone.current = false;
      return;
    }

    if (!initialFitDone.current && targetPosition) {
      initialFitDone.current = true;
      mapRef.current.setZoom(16);
      mapRef.current.panTo(targetPosition);
    }

    let frameCount = 0;

    const tick = () => {
      const map = mapRef.current;
      const target = targetRef.current;
      if (!map || !target?.lat) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Only update every 3rd frame (~20fps) for smoother camera
      frameCount++;
      if (frameCount % 3 !== 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const center = map.getCenter();
      if (center) {
        const lerpFactor = stopped ? 0.03 : 0.05;
        const lat = center.lat() + (target.lat - center.lat()) * lerpFactor;
        const lng = center.lng() + (target.lng - center.lng()) * lerpFactor;
        map.moveCamera({ center: { lat, lng } });
      }

      // Respect user zoom for 5 seconds after they change it
      const timeSinceUserZoom = Date.now() - lastZoomChangeRef.current;
      if (timeSinceUserZoom < 5000 && userZoomRef.current != null) {
        // Don't fight user zoom
      } else {
        const currentZoom = map.getZoom() || 16;
        const targetZoom = stopped ? 16.5 : 16;
        const diff = targetZoom - currentZoom;
        if (Math.abs(diff) > 0.05) {
          map.moveCamera({ zoom: currentZoom + diff * 0.03 });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, mapRef, stopped, targetPosition]);
}
