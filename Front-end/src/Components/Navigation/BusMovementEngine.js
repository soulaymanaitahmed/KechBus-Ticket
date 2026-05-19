import { useState, useEffect, useRef, useCallback } from 'react';

function toRad(deg) { return deg * Math.PI / 180; }

function haversine(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function computeCumulativeDistances(path) {
  const distances = [0];
  for (let i = 1; i < path.length; i++) {
    distances.push(distances[i - 1] + haversine(path[i - 1], path[i]));
  }
  return distances;
}

function lerpPos(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

function calcBearing(a, b) {
  if (window.google?.maps?.geometry?.spherical) {
    const from = new window.google.maps.LatLng(a.lat, a.lng);
    const to = new window.google.maps.LatLng(b.lat, b.lng);
    return (window.google.maps.geometry.spherical.computeHeading(from, to) + 360) % 360;
  }
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function lerpAngle(current, target, factor) {
  let diff = target - current;
  while (diff < -180) diff += 360;
  while (diff > 180) diff -= 360;
  return (current + diff * factor + 360) % 360;
}

function getPointAtDistance(path, cumDist, distance) {
  const totalDist = cumDist[cumDist.length - 1];
  const clampedDist = Math.max(0, Math.min(distance, totalDist));
  let lo = 0;
  let hi = cumDist.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cumDist[mid] <= clampedDist) lo = mid;
    else hi = mid;
  }
  const segStart = lo;
  const segEnd = Math.min(segStart + 1, path.length - 1);
  const segLen = cumDist[segEnd] - cumDist[segStart];
  const t = segLen > 0 ? (clampedDist - cumDist[segStart]) / segLen : 0;
  return {
    position: lerpPos(path[segStart], path[segEnd], t),
    segmentIndex: segStart,
  };
}

function getPositionWithHeading(path, cumDist, distance, lookAheadMeters = 15) {
  const totalDist = cumDist[cumDist.length - 1];
  const { position, segmentIndex } = getPointAtDistance(path, cumDist, distance);
  const aheadDist = Math.min(distance + lookAheadMeters, totalDist);
  const aheadPoint = getPointAtDistance(path, cumDist, aheadDist).position;
  let heading = calcBearing(position, aheadPoint);
  if (distance >= totalDist - 1 && segmentIndex > 0) {
    const prev = path[Math.max(segmentIndex - 1, 0)];
    const cur = path[Math.min(segmentIndex + 1, path.length - 1)];
    heading = calcBearing(prev, cur);
  }
  return { position, heading, segmentIndex };
}

function densifyPath(path, maxSegmentMeters = 10) {
  if (path.length < 2) return path;
  const dense = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const dist = haversine(path[i - 1], path[i]);
    if (dist > maxSegmentMeters) {
      const segments = Math.ceil(dist / maxSegmentMeters);
      for (let s = 1; s <= segments; s++) {
        dense.push(lerpPos(path[i - 1], path[i], s / segments));
      }
    } else {
      dense.push(path[i]);
    }
  }
  return dense;
}

