import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiClock, FiUser, FiAlertCircle } from 'react-icons/fi';
import './TrackingBottomSheet.css';

const TrackingBottomSheet = ({ busData, route }) => {
  const [expanded, setExpanded] = useState(false);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (!busData) return;

    // Realistic ETA Calculation
    // In a real app, we would use Google Distance Matrix API.
    // Here, we estimate based on the progress of the bus along the predefined path.
    const remainingProgress = 1 - busData.progress;
    const estimatedMins = Math.ceil(remainingProgress * 15); // Assuming 15 min full trip
    setEta(estimatedMins);
  }, [busData]);

  const stations = route?.stations || [];

  return (
    <motion.div
      className="bottom-sheet"
      initial={{ y: '70%' }}
      animate={{ y: expanded ? '10%' : '70%' }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(e, info) => {
        if (info.offset.y < -50) setExpanded(true);
        if (info.offset.y > 50) setExpanded(false);
      }}
    >
      <div className="sheet-handle" onClick={() => setExpanded(!expanded)} />

      <div className="sheet-content">
        <div className="sheet-header">
          <div className="route-info">
            <h2 className="route-title">Ligne {route?.num || 'N/A'}</h2>
            <p className="route-subtitle">{route?.from} ➔ {route?.to}</p>
          </div>
          <div className="eta-badge">
            <FiClock className="eta-icon" />
            <span className="eta-time">{eta ? `${eta} mins` : '--'}</span>
          </div>
        </div>

        <div className="sheet-stats">
          <div className="stat-item">
            <span className="stat-label">Status</span>
            <span className={`stat-value status-${busData?.status?.toLowerCase().replace(/\s+/g, '-')}`}>
              {busData?.status || 'Unknown'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Speed</span>
            <span className="stat-value">{busData?.speed || 0} km/h</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Driver</span>
            <span className="stat-value">{busData?.driverName || 'N/A'}</span>
          </div>
        </div>

        <div className="stations-container">
          <h3 className="stations-title"><FiMapPin /> Route Progress</h3>
          <div className="stations-list">
            {stations.map((st, idx) => {
              const isPassed = busData && busData.progress >= (st.pathIndex / (route.path?.length || 1));
              const isActive = busData && busData.currentStation === st.name;

              return (
                <div key={idx} className={`station-item ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}>
                  <div className="station-marker">
                    <div className="marker-dot" />
                    {idx < stations.length - 1 && <div className="marker-line" />}
                  </div>
                  <div className="station-details">
                    <span className="station-name">{st.name}</span>
                    <span className="station-state">
                      {isActive ? 'Arriving' : isPassed ? 'Passed' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrackingBottomSheet;
