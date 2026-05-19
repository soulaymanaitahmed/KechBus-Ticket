import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load from session storage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('sn_notifications');
    const savedUnread = sessionStorage.getItem('sn_unread_count');
    if (saved) {
      try { setNotifications(JSON.parse(saved)); } catch (e) {}
    }
    if (savedUnread) {
      setUnreadCount(parseInt(savedUnread, 10));
    }
  }, []);

  // Save to session storage when changed
  useEffect(() => {
    sessionStorage.setItem('sn_notifications', JSON.stringify(notifications));
    sessionStorage.setItem('sn_unread_count', unreadCount.toString());
  }, [notifications, unreadCount]);

  const addNotification = useCallback((message, category = 'info') => {
    const newNotif = {
      id: Date.now() + Math.random(),
      message,
      category,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50); // Keep last 50
      return updated;
    });
    setUnreadCount(prev => prev + 1);

    // Play sound (soft ping)
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Catch autoplay restrictions
    } catch (e) {}
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
