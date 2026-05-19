import { useMemo } from 'react';
import { useBusMovementEngine } from '../Components/Navigation/BusMovementEngine';

function haversine(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function useBusMovement({
  routePath,
  stations,
  active,
  onStationArrival,
  onStationDeparture,
  onRouteComplete,
}) {
  const engine = useBusMovementEngine({
    routePath,
    stations,
    active,
    baseSpeedKmh: 32,
    totalTripDurationSec: 720,
    onStationArrival,
    onStationDeparture,
    onRouteComplete,
  });

  const {
    busPosition,
    busHeading,
    busSpeed = 0,
    currentStationIdx,
    stoppedAtStation,
    routeProgress,
    remainingETA,
  } = engine;

  // Compute station distances
  const stationDistances = useMemo(() => {
    if (!routePath.length || !stations.length) return [];
    const cumDists = [0];
    for (let i = 1; i < routePath.length; i++) {
      cumDists.push(cumDists[i - 1] + haversine(routePath[i - 1], routePath[i]));
    }
    return stations.map((st, i) => {
      if (i === 0) return 0;
      if (i === stations.length - 1) return cumDists[cumDists.length - 1];
      let minD = Infinity;
      let closestIdx = 0;
      for (let j = 0; j < routePath.length; j++) {
        const d = haversine(routePath[j], st.position);
        if (d < minD) {
          minD = d;
          closestIdx = j;
        }
      }
      return cumDists[closestIdx];
    });
  }, [routePath, stations]);

  const distToNextStation = useMemo(() => {
    if (!stationDistances.length || currentStationIdx >= stations.length - 1) return null;
    const totalDist = stationDistances[stationDistances.length - 1] || 1;
    const traveled = routeProgress * totalDist;
    const nextIdx = Math.min(currentStationIdx + 1, stationDistances.length - 1);
    return Math.max(0, stationDistances[nextIdx] - traveled);
  }, [stationDistances, routeProgress, currentStationIdx, stations.length]);

  const nextStopName = stoppedAtStation || (stations[Math.min(currentStationIdx + 1, stations.length - 1)]?.name || '');
  const nextStopEtaMin = distToNextStation != null && busSpeed > 0
    ? Math.max(1, Math.round((distToNextStation / 1000) / (busSpeed / 60)))
    : Math.round(remainingETA / 60) || 2;

  return {
    busPosition,
    busHeading,
    busSpeed,
    currentStationIdx,
    stoppedAtStation,
    routeProgress,
    remainingETA,
    distToNextStation,
    nextStopName,
    nextStopEtaMin,
  };
}
