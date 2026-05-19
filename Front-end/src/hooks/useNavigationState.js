import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LINE_N1, STATIONS, ROUTE_WAYPOINTS } from '../Components/Navigation/routeData';

export function useNavigationState() {
  const [updateCountdown, setUpdateCountdown] = useState(2);
  const [lastUpdate, setLastUpdate] = useState('12:43:30');
  const [notifications, setNotifications] = useState([]);
  const mapRef = useRef(null);

  const selectedLine = LINE_N1;

  // Build station objects compatible with BusMovementEngine
  const stations = useMemo(() => {
    return STATIONS.map((s, i) => ({
      name: s.name,
      position: { lat: s.lat, lng: s.lng },
      index: i,
      type: s.type,
      stopDuration: s.type === 'terminus' && i === STATIONS.length - 1 ? 0 : 5000 + Math.floor(Math.random() * 3000),
    }));
  }, []);

  const routePath = ROUTE_WAYPOINTS;

  const addNotification = useCallback((message) => {
    const notif = {
      id: Date.now() + Math.random(),
      message,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setNotifications(prev => [notif, ...prev].slice(0, 5));
    setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== notif.id)), 6000);
  }, []);

  // Countdown timer
  useEffect(() => {
    const iv = setInterval(() => setUpdateCountdown(c => (c <= 1 ? 2 : c - 1)), 1000);
    return () => clearInterval(iv);
  }, []);

  return {
    selectedLine,
    stations,
    routePath,
    mapRef,
    updateCountdown,
    lastUpdate,
    setLastUpdate,
    notifications,
    setNotifications,
    addNotification,
  };
}
