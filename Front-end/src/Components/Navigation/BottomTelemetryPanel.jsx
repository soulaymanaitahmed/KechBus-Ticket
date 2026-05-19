import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaBusAlt } from 'react-icons/fa';

const BottomTelemetryPanel = forwardRef(function BottomTelemetryPanel({
  selectedLine, busSpeed, updateCountdown, lastUpdate,
}, ref) {
  const speedRef = useRef(null);
  const timerRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    if (speedRef.current) {
      speedRef.current.textContent = `${Math.round(busSpeed)} km/h`;
    }
    lastTickRef.current = Date.now();
  }, [busSpeed]);

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.round((Date.now() - lastTickRef.current) / 1000);
      if (timerRef.current) {
        timerRef.current.textContent = `${Math.max(0, 2 - (secs % 2))} sec`;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useImperativeHandle(ref, () => ({
    updateSpeed(kmh) {
      if (speedRef.current) {
        speedRef.current.textContent = `${Math.round(kmh)} km/h`;
      }
      lastTickRef.current = Date.now();
    }
  }));

  if (!selectedLine) return null;

  return (
    <div className="sn-telemetry">
      {/* Bus info */}
      <div className="sn-telemetry-bus">
        <div className="sn-telemetry-bus-icon">
          <FaBusAlt size={20} />
        </div>
        <div>
          <div className="sn-telemetry-bus-name">Bus <span>{selectedLine.num}</span></div>
          <div className="sn-telemetry-bus-dest">En route vers {selectedLine.to}</div>
        </div>
      </div>

      <div className="sn-telemetry-divider" />

      {/* Stats */}
      <div className="sn-telemetry-stats">
        <div className="sn-telemetry-stat">
          <span className="sn-telemetry-stat-label">Vitesse</span>
          <span className="sn-telemetry-stat-value" ref={speedRef}>{busSpeed} km/h</span>
        </div>

        <div className="sn-telemetry-divider" />

        <div className="sn-telemetry-stat">
          <span className="sn-telemetry-stat-label">Prochaine mise à jour</span>
          <span className="sn-telemetry-stat-value" ref={timerRef}>{updateCountdown} sec</span>
        </div>

        <div className="sn-telemetry-divider" />

        <div className="sn-telemetry-stat">
          <span className="sn-telemetry-stat-label">Dernière mise à jour</span>
          <span className="sn-telemetry-stat-value">{lastUpdate || '12:43:30'}</span>
        </div>
      </div>
    </div>
  );
});

export default BottomTelemetryPanel;
