import React, { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Polyline, Marker } from '@react-google-maps/api';

import { FiMaximize2, FiLayers, FiCrosshair, FiPause, FiPlay, FiRefreshCw, FiArrowLeft, FiClock, FiActivity, FiMapPin, FiWifi } from 'react-icons/fi';
import { FaBus } from 'react-icons/fa';
import NavigationMap from '../Components/Navigation/NavigationMap';
import AnimatedBusMarker from '../Components/Navigation/AnimatedBusMarker';
import { useBusMovementEngine } from '../Components/Navigation/BusMovementEngine';
import { useRouteDirections } from '../hooks/useRouteDirections';
import { useKechBusRoutes } from '../hooks/useKechBusRoutes';
import { useGoogleMaps } from '../providers/GoogleMapsProvider';
import { socket } from '../services/socket';
import '../Styles/AdminLiveTracker.css';
import '../Styles/SmartNavigator.css'; // Reuse glassmorphism variables

const MARRAKECH_CENTER = { lat: 31.6295, lng: -7.9811 };

// Memoized Bus Tracker Instance
const BusTrackerInstance = memo(({ 
  busId, 
  lineId, 
  routePath, 
  stations, 
  active, 
  initialProgressFraction, 
  isSimulationPaused, 
  onUpdate,
  isFocused,
  map,
  baseSpeedKmh,
  initialDelayMin,
  onLog
}) => {
  const [delayMin, setDelayMin] = useState(initialDelayMin);
  const lastDelayRef = useRef(initialDelayMin);

  // Periodic delay variance to make the telemetry dynamic and realistic
  useEffect(() => {
    if (isSimulationPaused) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        setDelayMin(prev => Math.max(0, prev + (Math.random() > 0.4 ? 1 : -1)));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isSimulationPaused]);

  // Log delay changes
  useEffect(() => {
    if (delayMin !== lastDelayRef.current) {
      if (delayMin > lastDelayRef.current) {
        onLog(`Bus #${busId.split('-').pop()} retardé de ${delayMin} min`, 'warning');
      } else if (delayMin < lastDelayRef.current && delayMin > 0) {
        onLog(`Bus #${busId.split('-').pop()} a réduit son retard à ${delayMin} min`, 'success');
      }
      lastDelayRef.current = delayMin;
    }
  }, [delayMin, busId, onLog]);

  const handleArrival = useCallback((idx, name) => {
    onLog(`Bus #${busId.split('-').pop()} arrivé à : ${name}`, 'info');
    if (socket && socket.connected) {
      socket.emit('emitNotification', {
        routeId: lineId,
        message: `Bus N${lineId} est arrivé à l'arrêt ${name}`
      });
    }
  }, [busId, lineId, onLog]);

  const handleDeparture = useCallback((idx, name) => {
    onLog(`Bus #${busId.split('-').pop()} a quitté l'arrêt ${name}`, 'success');
    if (socket && socket.connected) {
      socket.emit('emitNotification', {
        routeId: lineId,
        message: `Bus N${lineId} a quitté l'arrêt ${name}`
      });
    }
  }, [busId, lineId, onLog]);

  const {
    busPosition,
    busHeading,
    busSpeed,
    currentStationIdx,
    stoppedAtStation,
    routeProgress,
    remainingETA,
  } = useBusMovementEngine({
    routePath,
    stations,
    active,
    baseSpeedKmh,
    totalTripDurationSec: routePath.length * 2.8, 
    initialProgressFraction,
    isSimulationPaused,
    onStationArrival: handleArrival,
    onStationDeparture: handleDeparture
  });

  const lastUpdateCallRef = useRef(0);

  // Throttled update to parent state and Socket.io emission
  useEffect(() => {
    if (!busPosition) return;
    const now = Date.now();
    if (now - lastUpdateCallRef.current >= 400) {
      lastUpdateCallRef.current = now;
      const telemetry = {
        routeId: lineId,
        busId,
        lat: busPosition.lat,
        lng: busPosition.lng,
        speed: busSpeed,
        progress: routeProgress,
        eta: remainingETA,
        status: stoppedAtStation ? 'A_L_ARRET' : (busSpeed > 0 ? 'EN_CIRCULATION' : 'HORS_LIGNE'),
        currentStation: stoppedAtStation || (stations[currentStationIdx + 1]?.name) || 'Terminus',
        delayMin
      };

      onUpdate(busId, telemetry);

      if (socket && socket.connected) {
        socket.emit('updateBusLocation', telemetry);
      }
    }
  }, [busPosition, busHeading, busSpeed, routeProgress, remainingETA, stoppedAtStation, busId, currentStationIdx, onUpdate, stations, delayMin, lineId]);

  if (!busPosition) return null;

  return (
    <AnimatedBusMarker
      map={map}
      position={busPosition}
      heading={busHeading}
      speed={busSpeed}
      stopped={!!stoppedAtStation}
      lineNum={lineId}
      isFocused={isFocused}
    />
  );
});

