import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBus, FaArrowLeft, FaClock, FaRulerCombined, FaMapPin, FaSignal } from 'react-icons/fa';
import { socket } from '../services/socket';
import { useMarkerInterpolation } from '../hooks/useMarkerInterpolation';
import { useRouteDirections } from '../hooks/useRouteDirections';
import { useBusMovementEngine } from './Navigation/BusMovementEngine';
import AdvancedMarker from './Tracking/AdvancedMarker';
import "../Styles/LiveTrackerModal.css";

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Uber/Careem inspired Dark Mobility Style
const darkMobilityStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#1d2c4d" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3646" }] },
  { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{ "color": "#334e62" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a7d" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2c6675" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#255763" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] }
];

const BusMarkerInstance = ({ bus, map, isFocused, onClick }) => {
  const interpolatedPos = useMarkerInterpolation(bus.position);
  
  const contentHtml = useMemo(() => {
    if (!interpolatedPos) return null;
    return `
      <div class="lt-bus-marker" style="
        position: relative;
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -55%);
        cursor: pointer;
      ">
        <div class="lt-bus-pulse" style="
          position: absolute;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 2px solid ${isFocused ? 'rgba(37, 99, 235, 0.6)' : 'rgba(59, 130, 246, 0.4)'};
          animation: ltPulse 1.8s ease-out infinite;
        "></div>
        <div class="lt-bus-glow" style="
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: radial-gradient(circle, ${isFocused ? 'rgba(37, 99, 235, 0.4)' : 'rgba(59, 130, 246, 0.3)'} 0%, transparent 70%);
        "></div>
        <div class="lt-bus-icon-wrap" style="
          transform: rotate(${bus.heading}deg);
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        ">
          <img src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png" style="width: 38px; height: 38px;" />
        </div>
      </div>
    `;
  }, [interpolatedPos, bus.heading, isFocused]);

  if (!interpolatedPos) return null;

  return (
    <AdvancedMarker
      map={map}
      position={interpolatedPos}
      title={bus.id}
      content={contentHtml}
    />
  );
};

const LiveTrackerModal = ({ isOpen, onClose, route }) => {
  const [map, setMap] = useState(null);
  
  const [telemetryMode, setTelemetryMode] = useState("socket-driven");
  const [buses, setBuses] = useState({});
  const [selectedBusId, setSelectedBusId] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(socket ? socket.connected : true);

  const lastSocketUpdateRef = useRef(0);

  // Formatting route for directions hook
  const formattedRoute = useMemo(() => {
    if (!route) return null;
    return {
      id: route.id,
      from: route.from,
      to: route.to,
      stations: route.stations || []
    };
  }, [route]);

  const {
    routePath,
    stations: stationCoords,
    totalDurationSec,
    isCalculating,
    error: routeError
  } = useRouteDirections(formattedRoute);

  // Local movement engine simulation fallback
  const localEngine = useBusMovementEngine({
    routePath,
    stations: stationCoords,
    active: isOpen && telemetryMode === "local-simulation" && routePath.length > 0,
    baseSpeedKmh: 35,
    totalTripDurationSec: totalDurationSec || 600,
  });

  // Construct simulated bus representation
  const simulatedBus = useMemo(() => {
    if (telemetryMode !== "local-simulation") return null;
    return {
      id: "Simulé",
      position: localEngine.busPosition,
      heading: localEngine.busHeading,
      speed: localEngine.busSpeed,
      eta: localEngine.remainingETA,
      status: localEngine.stoppedAtStation ? "A l'arrêt" : "En circulation",
      currentStation: localEngine.stoppedAtStation || (stationCoords[localEngine.currentStationIdx]?.name) || "En route",
      progress: localEngine.routeProgress,
      driverName: "Simulation (Chauffeur local)"
    };
  }, [telemetryMode, localEngine, stationCoords]);

  // Real-time socket coordination
  useEffect(() => {
    if (!isOpen || !route || !socket) return;

    // Join route room
    socket.emit('joinTracking', route.id || route.num);

    const handleBusUpdate = (data) => {
      // Normalize route numbers
      const cleanRouteId = route.id ? route.id.toString() : route.num.replace('L', '');
      const cleanDataLine = data.lineNumber ? data.lineNumber.toString().replace('L', '') : '';
      
      if (cleanDataLine !== cleanRouteId) return;

      lastSocketUpdateRef.current = Date.now();
      setTelemetryMode("socket-driven");

      setBuses(prev => {
        const next = { ...prev };
        next[data.busId] = {
          id: data.busId,
          position: { lat: data.lat, lng: data.lng },
          heading: data.heading,
          speed: data.speed,
          eta: data.eta,
          status: data.status,
          currentStation: data.currentStation,
          progress: data.progress,
          driverName: data.driverName || "Chauffeur KechBus",
          updatedAt: Date.now()
        };
        // Clean stale buses
        for (const bid in next) {
          if (Date.now() - next[bid].updatedAt > 15000) {
            delete next[bid];
          }
        }
        return next;
      });
    };

    const handleNotification = (notif) => {
      setNotifications(prev => [...prev, { ...notif, id: Date.now() }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notif.id));
      }, 5000);
    };

    socket.on('busLocationUpdate', handleBusUpdate);
    socket.on('smartNotification', handleNotification);

    return () => {
      socket.off('busLocationUpdate', handleBusUpdate);
      socket.off('smartNotification', handleNotification);
      socket.emit('leaveTracking', route.id || route.num);
    };
  }, [isOpen, route]);

  // Check socket connectivity state
  useEffect(() => {
    if (!socket) return;
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Heartbeat monitoring for socket telemetry
  useEffect(() => {
    if (!isOpen) return;
    lastSocketUpdateRef.current = Date.now(); // Initialize
    const interval = setInterval(() => {
      const diffSec = (Date.now() - lastSocketUpdateRef.current) / 1000;
      if (diffSec > 6) {
        setTelemetryMode("local-simulation");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const busList = useMemo(() => Object.values(buses), [buses]);

  // Active tracked bus details helper
  const activeBusInfo = useMemo(() => {
    if (telemetryMode === "local-simulation") {
      return simulatedBus;
    }
    const currentBus = buses[selectedBusId] || busList[0];
    return currentBus || null;
  }, [telemetryMode, simulatedBus, buses, selectedBusId, busList]);

  // Smooth camera follow
  useEffect(() => {
    if (map && activeBusInfo?.position) {
      map.panTo(activeBusInfo.position);
    }
  }, [map, activeBusInfo?.position]);

  const startMarkerContent = useMemo(() => {
    if (!route) return null;
    return `
      <div style="
        background-color: #10b981;
        color: white;
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        font-weight: 800;
        font-size: 11px;
        padding: 5px 10px;
        border-radius: 20px;
        box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
        border: 2px solid white;
        white-space: nowrap;
        transform: translate(-50%, -100%);
      ">
        🟢 ${route.from}
      </div>
    `;
  }, [route]);

  const endMarkerContent = useMemo(() => {
    if (!route) return null;
    return `
      <div style="
        background-color: #ef4444;
        color: white;
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        font-weight: 800;
        font-size: 11px;
        padding: 5px 10px;
        border-radius: 20px;
        box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
        border: 2px solid white;
        white-space: nowrap;
        transform: translate(-50%, -100%);
      ">
        🏁 ${route.to}
      </div>
    `;
  }, [route]);

  const stopsList = useMemo(() => {
    if (stationCoords && stationCoords.length > 0) {
      return stationCoords.map((st, index) => {
        let label = "+0 min";
        if (index === 0) label = "Départ";
        else if (index === stationCoords.length - 1) label = "Terminus";
        else label = `+${index * 3} min`;
        return { name: st.name, time: label };
      });
    }
    return [
      { name: route?.from, time: "Départ" },
      { name: route?.to, time: "Arrivée" }
    ];
  }, [stationCoords, route]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="lt-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="lt-modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {/* Inject Dynamic Keyframes for Pulsing Bus */}
          <style>{`
            @keyframes ltPulse {
              0% { transform: scale(0.8); opacity: 1; }
              100% { transform: scale(1.8); opacity: 0; }
            }
          `}</style>

          {/* Main Map Layer */}
          <div className="lt-main">
            <div className="lt-map-container">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={activeBusInfo?.position || { lat: 31.6295, lng: -7.9810 }}
                zoom={15}
                options={{
                  styles: darkMobilityStyle,
                  disableDefaultUI: true,
                  zoomControl: false,
                  clickableIcons: false,
                  mapId: 'kechbus_live_modal',
                }}
                onLoad={mapInstance => setMap(mapInstance)}
              >
                {/* Route rendering */}
                {routePath.length > 0 && (
                  <Polyline
                    path={routePath}
                    options={{
                      strokeColor: '#3b82f6',
                      strokeOpacity: 0.8,
                      strokeWeight: 6,
                      clickable: false,
                    }}
                  />
                )}

                {/* Start Terminal Advanced Marker */}
                {routePath.length > 0 && (
                  <AdvancedMarker
                    map={map}
                    position={routePath[0]}
                    title={route?.from}
                    content={startMarkerContent}
                  />
                )}

                {/* End Terminal Advanced Marker */}
                {routePath.length > 0 && (
                  <AdvancedMarker
                    map={map}
                    position={routePath[routePath.length - 1]}
                    title={route?.to}
                    content={endMarkerContent}
                  />
                )}

                {/* Render intermediate stations as small dots */}
                {stationCoords.map((st, idx) => {
                  if (idx === 0 || idx === stationCoords.length - 1) return null;
                  return (
                    <Marker
                      key={idx}
                      position={st.position}
                      icon={{
                        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="%23ffffff" stroke="%233b82f6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
                        scaledSize: new window.google.maps.Size(10, 10),
                        anchor: new window.google.maps.Point(5, 5)
                      }}
                    />
                  );
                })}

                {/* Render Simulated Fallback Bus */}
                {telemetryMode === "local-simulation" && simulatedBus && simulatedBus.position && (
                  <BusMarkerInstance
                    bus={simulatedBus}
                    map={map}
                    isFocused={true}
                  />
                )}

                {/* Render Socket Driven Buses */}
                {telemetryMode === "socket-driven" && busList.map(b => (
                  <BusMarkerInstance
                    key={b.id}
                    bus={b}
                    map={map}
                    isFocused={activeBusInfo?.id === b.id}
                  />
                ))}
              </GoogleMap>
            </div>
          </div>

          {/* Floating UI Elements */}
          <div className="lt-header-floating">
            <button className="lt-back-btn" onClick={onClose}>
              <FaArrowLeft />
            </button>

            {/* Live Notifications Toaster */}
            <div className="lt-toast-container">
              <AnimatePresence>
                {notifications.map(notif => (
                  <motion.div 
                    key={notif.id}
                    className="lt-toast"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                  >
                    <div className="lt-toast-icon">
                      <FaBus size={14} color="white" />
                    </div>
                    <div className="lt-toast-content">
                      {notif.message}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobility Bottom Sheet */}
          <motion.div 
            className="lt-bottom-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.2 }}
          >
            <div className="lt-sheet-handle" />
            
            <div className="lt-sheet-header">
              <div className="lt-route-title">
                <div className="lt-line-pill">
                  <FaBus size={12} />
                  Ligne {route?.num || "5"}
                </div>
                <h2>{route?.from} → {route?.to}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div className={`lt-live-pulse ${telemetryMode === "local-simulation" ? 'fallback' : ''}`} />
                  <span className="lt-eta-label">
                    {telemetryMode === "socket-driven" 
                      ? "Suivi en temps réel actif (Socket)" 
                      : "Simulation locale active (Fallback)"}
                  </span>
                </div>
              </div>
              
              <div className="lt-eta-badge">
                <span className="lt-eta-time">
                  {activeBusInfo ? (
                    typeof activeBusInfo.eta === 'number' 
                      ? `${Math.round(activeBusInfo.eta / 60)} min`
                      : activeBusInfo.eta
                  ) : "Calcul..."}
                </span>
                <span className="lt-eta-label">Temps d'arrivée estimé</span>
              </div>
            </div>

            {/* Socket Bus Selector if multiple buses online */}
            {telemetryMode === "socket-driven" && busList.length > 1 && (
              <div className="lt-bus-selector">
                <span>Sélectionner le bus :</span>
                <div className="selector-pills">
                  {busList.map((b) => {
                    const isSel = (selectedBusId === b.id) || (selectedBusId === null && busList[0]?.id === b.id);
                    return (
                      <button 
                        key={b.id} 
                        className={`pill-btn ${isSel ? 'active' : ''}`}
                        onClick={() => setSelectedBusId(b.id)}
                      >
                        Bus #{b.id.split('-').pop()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Offline indicator if socket disconnected */}
            {!isConnected && (
              <div className="lt-offline-alert">
                <FaSignal className="wifi-icon-disconnected animate-pulse" />
                <span>Connexion perdue. Tentative de reconnexion... (Données stockées visibles)</span>
              </div>
            )}

            <div className="lt-quick-stats">
              <div className="lt-quick-stat">
                <label><FaSignal /> Conducteur</label>
                <span>{activeBusInfo?.driverName || "Recherche..."}</span>
              </div>
              <div className="lt-quick-stat">
                <label><FaClock /> Vitesse</label>
                <span>{activeBusInfo?.speed || 0} km/h</span>
              </div>
              <div className="lt-quick-stat">
                <label><FaRulerCombined /> Station Actuelle</label>
                <span style={{ fontSize: '11px' }}>{activeBusInfo?.currentStation || "En route"}</span>
              </div>
            </div>

            <div className="lt-timeline-container">
              <div className="lt-sheet-sub-label">Progression des stations</div>
              <div className="lt-timeline">
                {stopsList.map((stop, index) => {
                  // Highlight stop if it matches the current station of activeBusInfo
                  const isCurrentStop = activeBusInfo?.currentStation === stop.name;
                  return (
                    <div key={index} className={`lt-timeline-item ${isCurrentStop ? 'highlighted' : ''}`}>
                      <div className="lt-timeline-marker">
                        <div className={`lt-timeline-dot ${index === 0 ? 'active' : ''} ${isCurrentStop ? 'pulse-current' : ''}`} />
                        {index !== stopsList.length - 1 && <div className="lt-timeline-line" />}
                      </div>
                      <div className="lt-timeline-info">
                        <strong style={{ color: isCurrentStop ? '#3b82f6' : 'inherit' }}>{stop.name}</strong>
                        <span>{stop.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveTrackerModal;
