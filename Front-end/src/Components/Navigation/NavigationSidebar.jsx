import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiRepeat, FiChevronDown, FiNavigation } from 'react-icons/fi';
import { FaBusAlt } from 'react-icons/fa';

export default function NavigationSidebar({ 
  selectedLine, 
  onChangeRouteClick, 
  stations = [], 
  currentStationIdx = 0 
}) {
  if (!selectedLine) return null;

  return (
    <motion.aside
      className="sn-left-panel sn-left-panel--focus"
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Header ── */}
      <div className="sn-header">
        <h1 className="sn-header-title">
          <span>KechBus</span> – Navigator
        </h1>
        <p className="sn-header-sub">Suivi intelligent en temps réel</p>
      </div>

      {/* ── Change Route Button ── */}
      <button type="button" className="sn-route-select-btn" onClick={onChangeRouteClick}>
        <div className="sn-route-select-badge">{selectedLine.num}</div>
        <div className="sn-route-select-info">
          <span className="sn-route-select-name">{selectedLine.from} ↔ {selectedLine.to}</span>
          <span className="sn-route-select-sub">Changer de ligne</span>
        </div>
        <FiChevronDown className="sn-route-select-icon" />
      </button>

      {/* ── Route Info Dashboard ── */}
      <div className="sn-route-dashboard">
        <div className="sn-dashboard-item">
          <FaBusAlt size={16} color="var(--color-accent)" />
          <div>
            <div className="sn-dashboard-value">{selectedLine.busesNbr || 1} en service</div>
            <div className="sn-dashboard-label">Bus actifs</div>
          </div>
        </div>
        <div className="sn-dashboard-item">
          <FiClock size={16} color="var(--color-orange)" />
          <div>
            <div className="sn-dashboard-value">{selectedLine.duration || '30 min'}</div>
            <div className="sn-dashboard-label">Temps total</div>
          </div>
        </div>
      </div>

      {/* ── Stations Timeline ── */}
      <div className="sn-timeline-section">
        <h3 className="sn-timeline-title">
          <FiNavigation size={18} /> Itinéraire
        </h3>
        
        <div className="sn-timeline">
          {stations.map((st, i) => {
            const isPassed = i < currentStationIdx;
            const isCurrent = i === currentStationIdx;
            
            let statusClass = '';
            if (isPassed) statusClass = 'sn-node--passed';
            else if (isCurrent) statusClass = 'sn-node--current';
            else statusClass = 'sn-node--future';

            return (
              <div key={i} className={`sn-timeline-item ${statusClass}`}>
                <div className="sn-timeline-track">
                  <div className="sn-timeline-dot">
                    {isCurrent && <div className="sn-timeline-pulse" />}
                  </div>
                  {i < stations.length - 1 && <div className="sn-timeline-line" />}
                </div>
                <div className="sn-timeline-content">
                  <div className="sn-timeline-name">{st.name}</div>
                  <div className="sn-timeline-tags">
                    {st.type === 'depart' && <span className="sn-tag sn-tag--depart">Départ</span>}
                    {st.type === 'terminus' && <span className="sn-tag sn-tag--arrivee">Terminus</span>}
                    {isCurrent && <span className="sn-tag sn-tag--active">Prochain arrêt</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </motion.aside>
  );
}
