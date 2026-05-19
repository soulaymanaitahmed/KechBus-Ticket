import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell } from 'react-icons/fi';

function Toast({ notification, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      layout
      className="sn-notification"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 10, opacity: 0 }}
      transition={{ type: 'spring', damping: 25 }}
    >
      <span className="sn-notification-bell"><FiBell size={20} /></span>
      <span className="sn-notification-label">Notification</span>
      <span className="sn-notification-msg">{notification.message}</span>
      <span className="sn-notification-time">{notification.time}</span>
    </motion.div>
  );
}

export default function NotificationSystem({ notifications, onDismiss }) {
  const latest = notifications[0];

  return (
    <AnimatePresence mode="popLayout">
      {latest ? (
        <Toast
          key={latest.id}
          notification={latest}
          onDismiss={onDismiss || (() => {})}
        />
      ) : (
        <div className="sn-notification" key="default-notif">
          <span className="sn-notification-bell"><FiBell size={20} /></span>
          <span className="sn-notification-label">Notification</span>
          <span className="sn-notification-msg">Le bus arrivera à Avenue Hassan II dans 2 minutes</span>
          <span className="sn-notification-time">12:43</span>
        </div>
      )}
    </AnimatePresence>
  );
}
