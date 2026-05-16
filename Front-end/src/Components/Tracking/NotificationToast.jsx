import React from 'react';
import { motion } from 'framer-motion';
import { FiBell } from 'react-icons/fi';
import './NotificationToast.css';

const NotificationToast = ({ notification, onDismiss }) => {
  return (
    <motion.div
      className="notification-toast"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
    >
      <div className="toast-content">
        <div className="toast-icon">
          <FiBell />
        </div>
        <div className="toast-text">
          <span className="toast-title">Live Update</span>
          <p>{notification.message}</p>
        </div>
        <button className="toast-close" onClick={() => onDismiss(notification.id)}>
          &times;
        </button>
      </div>
    </motion.div>
  );
};

export default NotificationToast;
