import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GoogleMap, Marker, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBus, FaArrowLeft, FaClock, FaRulerCombined, FaMapPin, FaSignal } from 'react-icons/fa';
import { socket } from '../services/socket';
import { useMarkerInterpolation } from '../hooks/useMarkerInterpolation';
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

const LiveTrackerModal = ({ isOpen, onClose, route }) => {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [busPosition, setBusPosition] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isDelayed, setIsDelayed] = useState(false);
  const [heading, setHeading] = useState(0);
  const [driverName, setDriverName] = useState("En attente...");
  const [notifications, setNotifications] = useState([]);

  // Interpolate bus position for 60FPS smooth movement
  const interpolatedBusPos = useMarkerInterpolation(busPosition);

  // Auto-follow logic
  useEffect(() => {
    if (map && interpolatedBusPos) {
      map.panTo(interpolatedBusPos);
    }
  }, [map, interpolatedBusPos]);

  // Real-time Socket.io Logic
  useEffect(() => {
    if (!isOpen || !route) return;

    socket.emit('joinTracking', route.num || route.l_id);

    const handleBusUpdate = (data) => {
      setBusPosition({ lat: data.lat, lng: data.lng });
      setSpeed(data.speed);
      setLastUpdate(data.updatedAt);
      setIsDelayed(data.status === "Delayed");
      setHeading(data.heading);
      setDriverName(data.driverName);
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
    };
  }, [isOpen, route]);

  // Directions fetching
  useEffect(() => {
    if (!isOpen || !route) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: route.from,
        destination: route.to,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          const leg = result.routes[0].legs[0];
          setDistance(leg.distance.text);
          setEta(leg.duration.text);
        }
      }
    );
  }, [isOpen, route]);

  if (!isOpen) return null;

  const stops = [
    { name: route?.from, time: "Départ" },
    { name: "Station Intermédiaire 1", time: "+10 min" },
    { name: "Station Intermédiaire 2", time: "+20 min" },
    { name: route?.to, time: "Arrivée" }
  ];

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
          {/* Main Map Layer */}
          <div className="lt-main">
            <div className="lt-map-container">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={busPosition || { lat: 31.6295, lng: -7.9810 }}
                zoom={15}
                options={{
                  styles: darkMobilityStyle,
                  disableDefaultUI: true,
                  zoomControl: false,
                  clickableIcons: false
                }}
                onLoad={map => setMap(map)}
              >
                {directions && (
                  <DirectionsRenderer 
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: '#3b82f6',
                        strokeOpacity: 0.6,
                        strokeWeight: 6,
                      },
                      markerOptions: { visible: false }
                    }}
                  />
                )}

                {interpolatedBusPos && (
                  <Marker
                    position={interpolatedBusPos}
                    icon={{
                      url: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
                      scaledSize: new window.google.maps.Size(50, 50),
                      anchor: new window.google.maps.Point(25, 25),
                      rotation: heading,
                    }}
                  />
                )}

                {/* Real-time Trajectory Polyline */}
                {directions && (
                  <Polyline
                    path={directions.routes[0].overview_path}
                    options={{
                      strokeColor: "#3b82f6",
                      strokeOpacity: 0.8,
                      strokeWeight: 6,
                      icons: [{
                        icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                        offset: '100%',
                        repeat: '100px'
                      }]
                    }}
                  />
                )}
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
                  <div className="lt-live-pulse" />
                  <span className="lt-eta-label">Suivi en temps réel actif</span>
                </div>
              </div>
              
              <div className="lt-eta-badge">
                <span className="lt-eta-time">{eta || "12 min"}</span>
                <span className="lt-eta-label">Temps d'arrivée estimé</span>
              </div>
            </div>

            <div className="lt-quick-stats">
              <div className="lt-quick-stat">
                <label><FaSignal /> Conducteur</label>
                <span>{driverName}</span>
              </div>
              <div className="lt-quick-stat">
                <label><FaClock /> Vitesse</label>
                <span>{speed} km/h</span>
              </div>
              <div className="lt-quick-stat">
                <label><FaRulerCombined /> Distance</label>
                <span>{distance}</span>
              </div>
            </div>

            <div className="lt-timeline-container">
              <div className="lt-timeline">
                {stops.map((stop, index) => (
                  <div key={index} className="lt-timeline-item">
                    <div className="lt-timeline-marker">
                      <div className={`lt-timeline-dot ${index === 0 ? 'active' : ''}`} />
                      {index !== stops.length - 1 && <div className="lt-timeline-line" />}
                    </div>
                    <div className="lt-timeline-info">
                      <strong>{stop.name}</strong>
                      <span>{stop.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveTrackerModal;
