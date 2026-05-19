/** Shared geospatial helpers for route tracking */

export function toRad(deg) { return deg * Math.PI / 180; }

export function haversine(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function lerpPos(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

export function computeCumulativeDistances(path) {
  const distances = [0];
  for (let i = 1; i < path.length; i++) {
    distances.push(distances[i - 1] + haversine(path[i - 1], path[i]));
  }
  return distances;
}

/** Project point onto polyline; returns distance along path + snapped point */
export function projectOntoPath(point, path, cumDist) {
  let minDistance = Infinity;
  let bestDistanceAlongPath = 0;
  let bestPoint = path[0];

  for (let i = 0; i < path.length - 1; i++) {
    const A = path[i];
    const B = path[i + 1];
    const dx = B.lng - A.lng;
    const dy = B.lat - A.lat;
    const magSq = dx * dx + dy * dy;
    let t = 0;
    if (magSq > 0) {
      t = ((point.lng - A.lng) * dx + (point.lat - A.lat) * dy) / magSq;
      t = Math.max(0, Math.min(1, t));
    }
    const projected = lerpPos(A, B, t);
    const dist = haversine(point, projected);
    if (dist < minDistance) {
      minDistance = dist;
      bestDistanceAlongPath = cumDist[i] + t * haversine(A, B);
      bestPoint = projected;
    }
  }
  return { distance: bestDistanceAlongPath, point: bestPoint };
}

export function getPositionAtDistance(path, cumDist, distance) {
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
  return lerpPos(path[segStart], path[segEnd], t);
}
