import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../Contexts/NotificationContext';
import { FiBell, FiCheckCircle, FiAlertTriangle, FiInfo, FiClock, FiMapPin } from 'react-icons/fi';

const CategoryIcon = ({ category }) => {
  switch (category) {
    case 'arrival': return <FiMapPin size={20} />;
    case 'departure': return <FiClock size={20} />;
    case 'completed': return <FiCheckCircle size={20} />;
    case 'warning': return <FiAlertTriangle size={20} />;
    default: return <FiInfo size={20} />;
  }
};

export default function NotificationToaster() {
  const { notifications } = useNotification();
  const [activeToasts, setActiveToasts] = useState([]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      // Only show toast if it's new (within last 500ms)
      if (Date.now() - latest.timestamp < 500) {
        setActiveToasts(prev => {
          if (prev.find(t => t.id === latest.id)) return prev;
          return [...prev, latest].slice(-3); // Max 3 toasts
        });
        
        // Auto remove
        setTimeout(() => {
          setActiveToasts(prev => prev.filter(t => t.id !== latest.id));
        }, 4000);
      }
    }
  }, [notifications]);

  return (
    <div className="sn-toaster-container">
      <AnimatePresence>
        {activeToasts.map(toast => (
          <motion.div
            key={toast.id}
            layout
            className="sn-toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={`sn-toast-icon sn-toast-icon--${toast.category}`}>
              <CategoryIcon category={toast.category} />
            </div>
            <div className="sn-toast-content">
              <span className="sn-toast-title">Notification</span>
              <span className="sn-toast-msg">{toast.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
