import React, { useMemo } from 'react';
import OverlayMarker from './OverlayMarker';

function getStationStatus(i, currentStationIdx, glowStationIdx, distToNextStation) {
  if (i < currentStationIdx) return 'passed';
  if (glowStationIdx === i || (i === currentStationIdx + 1 && distToNextStation != null && distToNextStation < 120)) return 'approaching';
  if (i === currentStationIdx) return 'active';
  return 'upcoming';
}

function stationContent(name, index, total, status, etaLabel) {
  const isStart = index === 0;
  const isEnd = index === total - 1;
  const isApproaching = status === 'approaching';
  const isActive = status === 'active';

  // Departure station — large green marker + simple white pill label
  if (isStart) {
    return `<div style="position:relative;transform:translate(-50%,-100%);pointer-events:none;">
      <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;border:3px solid white;box-shadow:0 2px 8px rgba(22,163,74,0.4);margin:0 auto;"></div>
      <div style="position:absolute;top:-32px;left:50%;transform:translateX(-50%);background:white;border-radius:20px;padding:6px 12px;font-size:13px;font-weight:600;color:#0f172a;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.1);font-family:Inter,sans-serif;">${name}</div>
    </div>`;
  }

  // Terminus — red teardrop pin
  if (isEnd) {
    return `<div style="position:relative;transform:translate(-50%,-100%);pointer-events:none;">
      <svg width="28" height="36" viewBox="0 0 28 36" style="filter:drop-shadow(0 2px 4px rgba(239,68,68,0.4))">
        <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#ef4444"/>
        <circle cx="14" cy="13" r="5" fill="#fff"/>
      </svg>
      <div style="position:absolute;top:-8px;right:-70px;background:white;border-radius:12px;padding:8px 14px;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.12);font-family:Inter,sans-serif;">
        <div style="font-size:13px;font-weight:600;color:#0f172a;">${name}</div>
        ${etaLabel ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">Arrivée dans</div><div style="font-size:14px;font-weight:600;color:#0f172a;">${etaLabel}</div>` : ''}
      </div>
    </div>`;
  }

  // Active / approaching — white card popup
  if (isActive || isApproaching) {
    const etaSize = isApproaching ? '22px' : '16px';
    const etaColor = isApproaching ? '#4f46e5' : '#0f172a';
    return `<div style="position:relative;transform:translate(-50%,-100%);pointer-events:none;">
      <div style="width:14px;height:14px;border-radius:50%;background:white;border:2px solid #4f46e5;box-shadow:0 2px 6px rgba(79,70,229,0.3);margin:0 auto;"></div>
      <div style="position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:white;border-radius:12px;padding:12px 16px;min-width:160px;box-shadow:0 4px 20px rgba(0,0,0,0.12);font-family:Inter,sans-serif;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:14px;font-weight:600;color:#0f172a;">${name}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M8 19v2"/><path d="M16 19v2"/></svg>
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Arrivée dans</div>
        <div style="font-size:${etaSize};font-weight:800;color:${etaColor};margin-top:2px;">${etaLabel || '2 min'}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:2px;">120 m • 12:45</div>
      </div>
    </div>`;
  }

  // Upcoming — small white dot + optional label card
  return `<div style="position:relative;transform:translate(-50%,-50%);pointer-events:none;">
    <div style="width:14px;height:14px;border-radius:50%;background:white;border:2px solid #4f46e5;box-shadow:0 1px 4px rgba(0,0,0,0.1);"></div>
    ${etaLabel ? `<div style="position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:white;border-radius:12px;padding:8px 14px;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.12);font-family:Inter,sans-serif;">
      <div style="font-size:13px;font-weight:600;color:#0f172a;">${name}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Arrivée dans</div>
      <div style="font-size:16px;font-weight:600;color:#0f172a;">${etaLabel}</div>
    </div>` : ''}
  </div>`;
}

export default function StationMarkers({ map, stations, currentStationIdx, glowStationIdx, distToNextStation }) {
  const markers = useMemo(() => {
    return stations.map((s, i) => {
      const status = getStationStatus(i, currentStationIdx, glowStationIdx, distToNextStation);
      let etaLabel = null;
      if (status === 'approaching') {
        etaLabel = distToNextStation != null ? `${Math.round(distToNextStation / 1000 * 2)} min` : '2 min';
      } else if (status === 'active') {
        etaLabel = 'Maintenant';
      } else if (status === 'upcoming') {
        const stationsAway = i - currentStationIdx;
        if (stationsAway <= 3) {
          etaLabel = `${Math.max(1, stationsAway * 3)} min`;
        }
      }
      const content = stationContent(s.name, i, stations.length, status, etaLabel);
      return (
        <OverlayMarker
          key={`st-${s.name}-${i}`}
          map={map}
          position={s.position}
          title={s.name}
          content={content}
          zIndex={status === 'approaching' ? 200 : status === 'active' ? 150 : 50}
        />
      );
    });
  }, [map, stations, currentStationIdx, glowStationIdx, distToNextStation]);

  return <>{markers}</>;
}
