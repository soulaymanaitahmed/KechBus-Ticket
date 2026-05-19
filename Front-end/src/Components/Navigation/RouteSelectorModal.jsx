import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiMapPin } from 'react-icons/fi';
import { FaBusAlt } from 'react-icons/fa';

export default function RouteSelectorModal({ isOpen, onClose, routes, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset search when opened
  useEffect(() => {
    if (isOpen) setSearchTerm('');
  }, [isOpen]);

  const filteredRoutes = routes.filter(route => {
    const s = searchTerm.toLowerCase();
    return (
      route.num.toString().toLowerCase().includes(s) ||
      route.from.toLowerCase().includes(s) ||
      route.to.toLowerCase().includes(s) ||
      (route.stations && route.stations.some(st => st.toLowerCase().includes(s)))
    );
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="sn-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="sn-modal-content"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sn-modal-header">
              <h2>Choisir une ligne</h2>
              <button type="button" className="sn-modal-close" onClick={onClose}>
                <FiX size={20} />
              </button>
            </div>

            <div className="sn-modal-search">
              <FiSearch className="sn-modal-search-icon" size={18} />
              <input
                type="text"
                placeholder="Rechercher une ligne, destination, station..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="sn-modal-list">
              {filteredRoutes.length === 0 ? (
                <div className="sn-modal-empty">Aucune ligne ne correspond à votre recherche.</div>
              ) : (
                filteredRoutes.map((route) => (
                  <button
                    type="button"
                    key={route.id}
                    className="sn-modal-item"
                    onClick={() => {
                      onSelect(route.id);
                      onClose();
                    }}
                  >
                    <div className="sn-modal-item-badge">{route.num}</div>
                    <div className="sn-modal-item-info">
                      <div className="sn-modal-item-title">
                        {route.from} <span style={{color: 'var(--color-text-muted)'}}>→</span> {route.to}
                      </div>
                      <div className="sn-modal-item-sub">
                        <span><FiMapPin size={12}/> {route.stations?.length || 0} arrêts</span>
                        <span><FaBusAlt size={12}/> {route.busesNbr} bus</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
