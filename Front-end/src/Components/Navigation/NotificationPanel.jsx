import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../Contexts/NotificationContext';
import { FiMapPin, FiClock, FiCheckCircle, FiAlertTriangle, FiInfo, FiTrash2, FiBell } from 'react-icons/fi';

function getRelativeTime(timestamp) {
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) return "À l'instant";
  const diffInMins = Math.floor(diffInSeconds / 60);
  if (diffInMins < 60) return `Il y a ${diffInMins} min`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours} h`;
  return new Date(timestamp).toLocaleDateString('fr-FR');
}

const CategoryIcon = ({ category }) => {
  switch (category) {
    case 'arrival': return <FiMapPin size={18} />;
    case 'departure': return <FiClock size={18} />;
    case 'completed': return <FiCheckCircle size={18} />;
    case 'warning': return <FiAlertTriangle size={18} />;
    default: return <FiInfo size={18} />;
  }
};

export default function NotificationPanel({ isOpen, onClose }) {
  const { notifications, markAllAsRead, clearAll } = useNotification();
  const panelRef = useRef(null);
  const [, forceRender] = useState({});

  useEffect(() => {
    if (isOpen) {
      markAllAsRead();
      // Update relative times every minute
      const iv = setInterval(() => forceRender({}), 60000);
      return () => clearInterval(iv);
    }
  }, [isOpen, markAllAsRead]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest('.sn-notif-trigger')) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className="sn-notif-panel"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <div className="sn-notif-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button type="button" className="sn-notif-clear-btn" onClick={clearAll}>
                <FiTrash2 size={14} /> Vider
              </button>
            )}
          </div>
          
          <div className="sn-notif-list">
            {notifications.length === 0 ? (
              <div className="sn-notif-empty">
                <FiBell size={32} />
                <p>Aucune notification pour le moment</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`sn-notif-item ${!notif.read ? 'sn-notif-item--unread' : ''}`}>
                  <div className={`sn-notif-icon sn-notif-icon--${notif.category}`}>
                    <CategoryIcon category={notif.category} />
                  </div>
                  <div className="sn-notif-content">
                    <p>{notif.message}</p>
                    <span>{getRelativeTime(notif.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
