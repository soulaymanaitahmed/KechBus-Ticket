import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiCalendar, FiFilter, FiActivity, FiUser } from 'react-icons/fi';
import '../Styles/Logs.css';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:8866/admin/logs');
      setLogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesDate = filterDate ? log.log_timestamp.startsWith(filterDate) : true;
    const matchesType = filterType === 'ALL' ? true : log.log_action === filterType;
    const matchesUser = searchTerm ? (log.a_username || '').toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchesDate && matchesType && matchesUser;
  });

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return '#10b981'; // Green
    if (action.includes('UPDATE')) return '#3b82f6'; // Blue
    if (action.includes('DELETE')) return '#ef4444'; // Red
    if (action.includes('LOGIN')) return '#8b5cf6'; // Purple
    return '#64748b'; // Gray
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="logs-container">
      <div className="logs-header">
        <div className="header-title">
          <FiActivity className="header-icon" />
          <div>
            <h1>Journal d'Activités</h1>
            <p>Suivi des actions effectuées par les administrateurs</p>
          </div>
        </div>
      </div>

      <div className="logs-filters">
        <div className="filter-group">
          <FiCalendar className="filter-icon" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            placeholder="Filtrer par date"
          />
        </div>

        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="ALL">Tous les types</option>
            <option value="CREATE_LINE">Ajout de Ligne</option>
            <option value="UPDATE_LINE">Modification de Ligne</option>
            <option value="DELETE_LINE">Suppression de Ligne</option>
            <option value="ADMIN_LOGIN">Connexions</option>
            <option value="ADMIN_LOGOUT">Déconnexions</option>
          </select>
        </div>

        <div className="filter-group search">
          <FiSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Rechercher par utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="logs-card">
        {loading ? (
          <div className="logs-loading">Chargement du journal...</div>
        ) : (
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.log_id}>
                      <td className="timestamp">{formatTimestamp(log.log_timestamp)}</td>
                      <td className="username">
                        <div className="user-badge">
                          <FiUser />
                          {log.a_username || 'Système'}
                        </div>
                      </td>
                      <td>
                        <span
                          className="action-badge"
                          style={{ backgroundColor: `${getActionColor(log.log_action)}15`, color: getActionColor(log.log_action) }}
                        >
                          {log.log_action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="details">{log.log_details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-logs">Aucune activité trouvée pour ces filtres.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
