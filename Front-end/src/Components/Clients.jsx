import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FaSearch, FaUserEdit, FaHistory, FaUsers, FaEnvelope, FaIdBadge, FaTicketAlt, FaCrown, FaTimes, FaFilter, FaCalendarAlt }
 from "react-icons/fa";
import "../Styles/Clients.css";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState({ tickets: [], subscriptions: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [ticketMonthFilter, setTicketMonthFilter] = useState("");

  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    type: 1
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get("http://localhost:8866/admin/clients");
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredClients = clients.filter((client) => {
    const searchStr = searchTerm.toLowerCase();
    return (
      client.c_username.toLowerCase().includes(searchStr) ||
      client.c_email.toLowerCase().includes(searchStr) ||
      client.c_id.toString().includes(searchStr)
    );
  });

  const openEditModal = (client) => {
    setSelectedClient(client);
    setEditFormData({
      username: client.c_username,
      email: client.c_email,
      type: client.c_type
    });
    setIsEditModalOpen(true);
  };

  const openHistoryModal = async (client) => {
    setSelectedClient(client);
    setLoadingHistory(true);
    setIsHistoryModalOpen(true);
    try {
      const response = await axios.get(`http://localhost:8866/admin/clients/${client.c_id}/history`);
      setClientHistory(response.data);
    } catch (error) {
      console.error("Error fetching client history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8866/admin/clients/${selectedClient.c_id}`, {
        username: editFormData.username,
        email: editFormData.email,
        type: editFormData.type
      });
      fetchClients();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  return (
    <div className="clients-page">
      {/* ── Header ── */}
      <header className="clients-header">
        <div>
          <p className="clients-eyebrow">Administration</p>
          <h1 className="clients-title">Gestion des Clients</h1>
          <p className="clients-subtitle">Consultez, modifiez et analysez l'activité des utilisateurs</p>
        </div>
        <span className="clients-badge">
          <FaUsers style={{ marginRight: 4 }} />
          {clients.length} client{clients.length !== 1 ? 's' : ''}
        </span>
      </header>

      {/* ── Search ── */}
      <div className="clients-search-bar">
        <FaSearch className="search-icon-cl" />
        <input
          type="text"
          placeholder="Rechercher par nom, email ou ID..."
          value={searchTerm}
          onChange={handleSearch}
          className="clients-search-input"
        />
      </div>

      {/* ── Table Panel ── */}
      <section className="clients-panel">
        <div className="clients-panel-head">
          <h2 className="clients-panel-title">
            <FaUsers /> Liste des Clients
          </h2>
          <span className="clients-panel-meta">
            {filteredClients.length} résultat{filteredClients.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="clients-table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.c_id}>
                  <td><span className="cl-id-badge">#{client.c_id}</span></td>
                  <td>
                    <div className="cl-user-cell">
                      <div className="cl-avatar">{client.c_username.charAt(0).toUpperCase()}</div>
                      <span className="cl-username">{client.c_username}</span>
                    </div>
                  </td>
                  <td className="cl-email">{client.c_email}</td>
                  <td>
                    <span className={`cl-type-badge ${client.c_type === 2 ? 'premium' : 'standard'}`}>
                      {client.c_type === 2 ? 'Premium' : 'Standard'}
                    </span>
                  </td>
                  <td>
                    <div className="cl-actions">
                      <button className="cl-action-btn" title="Modifier" onClick={() => openEditModal(client)}>
                        <FaUserEdit />
                      </button>
                      <button className="cl-action-btn history-btn" title="Historique" onClick={() => openHistoryModal(client)}>
                        <FaHistory />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="clients-empty">Aucun client ne correspond à votre recherche.</div>
          )}
        </div>
      </section>

      {/* ── Edit Modal ── */}
      {isEditModalOpen && (
        <div className="cl-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="cl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-head">
              <h2><FaUserEdit /> Modifier le client</h2>
              <button className="cl-modal-close" onClick={() => setIsEditModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="cl-form">
              <div className="cl-form-group">
                <label><FaIdBadge /> Nom d'utilisateur</label>
                <input
                  type="text"
                  required
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                />
              </div>
              <div className="cl-form-group">
                <label><FaEnvelope /> Email</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                />
              </div>
              <div className="cl-form-group">
                <label><FaCrown /> Type de compte</label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({...editFormData, type: parseInt(e.target.value)})}
                >
                  <option value={1}>Standard</option>
                  <option value={2}>Premium</option>
                </select>
              </div>
              <div className="cl-modal-actions">
                <button type="button" className="cl-btn-cancel" onClick={() => setIsEditModalOpen(false)}>Annuler</button>
                <button type="submit" className="cl-btn-save">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── History Modal ── */}
      {isHistoryModalOpen && (
        <div className="cl-modal-overlay" onClick={() => { setIsHistoryModalOpen(false); setTicketMonthFilter(""); }}>
          <div className="cl-modal cl-modal--history" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-head">
              <h2><FaHistory /> Historique — {selectedClient?.c_username}</h2>
              <button className="cl-modal-close" onClick={() => { setIsHistoryModalOpen(false); setTicketMonthFilter(""); }}><FaTimes /></button>
            </div>

            {loadingHistory ? (
              <div className="cl-loader-wrap"><div className="cl-spinner" /></div>
            ) : (
              <div className="cl-history-content">
                {/* ── Tickets Section ── */}
                <div className="cl-history-section cl-history-tickets">
                  <div className="cl-history-section-head">
                    <h3><FaTicketAlt /> Tickets ({clientHistory.tickets.length})</h3>
                    <div className="cl-month-filter">
                      <FaCalendarAlt />
                      <select
                        value={ticketMonthFilter}
                        onChange={(e) => setTicketMonthFilter(e.target.value)}
                      >
                        <option value="">Tous les mois</option>
                        {(() => {
                          const months = new Set();
                          clientHistory.tickets.forEach(t => {
                            const d = new Date(t.t_purchase_date);
                            months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                          });
                          return [...months].sort().reverse().map(m => {
                            const [y, mo] = m.split('-');
                            const label = new Date(y, mo - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                            return <option key={m} value={m}>{label}</option>;
                          });
                        })()}
                      </select>
                    </div>
                  </div>
                  <div className="cl-history-list">
                    {(() => {
                      const filtered = ticketMonthFilter
                        ? clientHistory.tickets.filter(t => {
                            const d = new Date(t.t_purchase_date);
                            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === ticketMonthFilter;
                          })
                        : clientHistory.tickets;
                      return filtered.length > 0 ? (
                        filtered.map(t => (
                          <div key={t.t_id} className="cl-ticket-card">
                            <div className="cl-ticket-left">
                              <span className="cl-ticket-id">T-{String(t.t_id).padStart(5, '0')}</span>
                            </div>
                            <div className="cl-ticket-body">
                              <span className="cl-ticket-route">Ligne #{t.l_id} — {t.l_destination1} ↔ {t.l_destination2}</span>
                              <span className="cl-ticket-date">{new Date(t.t_purchase_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="cl-ticket-right">
                              <span className="cl-ticket-qty">{t.t_nbr}x</span>
                              <span className={`cl-item-status ${t.t_status}`}>{t.t_status}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="cl-empty-msg">Aucun ticket pour cette période.</p>
                      );
                    })()}
                  </div>
                </div>

                {/* ── Subscriptions Section ── */}
                <div className="cl-history-section cl-history-subs">
                  <div className="cl-history-section-head">
                    <h3><FaCrown /> Abonnements ({clientHistory.subscriptions.length})</h3>
                  </div>
                  <div className="cl-history-list">
                    {clientHistory.subscriptions.length > 0 ? (
                      clientHistory.subscriptions.map(s => (
                        <div key={s.s_id} className="cl-sub-card">
                          <div className="cl-sub-header">
                            <span className="cl-sub-plan">{s.s_plan}</span>
                            <span className={`cl-item-status ${s.s_status}`}>{s.s_status}</span>
                          </div>
                          <div className="cl-sub-body">
                            <div className="cl-sub-dates">
                              <FaCalendarAlt />
                              <span>{new Date(s.s_start_date).toLocaleDateString('fr-FR')} → {new Date(s.s_end_date).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <span className="cl-sub-price">{s.s_price} MAD</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="cl-empty-msg">Aucun abonnement.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
