import React, { useEffect, useRef } from 'react';
import OverlayMarker from './OverlayMarker';

export default function AnimatedBusMarker({
  map, position, heading = 0, speed = 0, stopped = false,
  lineNum = 'N1', isFocused = false,
}) {
  const elementRef = useRef(null);

  if (!elementRef.current && typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      transform: translate(-50%, -50%);
      width: 44px; height: 44px;
      border-radius: 50%;
      background: #4f46e5;
      border: 3px solid white;
      box-shadow: 0 4px 16px rgba(79,70,229,0.4);
      display: flex; align-items: center; justify-content: center;
      animation: busPulse 2s ease-out infinite;
      cursor: pointer;
      z-index: 1;
    `;

    // Simple bus icon SVG (white)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'white');
    svg.innerHTML = `<path d="M17 20H7V21C7 21.55 6.55 22 6 22H5C4.45 22 4 21.55 4 21V20H3V12H2V8H3V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V8H22V12H21V20H20V21C20 21.55 19.55 22 19 22H18C17.45 22 17 21.55 17 21V20ZM5 5V14H19V5H5ZM5 16V18H9V16H5ZM15 16V18H19V16H15Z"/>`;
    container.appendChild(svg);

    elementRef.current = container;
  }

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.style.background = isFocused ? '#2563eb' : '#4f46e5';
      elementRef.current.style.boxShadow = isFocused 
        ? '0 0 0 6px rgba(37,99,235,0.4), 0 4px 16px rgba(0,0,0,0.2)' 
        : '0 4px 16px rgba(79,70,229,0.4)';
      elementRef.current.style.animation = isFocused 
        ? 'pulse-border 2s infinite' 
        : 'busPulse 2s ease-out infinite';
      elementRef.current.style.zIndex = isFocused ? 100 : 1;
    }
  }, [isFocused]);

  if (!position || !elementRef.current) return null;

  return (
    <OverlayMarker
      map={map}
      position={position}
      title={`Bus ${lineNum} · ${speed} km/h`}
      content={elementRef.current}
      zIndex={1000}
    />
  );
}
