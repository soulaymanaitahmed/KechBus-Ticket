import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiMaximize2, FiLayers, FiCrosshair, FiPlus, FiMinus } from 'react-icons/fi';
import { useBusMovementEngine } from './BusMovementEngine';
import { NavigationCameraController } from './NavigationCameraController';
import NavigationMap from './NavigationMap';
import RouteRenderer from './RouteRenderer';
import StationMarkers from './StationMarkers';
import AnimatedBusMarker from './AnimatedBusMarker';
import NavigationSidebar from './NavigationSidebar';
import TopStatsPanel from './TopStatsPanel';
import BottomTelemetryPanel from './BottomTelemetryPanel';
import NotificationToaster from './NotificationToaster';
import { NotificationProvider, useNotification } from '../../Contexts/NotificationContext';
import { useKechBusRoutes } from '../../hooks/useKechBusRoutes';
import { useRouteDirections } from '../../hooks/useRouteDirections';
import RouteSelectorModal from './RouteSelectorModal';
import '../../Styles/SmartNavigator.css';

const MARRAKECH_CENTER = { lat: 31.6295, lng: -7.9811 };

function haversine(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Dynamic arrêts will be generated from `stations`

export default function SmartNavigatorPage() {
  return (
    <NotificationProvider>
      <SmartNavigatorContent />
    </NotificationProvider>
  );
}

function SmartNavigatorContent() {
  const [updateCountdown, setUpdateCountdown] = useState(2);
  const [lastUpdate, setLastUpdate] = useState('12:43:30');
  const { addNotification } = useNotification();
  const [engineActive, setEngineActive] = useState(true);
  const [glowStationIdx, setGlowStationIdx] = useState(-1);
  const { routes, loading: routesLoading } = useKechBusRoutes();
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const mapRef = useRef(null);
  const telemetryRef = useRef(null);

  useEffect(() => {
    if (routes.length > 0 && !selectedLineId) {
      setSelectedLineId(routes[0].id);
    }
  }, [routes, selectedLineId]);

  const selectedLineRaw = useMemo(() => routes.find(r => r.id === selectedLineId) || routes[0], [routes, selectedLineId]);

  const { routePath, stations, totalDurationSec, isCalculating } = useRouteDirections(selectedLineRaw);

  const selectedLine = useMemo(() => {
    if (!selectedLineRaw) return null;
    return {
      ...selectedLineRaw,
      duration: totalDurationSec ? Math.round(totalDurationSec / 60) + ' min' : selectedLineRaw.durationFallback,
    };
  }, [selectedLineRaw, totalDurationSec]);

  useEffect(() => {
    if (isCalculating || !routePath || routePath.length === 0) {
      setEngineActive(false);
    } else {
      setEngineActive(true);
      setGlowStationIdx(-1);
    }
  }, [isCalculating, routePath]);

  useEffect(() => {
    const iv = setInterval(() => setUpdateCountdown(c => (c <= 1 ? 2 : c - 1)), 1000);
    return () => clearInterval(iv);
  }, []);

  const handleStationArrival = useCallback((idx, name) => {
    addNotification(`Le bus est arrivé à la station ${name}`, 'arrival');
    setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setGlowStationIdx(idx);
  }, [addNotification]);

  const handleStationDeparture = useCallback((idx, nextName) => {
    addNotification(`Le bus ${selectedLine.num} repart. Prochain arrêt : ${nextName}`, 'departure');
    setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setGlowStationIdx(-1);
  }, [addNotification, selectedLine]);

  const handleRouteComplete = useCallback(() => {
    addNotification(`Terminus. Le bus est arrivé à ${selectedLine.to}`, 'completed');
    setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [addNotification, selectedLine]);

  const {
    busPosition,
    busHeading,
    busSpeed = 0,
    currentStationIdx,
    stoppedAtStation,
    routeProgress,
    remainingETA,
  } = useBusMovementEngine({
    routePath,
    stations,
    active: engineActive,
    baseSpeedKmh: 32,
    totalTripDurationSec: totalDurationSec || 720,
    onStationArrival: handleStationArrival,
    onStationDeparture: handleStationDeparture,
    onRouteComplete: handleRouteComplete,
  });

  NavigationCameraController({
    mapRef,
    targetPosition: busPosition,
    active: engineActive,
    stopped: !!stoppedAtStation,
  });

  // Compute station distances and next stop info
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
        if (d < minD) { minD = d; closestIdx = j; }
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

  useEffect(() => {
    if (engineActive && busSpeed > 0) {
      setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setUpdateCountdown(2);
    }
  }, [busSpeed, engineActive, routeProgress]);

  const stopTracking = useCallback(() => {
    setEngineActive(false);
    setGlowStationIdx(-1);
    window.history.back();
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  const handleRecenter = useCallback(() => {
    if (busPosition && mapRef.current) {
      mapRef.current.panTo(busPosition);
      mapRef.current.setZoom(16);
    }
  }, [busPosition]);

  return (
    <motion.div
      className="sn"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ═══ LEFT PANEL ═══ */}
      <NavigationSidebar
        selectedLine={selectedLine}
        stations={stations}
        currentStationIdx={currentStationIdx}
        onChangeRouteClick={() => setIsSelectorOpen(true)}
      />

      {/* ═══ ROUTE SELECTOR MODAL ═══ */}
      <RouteSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        routes={routes}
        onSelect={setSelectedLineId}
      />

      {/* ═══ RIGHT AREA ═══ */}
      <div className="sn-right-area">
        {/* Top Stats Bar */}
        <TopStatsPanel
          selectedLine={selectedLine}
          onQuit={stopTracking}
        />

        {/* Map Zone */}
        <div className="sn-map-zone">
          <div className="sn-map-container">
            {/* Map Controls */}
            <div className="sn-map-controls">
              <button 
                type="button" 
                className="sn-ctrl-btn" 
                aria-label="Plein écran"
                onClick={handleFullscreen}
              >
                <FiMaximize2 size={16} />
              </button>
              
              <div style={{ position: 'relative' }}>
                <button 
                  type="button" 
                  className={`sn-ctrl-btn ${showLayersMenu ? 'sn-ctrl-btn--active' : ''}`} 
                  aria-label="Calques"
                  onClick={() => setShowLayersMenu(!showLayersMenu)}
                >
                  <FiLayers size={16} />
                </button>
                
                {showLayersMenu && (
                  <div className="sn-layers-menu">
                    <button type="button" className={`sn-layer-item ${mapType === 'roadmap' ? 'active' : ''}`} onClick={() => { setMapType('roadmap'); setShowLayersMenu(false); }}>Plan</button>
                    <button type="button" className={`sn-layer-item ${mapType === 'satellite' ? 'active' : ''}`} onClick={() => { setMapType('satellite'); setShowLayersMenu(false); }}>Satellite</button>
                    <button type="button" className={`sn-layer-item ${mapType === 'terrain' ? 'active' : ''}`} onClick={() => { setMapType('terrain'); setShowLayersMenu(false); }}>Relief</button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="sn-ctrl-btn"
                aria-label="Centrer"
                onClick={handleRecenter}
              >
                <FiCrosshair size={16} />
              </button>
              <div className="sn-zoom-group">
                <button
                  type="button"
                  className="sn-zoom-btn"
                  aria-label="Zoom +"
                  onClick={() => {
                    const z = mapRef.current?.getZoom() || 14;
                    mapRef.current?.setZoom(z + 1);
                  }}
                >+</button>
                <button
                  type="button"
                  className="sn-zoom-btn"
                  aria-label="Zoom -"
                  onClick={() => {
                    const z = mapRef.current?.getZoom() || 14;
                    mapRef.current?.setZoom(z - 1);
                  }}
                >−</button>
              </div>
            </div>

            {/* Google Map */}
            <NavigationMap
              onLoad={map => { mapRef.current = map; }}
              center={MARRAKECH_CENTER}
              mapTypeId={mapType}
            >
              {isCalculating && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '10px 20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 600 }}>
                  Calcul de l'itinéraire...
                </div>
              )}
              
              {!isCalculating && routePath.length > 0 && <RouteRenderer path={routePath} active={engineActive} />}

              {!isCalculating && stations.length > 0 && (
                <StationMarkers
                  map={mapRef.current}
                  stations={stations}
                  currentStationIdx={currentStationIdx}
                  glowStationIdx={glowStationIdx}
                  distToNextStation={distToNextStation}
                />
              )}

              {!isCalculating && busPosition && (
                <AnimatedBusMarker
                  map={mapRef.current}
                  position={busPosition}
                  heading={busHeading}
                  speed={busSpeed}
                  stopped={!!stoppedAtStation}
                  lineNum={selectedLine?.num}
                  nextStopName={nextStopName}
                  nextStopEta={`${nextStopEtaMin} min`}
                />
              )}
            </NavigationMap>
          </div>
        </div>

        {/* Bottom Telemetry Bar */}
        <BottomTelemetryPanel
          ref={telemetryRef}
          selectedLine={selectedLine}
          busSpeed={busSpeed}
          updateCountdown={updateCountdown}
          lastUpdate={lastUpdate}
        />

        {/* Floating Toaster */}
        <NotificationToaster />
      </div>
    </motion.div>
  );
}
