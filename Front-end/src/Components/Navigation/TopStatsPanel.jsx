import React, { useState } from 'react';
import { FiClock, FiUsers, FiBell, FiX } from 'react-icons/fi';
import { FaBusAlt } from 'react-icons/fa';
import { RiTicket2Line } from 'react-icons/ri';
import { useNotification } from '../../Contexts/NotificationContext';
import NotificationPanel from './NotificationPanel';

export default function TopStatsPanel({
  selectedLine, onQuit,
}) {
  const { unreadCount } = useNotification();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  if (!selectedLine) return null;

  return (
    <div className="sn-stats-bar">
      {/* Line chip */}
      <div className="sn-stats-chip">
        <span className="sn-stats-chip-icon"><FaBusAlt size={22} /></span>
        <div className="sn-stats-chip-text">
          <span className="sn-stats-chip-value">{selectedLine.num}</span>
          <span className="sn-stats-chip-label">Ligne sélectionnée</span>
        </div>
      </div>

      <div className="sn-stats-divider" />

      {/* Duration */}
      <div className="sn-stats-group">
        <span className="sn-stats-icon"><FiClock size={20} /></span>
        <div className="sn-stats-text">
          <span className="sn-stats-value">{selectedLine.duration}</span>
          <span className="sn-stats-label">Durée totale</span>
        </div>
      </div>

      <div className="sn-stats-divider" />

      {/* Price */}
      <div className="sn-stats-group">
        <span className="sn-stats-icon"><RiTicket2Line size={20} /></span>
        <div className="sn-stats-text">
          <span className="sn-stats-value">{selectedLine.price} DH</span>
          <span className="sn-stats-label">Prix du trajet</span>
        </div>
      </div>

      <div className="sn-stats-divider" />

      {/* Seats */}
      <div className="sn-stats-group">
        <span className="sn-stats-icon"><FiUsers size={20} /></span>
        <div className="sn-stats-text">
          <span className="sn-stats-value">{selectedLine.seats || 35}</span>
        </div>
      </div>

      {/* Right buttons */}
      <div className="sn-stats-right" style={{ position: 'relative' }}>
        <button 
          type="button" 
          className="sn-top-btn sn-notif-trigger"
          onClick={() => setIsNotifOpen(!isNotifOpen)}
        >
          <FiBell size={18} />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="sn-top-btn-badge">{Math.min(unreadCount, 99)}</span>
          )}
        </button>
        <button type="button" className="sn-top-btn" onClick={onQuit}>
          <FiX size={16} />
          <span>Quitter</span>
        </button>

        <NotificationPanel 
          isOpen={isNotifOpen} 
          onClose={() => setIsNotifOpen(false)} 
        />
      </div>
    </div>
  );
}