export default function AdminLiveTrackerPage() {
  const { lineId } = useParams();
  const navigate = useNavigate();
  const { routes, loading: routesLoading } = useKechBusRoutes();
  const mapRef = useRef(null);
  const trackerContainerRef = useRef(null);
  
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState('roadmap');
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBusIds, setPausedBusIds] = useState(new Set());
  
  const [focusedBusId, setFocusedBusId] = useState(null);
  const [isFollowMode, setIsFollowMode] = useState(false);
  const [eventLogs, setEventLogs] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(socket ? socket.connected : true);
  
  // Telemetry state per bus
  const [busTelemetry, setBusTelemetry] = useState({});

  const { isLoaded } = useGoogleMaps() || { isLoaded: true };

  const selectedLine = useMemo(() => {
    return routes.find(r => r.id === parseInt(lineId) || r.id === lineId);
  }, [routes, lineId]);

  const formattedRoute = useMemo(() => {
    if (!selectedLine) return null;
    return {
      id: selectedLine.id,
      from: selectedLine.from,
      to: selectedLine.to,
      stations: selectedLine.stations || []
    };
  }, [selectedLine]);

  const {
    routePath,
    stations: stationCoords,
    isCalculating: mappingLoading,
    error: mappingError
  } = useRouteDirections(formattedRoute);

  // Generate buses based on busesNbr with staggered variables
  const activeBuses = useMemo(() => {
    if (!selectedLine) return [];
    const count = parseInt(selectedLine.busesNbr) || 1;
    return Array.from({ length: count }).map((_, i) => {
      const progress = count === 1 ? 0 : i / count;
      const speedVar = 32 + (i * 3) % 9; // 32, 35, 38 km/h
      const delayVar = (i * 2) % 5;      // 0, 2, 4 min
      return {
        id: `bus-${selectedLine.id}-${i + 1}`,
        fraction: progress,
        baseSpeedKmh: speedVar,
        initialDelayMin: delayVar
      };
    });
  }, [selectedLine]);

  // Socket connection state listeners and registration
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Join and claim authority
    socket.emit('joinTracking', lineId);
    socket.emit('startAdminSimulation', lineId);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.emit('leaveTracking', lineId);
      socket.emit('stopAdminSimulation', lineId);
    };
  }, [lineId]);

  // Handle Map Load & FitBounds
  const handleMapLoad = (mapInstance) => {
    mapRef.current = mapInstance;
    setMap(mapInstance);
    if (routePath.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      routePath.forEach(pt => bounds.extend(pt));
      mapInstance.fitBounds(bounds, 50);
    }
  };

  useEffect(() => {
    if (mapRef.current && routePath.length > 0 && !isFollowMode && !focusedBusId) {
      const bounds = new window.google.maps.LatLngBounds();
      routePath.forEach(pt => bounds.extend(pt));
      mapRef.current.fitBounds(bounds, 50);
    }
  }, [routePath, isFollowMode, focusedBusId]);

  const addLog = useCallback((msg, type = 'info') => {
    setEventLogs(prev => [
      { id: Date.now() + Math.random(), msg, type, time: new Date().toLocaleTimeString() }, 
      ...prev
    ].slice(0, 20));
  }, []);

  const handleTelemetryUpdate = useCallback((busId, data) => {
    setBusTelemetry(prev => ({ ...prev, [busId]: data }));
  }, []);

  // Follow mode smooth lerped camera loop using requestAnimationFrame
  const telemetryRef = useRef(busTelemetry);
  useEffect(() => {
    telemetryRef.current = busTelemetry;
  }, [busTelemetry]);

  const cameraLoopRef = useRef(null);
  useEffect(() => {
    if (!isFollowMode || !focusedBusId || !map) {
      if (cameraLoopRef.current) {
        cancelAnimationFrame(cameraLoopRef.current);
        cameraLoopRef.current = null;
      }
      return;
    }

    const updateCamera = () => {
      const bData = telemetryRef.current[focusedBusId];
      if (bData?.position && map) {
        const currentCenter = map.getCenter();
        if (currentCenter) {
          const targetLat = bData.position.lat;
          const targetLng = bData.position.lng;
          
          const lerpFactor = 0.08; 
          const newLat = currentCenter.lat() + (targetLat - currentCenter.lat()) * lerpFactor;
          const newLng = currentCenter.lng() + (targetLng - currentCenter.lng()) * lerpFactor;
          
          const diff = Math.abs(targetLat - currentCenter.lat()) + Math.abs(targetLng - currentCenter.lng());
          if (diff > 0.00001) {
            map.setCenter({ lat: newLat, lng: newLng });
          }
        }
      }
      cameraLoopRef.current = requestAnimationFrame(updateCamera);
    };

    cameraLoopRef.current = requestAnimationFrame(updateCamera);
    return () => {
      if (cameraLoopRef.current) {
        cancelAnimationFrame(cameraLoopRef.current);
        cameraLoopRef.current = null;
      }
    };
  }, [isFollowMode, focusedBusId, map]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      trackerContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleBusPause = useCallback((busId) => {
    setPausedBusIds(prev => {
      const next = new Set(prev);
      if (next.has(busId)) {
        next.delete(busId);
        addLog(`Simulation du Bus #${busId.split('-').pop()} reprise`, 'success');
      } else {
        next.add(busId);
        addLog(`Simulation du Bus #${busId.split('-').pop()} suspendue`, 'warning');
      }
      return next;
    });
  }, [addLog]);

  // Aggregate telemetry stats for KPIs
  const aggregateStats = useMemo(() => {
    const vals = Object.values(busTelemetry);
    if (!vals.length) {
      return { 
        avgSpeed: 0, 
        avgProgress: 0, 
        onlineCount: 0, 
        movingCount: 0, 
        stoppedCount: 0, 
        delayedCount: 0,
        etaVariance: 0
      };
    }
    const onlineCount = vals.filter(v => v.status !== 'HORS_LIGNE').length;
    const avgSpeed = vals.reduce((acc, v) => acc + v.speed, 0) / vals.length;
    const movingCount = vals.filter(v => v.speed > 0 && v.status === 'EN_CIRCULATION').length;
    const stoppedCount = vals.filter(v => v.status === 'A_L_ARRET').length;
    const delayedCount = vals.filter(v => v.delayMin > 0).length;
    const avgProgress = vals.reduce((acc, v) => acc + v.progress, 0) / vals.length;
    
    // Average delay as ETA variance indicator
    const totalDelay = vals.reduce((acc, v) => acc + (v.delayMin || 0), 0);
    const avgDelay = vals.length > 0 ? totalDelay / vals.length : 0;
    
    return { 
      avgSpeed: Math.round(avgSpeed), 
      avgProgress: Math.round(avgProgress * 100), 
      onlineCount,
      movingCount,
      stoppedCount,
      delayedCount,
      etaVariance: Math.round(avgDelay)
    };
  }, [busTelemetry]);

  if (!isLoaded || routesLoading || mappingLoading) {
    return <div className="admin-loading">Chargement du Dashboard de Suivi...</div>;
  }

  if (!selectedLine || mappingError) {
    return <div className="admin-error">Erreur de chargement de la ligne.</div>;
  }

  return (
    <div className="admin-tracker" ref={trackerContainerRef}>
      {/* Sidebar Telemetry */}
      <aside className="at-sidebar glass-panel">
        <div className="at-header">
          <button className="back-btn" onClick={() => navigate('/lignes')}><FiArrowLeft /> Retour</button>
          <h2>Ligne {selectedLine.id} <span>Live</span></h2>
          <p className="at-route-name">{selectedLine.from} ↔ {selectedLine.to}</p>
        </div>

        {/* Global Connection Warning */}
        {!isConnected && (
          <div className="at-connection-indicator disconnected">
            <FiWifi /> Connexion perdue. Reconnexion...
          </div>
        )}

        <div className="at-kpis">
          <div className="at-kpi">
            <FiWifi className="kpi-icon online" />
            <div className="kpi-data">
              <span className="val">{aggregateStats.onlineCount} / {activeBuses.length}</span>
              <span className="lbl">Bus En Ligne</span>
            </div>
          </div>
          <div className="at-kpi">
            <FiActivity className="kpi-icon" />
            <div className="kpi-data">
              <span className="val">{aggregateStats.avgSpeed} km/h</span>
              <span className="lbl">Vitesse Moyenne</span>
            </div>
          </div>
          <div className="at-kpi">
            <FiClock className="kpi-icon" />
            <div className="kpi-data">
              <span className="val">{aggregateStats.avgProgress}%</span>
              <span className="lbl">Route Complétée</span>
            </div>
          </div>
          <div className="at-kpi">
            <FiClock className="kpi-icon warning" style={{ color: aggregateStats.etaVariance > 0 ? '#f59e0b' : '#10b981' }} />
            <div className="kpi-data">
              <span className="val" style={{ color: aggregateStats.etaVariance > 0 ? '#f59e0b' : '#10b981' }}>
                {aggregateStats.etaVariance > 0 ? `+${aggregateStats.etaVariance} min` : 'À l\'heure'}
              </span>
              <span className="lbl">Retard / Variance ETA</span>
            </div>
          </div>
        </div>

        {/* Fleet Micro Stats Grid */}
        <div className="at-sub-stats">
          <div className="sub-stat-card">
            <strong>{aggregateStats.movingCount}</strong>
            <span>En mouvement</span>
          </div>
          <div className="sub-stat-card">
            <strong>{aggregateStats.stoppedCount}</strong>
            <span>À l'arrêt</span>
          </div>
          <div className="sub-stat-card">
            <strong>{aggregateStats.delayedCount}</strong>
            <span>Retardés</span>
          </div>
        </div>

        <div className="at-controls">
          <button className={`at-btn ${isPaused ? 'active' : ''}`} onClick={() => {
            setIsPaused(!isPaused);
            addLog(isPaused ? "Simulation globale reprise" : "Simulation globale suspendue", isPaused ? 'success' : 'warning');
          }}>
            {isPaused ? <><FiPlay /> Reprendre</> : <><FiPause /> Suspendre</>}
          </button>
          <button className="at-btn" onClick={() => {
            if(mapRef.current && routePath.length > 0) {
              const bounds = new window.google.maps.LatLngBounds();
              routePath.forEach(pt => bounds.extend(pt));
              mapRef.current.fitBounds(bounds, 50);
              setIsFollowMode(false);
              setFocusedBusId(null);
            }
          }}><FiMaximize2 /> Vue Globale</button>
        </div>

        <div className="at-bus-list">
          <h3>Flotte de la Ligne ({activeBuses.length})</h3>
          <div className="bus-list-scroll">
            {activeBuses.map((bus) => {
              const data = busTelemetry[bus.id];
              const isFocused = focusedBusId === bus.id;
              const isBusPaused = pausedBusIds.has(bus.id);
              return (
                <div 
                  key={bus.id} 
                  className={`at-bus-card ${isFocused ? 'focused' : ''}`}
                  onClick={() => {
                    setFocusedBusId(bus.id);
                    setIsFollowMode(true);
                  }}
                >
                  <div className="bus-card-head">
                    <span className="bus-id"><FaBus /> {bus.id.replace(`bus-${selectedLine.id}-`, 'Bus #')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        className={`bus-pause-btn ${isBusPaused ? 'paused' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card focus click
                          toggleBusPause(bus.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isBusPaused ? '#ef4444' : '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          transition: 'color 0.2s, background 0.2s'
                        }}
                      >
                        {isBusPaused ? <FiPlay /> : <FiPause />}
                      </button>
                      <span className={`status-badge ${isBusPaused ? 'A_L_ARRET' : (data?.status || 'HORS_LIGNE')}`}>
                        {isBusPaused ? 'PAUSE' : (data?.status?.replace(/_/g, ' ') || 'En attente')}
                      </span>
                    </div>
                  </div>
                  <div className="bus-card-stats">
                    <span><FiActivity /> {isBusPaused ? 0 : (data?.speed || 0)} km/h</span>
                    <span><FiClock /> ETA: {Math.round((data?.eta || 0)/60)}m</span>
                  </div>
                  <div className="bus-card-station">
                    <FiMapPin /> {data?.station || 'Recherche...'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="at-logs">
          <h3>Journal d'événements</h3>
          <div className="logs-scroll">
            <div className="logs-wrapper">
              {eventLogs.map(log => (
                <div 
                  key={log.id} 
                  className={`log-item ${log.type}`}
                >
                  <span className="log-time">{log.time}</span>
                  <span className="log-msg">{log.msg}</span>
                </div>
              ))}
              {eventLogs.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  Aucun événement récent
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="at-map-area">
        <div className="at-map-controls">
          <button className="at-ctrl-btn" onClick={handleFullscreen} title="Plein écran">
            <FiMaximize2 />
          </button>
          <div style={{ position: 'relative' }}>
            <button className={`at-ctrl-btn ${showLayersMenu ? 'active' : ''}`} onClick={() => setShowLayersMenu(!showLayersMenu)} title="Calques">
              <FiLayers />
            </button>
            {showLayersMenu && (
              <div className="at-layers-menu glass-panel">
                <button className={mapType === 'roadmap' ? 'active' : ''} onClick={() => { setMapType('roadmap'); setShowLayersMenu(false); }}>Plan</button>
                <button className={mapType === 'satellite' ? 'active' : ''} onClick={() => { setMapType('satellite'); setShowLayersMenu(false); }}>Satellite</button>
              </div>
            )}
          </div>
          <button className={`at-ctrl-btn ${isFollowMode ? 'active-pulse' : ''}`} onClick={() => setIsFollowMode(!isFollowMode)} title="Mode Poursuite">
            <FiCrosshair />
          </button>
        </div>

        <NavigationMap
          onLoad={handleMapLoad}
          center={MARRAKECH_CENTER}
          mapTypeId={mapType}
        >
          {routePath.length > 0 && (
            <Polyline
              path={routePath}
              options={{
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 5,
                zIndex: 1,
              }}
            />
          )}

          {stationCoords.map((st, i) => (
            <Marker
              key={i}
              position={st.position}
              icon={{
                url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="%23ffffff" stroke="%233b82f6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
                scaledSize: new window.google.maps.Size(14, 14),
                anchor: new window.google.maps.Point(7, 7)
              }}
              zIndex={2}
            />
          ))}

          {activeBuses.map((bus) => (
            <BusTrackerInstance
              key={bus.id}
              busId={bus.id}
              lineId={selectedLine.id}
              routePath={routePath}
              stations={stationCoords}
              active={true}
              initialProgressFraction={bus.fraction}
              isSimulationPaused={isPaused || pausedBusIds.has(bus.id)}
              onUpdate={handleTelemetryUpdate}
              isFocused={focusedBusId === bus.id}
              map={map}
              baseSpeedKmh={bus.baseSpeedKmh}
              initialDelayMin={bus.initialDelayMin}
              onLog={addLog}
            />
          ))}
        </NavigationMap>
      </main>
    </div>
  );
}