export function useBusMovementEngine({
  routePath = [],
  stations = [],
  active = false,
  baseSpeedKmh = 35,
  totalTripDurationSec = null,
  onStationArrival = null,
  onStationDeparture = null,
  onRouteComplete = null,
  initialProgressFraction = 0,
  isSimulationPaused = false,
}) {
  const [busPosition, setBusPosition] = useState(null);
  const [busHeading, setBusHeading] = useState(0);
  const [busSpeed, setBusSpeed] = useState(0);
  const [currentStationIdx, setCurrentStationIdx] = useState(0);
  const [stoppedAtStation, setStoppedAtStation] = useState(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [remainingETA, setRemainingETA] = useState(0);

  const pathRef = useRef([]);
  const cumDistRef = useRef([]);
  const totalDistRef = useRef(0);
  const distanceTraveledRef = useRef(0);
  const lastFrameTimeRef = useRef(null);
  const rafRef = useRef(null);
  const isPausedRef = useRef(false);
  const pauseEndRef = useRef(0);
  const stationDistancesRef = useRef([]);
  const visitedStationsRef = useRef(new Set());
  const activeRef = useRef(false);
  const isCompleteRef = useRef(false);
  const speedRef = useRef(0);
  const headingRef = useRef(0);
  const effectiveBaseSpeedRef = useRef(0);
  const isSimulationPausedRef = useRef(isSimulationPaused);
  isSimulationPausedRef.current = isSimulationPaused;

  const onStationArrivalRef = useRef(onStationArrival);
  const onStationDepartureRef = useRef(onStationDeparture);
  const onRouteCompleteRef = useRef(onRouteComplete);
  onStationArrivalRef.current = onStationArrival;
  onStationDepartureRef.current = onStationDeparture;
  onRouteCompleteRef.current = onRouteComplete;

  const computeStationDistances = useCallback((path, cumDist, stList) => {
    if (!stList.length || !path.length) return [];
    const totalDist = cumDist[cumDist.length - 1];
    return stList.map((st, i) => {
      if (i === 0) return 0;
      if (i === stList.length - 1) return totalDist;

      let minD = Infinity;
      let closestIdx = 0;
      for (let j = 0; j < path.length; j++) {
        const d = haversine(path[j], st.position);
        if (d < minD) {
          minD = d;
          closestIdx = j;
        }
      }
      return cumDist[closestIdx];
    });
  }, []);

  useEffect(() => {
    if (!active || !routePath.length) {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const dense = densifyPath(routePath);
    pathRef.current = dense;
    const cumDist = computeCumulativeDistances(dense);
    cumDistRef.current = cumDist;
    totalDistRef.current = cumDist[cumDist.length - 1];

    const stationDist = computeStationDistances(dense, cumDist, stations);
    stationDistancesRef.current = stationDist;

    let calculatedBaseSpeed = baseSpeedKmh;
    effectiveBaseSpeedRef.current = calculatedBaseSpeed;

    let startDist = 0;
    if (initialProgressFraction > 0 && initialProgressFraction < 1) {
      startDist = totalDistRef.current * initialProgressFraction;
    }
    distanceTraveledRef.current = startDist;

    let initStIdx = 0;
    const initialVisited = new Set([0]);
    for (let i = 0; i < stationDist.length; i++) {
      if (stationDist[i] <= startDist) {
        initStIdx = i;
        initialVisited.add(i);
      }
    }

    lastFrameTimeRef.current = null;
    isPausedRef.current = false;
    pauseEndRef.current = 0;
    visitedStationsRef.current = initialVisited;
    isCompleteRef.current = false;
    activeRef.current = true;

    const { position: startPos, heading: startHeading } = getPositionWithHeading(dense, cumDist, startDist);
    setBusPosition(startPos);
    setBusHeading(startHeading);
    headingRef.current = startHeading;
    setBusSpeed(0);
    setCurrentStationIdx(initStIdx);
    setStoppedAtStation(null);
    setRouteProgress(initialProgressFraction * 100);
    setIsComplete(false);
    setRemainingETA(totalTripDurationSec || 600);

    const tick = (now) => {
      if (!activeRef.current) return;

      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const deltaMs = Math.min(now - lastFrameTimeRef.current, 100);
      lastFrameTimeRef.current = now;

      if (isSimulationPausedRef.current) {
        setBusSpeed(0);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (isPausedRef.current) {
        const pos = getPositionWithHeading(
          pathRef.current, cumDistRef.current, distanceTraveledRef.current
        );
        setBusPosition(pos.position);
        setBusHeading(lerpAngle(headingRef.current, pos.heading, 0.14));
        headingRef.current = pos.heading;
        setBusSpeed(0);
        if (now >= pauseEndRef.current) {
          isPausedRef.current = false;
          setStoppedAtStation(null);
          const currentIdx = visitedStationsRef.current.size - 1;
          const nextIdx = currentIdx + 1;
          if (nextIdx < stations.length && onStationDepartureRef.current) {
            onStationDepartureRef.current(currentIdx, stations[nextIdx].name);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const currentDist = distanceTraveledRef.current;
      const stationDists = stationDistancesRef.current;

      for (let i = 1; i < stationDists.length; i++) {
        if (visitedStationsRef.current.has(i)) continue;
        const distToStation = stationDists[i] - currentDist;
        if (distToStation > 0 && distToStation <= 12) {
          distanceTraveledRef.current = stationDists[i];
          visitedStationsRef.current.add(i);
          isPausedRef.current = true;
          const duration = stations[i]?.stopDuration || 4000;
          pauseEndRef.current = now + duration;
          setCurrentStationIdx(i);
          setBusSpeed(0);
          speedRef.current = 0;
          const stName = stations[i]?.name || `Station ${i + 1}`;
          setStoppedAtStation(stName);
          const pos = getPositionWithHeading(
            pathRef.current, cumDistRef.current, stationDists[i]
          );
          setBusPosition(pos.position);
          setBusHeading(lerpAngle(headingRef.current, pos.heading, 0.14));
          headingRef.current = pos.heading;
          if (onStationArrivalRef.current) {
            onStationArrivalRef.current(i, stName);
          }
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
      }

      let nearStation = false;
      let approachingStationIdx = -1;
      let distToSt = Infinity;
      
      for (let i = 1; i < stationDists.length; i++) {
        if (visitedStationsRef.current.has(i)) continue;
        const dist = stationDists[i] - currentDist;
        if (dist > 0 && dist < 250) {
          nearStation = true;
          approachingStationIdx = i;
          distToSt = dist;
          break;
        }
      }

      const lastVisitedIdx = visitedStationsRef.current.size > 0 ? Array.from(visitedStationsRef.current).pop() : 0;
      const distFromLastSt = Math.max(0, currentDist - stationDists[lastVisitedIdx]);

      const MAX_SPEED = 65;
      const URBAN_SPEED = 45;
      const TURN_SPEED = 20;
      const STATION_CRAWL = 6;

      let targetSpeed = URBAN_SPEED;

      // 1. Long straight bonus
      if (distToSt > 400 && distFromLastSt > 400) {
        targetSpeed = MAX_SPEED;
      }

      // 2. Turning penalty
      const { heading: lookAheadHeading } = getPositionWithHeading(
        pathRef.current, cumDistRef.current, distanceTraveledRef.current + 25
      );
      let angleDiff = Math.abs(lookAheadHeading - headingRef.current);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;
      if (angleDiff > 15) {
         const turnFactor = Math.max(0.2, 1 - (angleDiff / 90));
         targetSpeed = Math.min(targetSpeed, TURN_SPEED + (URBAN_SPEED - TURN_SPEED) * turnFactor);
      }

      // 3. Acceleration phase
      if (distFromLastSt < 150) {
         const accelFactor = Math.max(0.05, distFromLastSt / 150);
         targetSpeed = Math.min(targetSpeed, MAX_SPEED * Math.pow(accelFactor, 0.6));
      }

      // 4. Deceleration phase
      if (nearStation && distToSt < 200) {
         if (distToSt < 15) {
            targetSpeed = Math.min(targetSpeed, Math.max(2, STATION_CRAWL * (distToSt / 15)));
         } else {
            const decelFactor = distToSt / 200;
            const approachSpeed = STATION_CRAWL + (MAX_SPEED - STATION_CRAWL) * Math.pow(decelFactor, 1.2);
            targetSpeed = Math.min(targetSpeed, approachSpeed);
         }
      }

      // 5. Organic speed noise
      targetSpeed += Math.sin(now * 0.002) * 2.5;
      targetSpeed = Math.max(3, Math.min(targetSpeed, MAX_SPEED));

      // 6. Apply smooth easing to speed
      const speedLerp = (nearStation && distToSt < 60) ? 0.08 : 0.015;
      const smoothSpeed = speedRef.current + (targetSpeed - speedRef.current) * speedLerp;
      speedRef.current = smoothSpeed;

      const metersPerSecond = (smoothSpeed * 1000) / 3600;
      const distanceThisFrame = metersPerSecond * (deltaMs / 1000);

      distanceTraveledRef.current = Math.min(
        distanceTraveledRef.current + distanceThisFrame,
        totalDistRef.current
      );

      if (distanceTraveledRef.current >= totalDistRef.current) {
        distanceTraveledRef.current = totalDistRef.current;
        isCompleteRef.current = true;
        const finalPos = pathRef.current[pathRef.current.length - 1];
        setBusPosition(finalPos);
        setBusSpeed(0);
        speedRef.current = 0;
        setRouteProgress(1);
        setIsComplete(true);
        setCurrentStationIdx(stations.length - 1);
        if (onRouteCompleteRef.current) {
          onRouteCompleteRef.current();
        }
        return;
      }

      const { position, heading: rawHeading } = getPositionWithHeading(
        pathRef.current, cumDistRef.current, distanceTraveledRef.current
      );
      const headingLerp = smoothSpeed < 10 ? 0.25 : 0.12;
      const smoothHeading = lerpAngle(headingRef.current, rawHeading, headingLerp);
      headingRef.current = smoothHeading;
      setBusPosition(position);
      setBusHeading(smoothHeading);

      // 7. Dynamic realistic ETA calculation
      const remainingDist = totalDistRef.current - distanceTraveledRef.current;
      const assumedAvgSpeedKmh = 35; // Urban average
      const blendedSpeedKmh = (speedRef.current + assumedAvgSpeedKmh * 2) / 3;
      const blendedMps = Math.max(2, (blendedSpeedKmh * 1000) / 3600);
      
      const estimatedSec = remainingDist / blendedMps;
      const remainingStations = Math.max(0, stations.length - visitedStationsRef.current.size);
      const dwellTimeSec = remainingStations * 5; // 5s per remaining stop
      
      setRemainingETA(Math.round(estimatedSec + dwellTimeSec));

      setBusSpeed(Math.round(smoothSpeed));
      setRouteProgress(distanceTraveledRef.current / totalDistRef.current);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, routePath, stations, baseSpeedKmh, totalTripDurationSec, computeStationDistances]);

  return {
    busPosition,
    busHeading,
    busSpeed,
    currentStationIdx,
    stoppedAtStation,
    routeProgress,
    isComplete,
    remainingETA,
  };
}
