import { useState, useEffect } from 'react';
import { socket } from '../services/socket';

export function useBusTracking(routeId) {
  const [busData, setBusData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!routeId) return;

    // Join the tracking room for this route
    socket.emit('joinTracking', routeId);

    const handleBusUpdate = (data) => {
      setBusData(data);
    };

    const handleNotification = (notification) => {
      setNotifications((prev) => [...prev, { ...notification, id: Date.now() }]);
      // Auto-dismiss notification after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);
    };

    socket.on('busLocationUpdate', handleBusUpdate);
    socket.on('smartNotification', handleNotification);

    socket.on('connect', () => setIsConnected(true));

    return () => {
      socket.off('busLocationUpdate', handleBusUpdate);
      socket.off('smartNotification', handleNotification);
      socket.off('connect', () => {});
    };
  }, [routeId]);

  return {
    busData,
    notifications,
    isConnected,
  };
}
