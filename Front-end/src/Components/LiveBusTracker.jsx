import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../Styles/LiveBusTracker.css";

/* ── Marrakech neighbourhood coordinates (approx.) ──────────────── */
const COORDS = {
  "Guéliz":                [31.6340, -8.0110],
  "Medina":                [31.6295, -7.9810],
  "Menara":                [31.6060, -8.0220],
  "Palmeraie":             [31.6690, -7.9650],
  "Hay Hassani":           [31.6450, -8.0350],
  "Sidi Youssef Ben Ali":  [31.6100, -7.9800],
  "Targa":                 [31.6550, -8.0400],
  "Massira":               [31.6200, -8.0500],
  "Doha Abwab Marrakech":  [31.6480, -7.9920],
  "Sidi Mimoun":           [31.6180, -7.9860],
  "Tameslouht":            [31.5040, -8.1250],
  "Tahnaout":              [31.3570, -8.0500],
  "Amzmiz":                [31.1600, -8.2320],
  "M'hamid 9":             [31.5850, -8.0630],
};

const DEFAULT_COORD = [31.6295, -7.9960];

/* ── Helpers ─────────────────────────────────────────────────────── */

/** Build an array of interpolated coords between A and B (curved path) */
function buildRoutePath(from, to, steps = 20) {
  const a = COORDS[from] ?? DEFAULT_COORD;
  const b = COORDS[to] ?? DEFAULT_COORD;

  // Add a slight curve via a midpoint offset
  const midLat = (a[0] + b[0]) / 2 + 0.004;
  const midLng = (a[1] + b[1]) / 2 - 0.003;

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier through midpoint
    const lat = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * midLat + t * t * b[0];
    const lng = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * midLng + t * t * b[1];
    points.push([lat, lng]);
  }
  return points;
}

/** Create a bus emoji DivIcon */
function busIcon() {
  return L.divIcon({
    html: '<span class="bus-marker-emoji">🚍</span>',
    className: "bus-marker-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

/** Create endpoint dot icon */
function dotIcon(label) {
  return L.divIcon({
    html: `<span class="bus-endpoint-dot">${label}</span>`,
    className: "bus-endpoint-icon",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

/* ── Sub-component: auto-fit bounds ──────────────────────────────── */
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [map, bounds]);
  return null;
}

/* ── Animated bus marker ─────────────────────────────────────────── */
function AnimatedBusMarker({ position }) {
  const markerRef = useRef(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const latLng = L.latLng(position[0], position[1]);
    marker.setLatLng(latLng);
  }, [position]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={busIcon()}
    />
  );
}

/* ── Main component ──────────────────────────────────────────────── */
const TOTAL_STEPS = 20;
const TICK_MS = 5000; // 5 seconds

export default function LiveBusTracker({ from, to, duration, lineNumber, lineColor }) {
  const routeColor = lineColor || "#405d72";
  const [step, setStep] = useState(0);
  const [isDelayed, setIsDelayed] = useState(false);

  // parse duration string "22 min" => number
  const totalMinutes = useMemo(() => {
    const m = parseInt(duration, 10);
    return isNaN(m) ? 20 : m;
  }, [duration]);

  // Build route once
  const routePath = useMemo(
    () => buildRoutePath(from, to, TOTAL_STEPS),
    [from, to]
  );

  const bounds = useMemo(
    () => L.latLngBounds(routePath),
    [routePath]
  );

  // Simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev >= TOTAL_STEPS) return 0; // loop
        return prev + 1;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  // Random delay simulation (10% chance each tick)
  useEffect(() => {
    if (step > 0 && step < TOTAL_STEPS && Math.random() < 0.1) {
      setIsDelayed(true);
    } else if (step === 0) {
      setIsDelayed(false);
    }
  }, [step]);

  // Compute ETA
  const remainingMinutes = useMemo(() => {
    const fraction = 1 - step / TOTAL_STEPS;
    const base = Math.round(fraction * totalMinutes);
    return isDelayed ? base + 3 : base;
  }, [step, totalMinutes, isDelayed]);

  const currentPosition = routePath[Math.min(step, TOTAL_STEPS)];

  const handleReset = useCallback(() => {
    setStep(0);
    setIsDelayed(false);
  }, []);

  const startCoord = COORDS[from] ?? DEFAULT_COORD;
  const endCoord = COORDS[to] ?? DEFAULT_COORD;

  return (
    <div className="live-tracker">
      {/* Mini-map */}
      <div className="live-tracker__map-wrap">
        <MapContainer
          className="live-tracker__map"
          center={currentPosition}
          zoom={14}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          attributionControl={false}
          doubleClickZoom={false}
          touchZoom={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds bounds={bounds} />
          <Polyline
            positions={routePath}
            pathOptions={{
              color: routeColor,
              weight: 3,
              opacity: 0.7,
              dashArray: "8 6",
            }}
          />
          {/* Start & end dots */}
          <Marker position={startCoord} icon={dotIcon("A")} />
          <Marker position={endCoord} icon={dotIcon("B")} />
          {/* Animated bus */}
          <AnimatedBusMarker position={currentPosition} />
        </MapContainer>
      </div>

      {/* Info bar */}
      <div className="live-tracker__info">
        <div className="live-tracker__eta">
          {lineNumber && (
            <span
              className="live-tracker__line-badge"
              style={{ background: routeColor }}
            >
              L{lineNumber}
            </span>
          )}
          <span className="live-tracker__eta-icon">⏱</span>
          <span>
            Arriving in <strong>{remainingMinutes} min</strong>
          </span>
        </div>
        <div className="live-tracker__status-row">
          <span
            className={`live-tracker__status ${
              isDelayed ? "live-tracker__status--delayed" : "live-tracker__status--ontime"
            }`}
          >
            <span
              className="live-tracker__status-dot"
              aria-hidden
            />
            {isDelayed ? "Delayed" : "On time"}
          </span>
          <button
            type="button"
            className="live-tracker__reset"
            onClick={handleReset}
            title="Restart simulation"
          >
            ↻
          </button>
        </div>
      </div>
    </div>
  );
}
