import React from 'react';
import './BusMarker.css';

const BusMarker = ({ position, heading }) => {
  return (
    <div
      className="bus-marker-container"
      style={{
        transform: `translate(${position.lat}px, ${position.lng}px)`, // This is handled by the Map component normally, but for custom overlays we might need specific positioning
      }}
    >
      <div
        className="bus-icon-wrapper"
        style={{ transform: `rotate(${heading}deg)` }}
      >
        <div className="bus-pulse" />
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="bus-svg"
        >
          <path
            d="M17 7V3H7V7H3V17H7V21H17V17H21V7H17Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 11H17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="18" r="2" fill="currentColor" />
          <circle cx="17" cy="18" r="2" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
};

export default BusMarker;
