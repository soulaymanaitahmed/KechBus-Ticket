import React, { useEffect, useRef, useState } from 'react';
import { Polyline } from '@react-google-maps/api';

export default function RouteRenderer({ path, active = true }) {
  const [flowOffset, setFlowOffset] = useState('0%');
  const rafRef = useRef(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!active || !path?.length) return;
    let isActive = true;
    const tick = () => {
      if (!isActive) return;
      offsetRef.current = (offsetRef.current + 0.15) % 100;
      setFlowOffset(`${offsetRef.current}%`);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      isActive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, path?.length]);

  if (!path?.length) return null;

  const flowIcons = window.google?.maps ? [{
    icon: {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 2,
      strokeColor: '#4f46e5',
      strokeOpacity: 0.7,
      fillColor: '#7c3aed',
      fillOpacity: 0.5,
    },
    offset: flowOffset,
    repeat: '100px',
  }] : [];

  return (
    <>
      {/* Outer glow */}
      <Polyline
        path={path}
        options={{
          strokeColor: '#4f46e5',
          strokeOpacity: 0.15,
          strokeWeight: 16,
          clickable: false,
          zIndex: 1,
        }}
      />
      {/* Core indigo line */}
      <Polyline
        path={path}
        options={{
          strokeColor: '#4f46e5',
          strokeOpacity: 1,
          strokeWeight: 5,
          clickable: false,
          zIndex: 2,
        }}
      />
      {/* Flow arrows */}
      {active && flowIcons.length > 0 && (
        <Polyline
          path={path}
          options={{
            strokeColor: '#4f46e5',
            strokeOpacity: 0,
            strokeWeight: 0,
            icons: flowIcons,
            clickable: false,
            zIndex: 3,
          }}
        />
      )}
    </>
  );
}
