import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaRoute, FaBus } from "react-icons/fa";
import { MdOutlineAirlineSeatReclineExtra } from "react-icons/md";
import "../Styles/Lignes.css";

export default function Lignes() {
  const [lines, setLines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [lineToDelete, setLineToDelete] = useState(null);

  const [formData, setFormData] = useState({
    destination1: "",
    destination2: "",
    price: "",
    stations: "",
    busesNbr: "",
  });

  useEffect(() => {
    fetchLines();
  }, []);

  const fetchLines = async () => {
    try {
      const response = await axios.get("http://localhost:8866/lignes");
      const mappedLines = response.data.map(line => ({
        id: line.l_id,
        destination1: line.l_destination1,
        destination2: line.l_destination2,
        price: line.l_price,
        busesNbr: line.l_bues_nbr || 0,
        stations: Array.isArray(line.l_stations) ? line.l_stations : []
      }));
      setLines(mappedLines);
    } catch (error) {
      console.error("Error fetching lignes:", error);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredLines = lines.filter((line) => {
    const searchStr = searchTerm.toLowerCase();
    return (
      line.destination1.toLowerCase().includes(searchStr) ||
      line.destination2.toLowerCase().includes(searchStr) ||
      line.stations.some((st) => st.toLowerCase().includes(searchStr))
    );
  });

  const openModal = (line = null) => {
    if (line) {
      setEditingLine(line);
      setFormData({
        destination1: line.destination1,
        destination2: line.destination2,
        price: line.price,
        stations: line.stations.join(", "),
        busesNbr: line.busesNbr || "",
      });
    } else {
      setEditingLine(null);
      setFormData({ destination1: "", destination2: "", price: "", stations: "", busesNbr: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLine(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stationsArray = formData.stations
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    try {
      if (editingLine) {
        await axios.put(`http://localhost:8866/lignes/${editingLine.id}`, {
          destination1: formData.destination1,
          destination2: formData.destination2,
          price: parseFloat(formData.price),
          stations: stationsArray,
          busesNbr: parseInt(formData.busesNbr) || 0,
        });
      } else {
        await axios.post("http://localhost:8866/lignes", {
          destination1: formData.destination1,
          destination2: formData.destination2,
          price: parseFloat(formData.price),
          stations: stationsArray,
          busesNbr: parseInt(formData.busesNbr) || 0,
        });
      }
      fetchLines(); // Refresh list after saving
      closeModal();
    } catch (error) {
      console.error("Error saving ligne:", error);
    }
  };

  const confirmDelete = async () => {
    if (!lineToDelete) return;
    try {
      await axios.delete(`http://localhost:8866/lignes/${lineToDelete.id}`);
      fetchLines(); // Refresh list after deletion
      setLineToDelete(null);
    } catch (error) {
      console.error("Error deleting ligne:", error);
    }
  };

  return (
    <div className="lignes-container">
      <div className="lignes-header">
        <div className="header-title">
          <h1><FaRoute /> Gestion des Lignes</h1>
          <p>Gérez vos itinéraires de bus, stations et tarifs en temps réel.</p>
        </div>
        <button className="btn-add-primary" onClick={() => openModal()}>
          <FaPlus /> Nouvelle Ligne
        </button>
      </div>

      <div className="lignes-controls">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher une destination, station..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="lignes-grid">
        {filteredLines.map((line) => (
          <div className="ligne-card glass-panel" key={line.id}>
            <div className="card-header">
              <div className="route-info">
                <span className="dest">{line.destination1}</span>
                <div className="route-arrow">
                    <span className="dot"></span>
                    <span className="line"></span>
                    <span className="dot"></span>
                </div>
                <span className="dest">{line.destination2}</span>
              </div>
              <div className="card-badges">
                <span className="bus-badge" title="Nombre de bus"><FaBus /> {line.busesNbr}</span>
                <div className="price-tag">{line.price} MAD</div>
              </div>
            </div>

            <div className="card-body">
              <div className="stations-list">
                <h4><FaMapMarkerAlt /> Stations intermédiaires :</h4>
                <div className="tags">
                  {line.stations.length > 0 ? (
                    line.stations.map((st, idx) => (
                      <span key={idx} className="station-tag">{st}</span>
                    ))
                  ) : (
                    <span className="no-stations">Trajet direct</span>
                  )}
                </div>
              </div>
            </div>

            <div className="card-footer">
              <button className="btn-icon edit" onClick={() => openModal(line)}>
                <FaEdit /> Éditer
              </button>
              <button className="btn-icon delete" onClick={() => setLineToDelete(line)}>
                <FaTrash /> Supprimer
              </button>
            </div>
          </div>
        ))}
        {filteredLines.length === 0 && (
          <div className="no-results">Aucune ligne ne correspond à votre recherche.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLine ? "Modifier la ligne" : "Créer une nouvelle ligne"}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Départ (Destination 1)</label>
                <input
                  type="text"
                  name="destination1"
                  required
                  value={formData.destination1}
                  onChange={handleInputChange}
                  placeholder="Ex: Gueliz"
                />
              </div>
              <div className="form-group">
                <label>Arrivée (Destination 2)</label>
                <input
                  type="text"
                  name="destination2"
                  required
                  value={formData.destination2}
                  onChange={handleInputChange}
                  placeholder="Ex: Jemaa el-Fna"
                />
              </div>
              <div className="form-group">
                <label>Prix (MAD)</label>
                <input
                  type="number"
                  name="price"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Ex: 4.00"
                />
              </div>
              <div className="form-group">
                <label>Nombre de bus</label>
                <input
                  type="number"
                  name="busesNbr"
                  required
                  min="0"
                  value={formData.busesNbr}
                  onChange={handleInputChange}
                  placeholder="Ex: 5"
                />
              </div>
              <div className="form-group">
                <label>Stations intermédiaires (Séparées par des virgules)</label>
                <textarea
                  name="stations"
                  value={formData.stations}
                  onChange={handleInputChange}
                  placeholder="Ex: Bab Doukkala, Koutoubia"
                  rows="3"
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn-save">{editingLine ? "Mettre à jour" : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {lineToDelete && (
        <div className="modal-overlay" onClick={() => setLineToDelete(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header" style={{ justifyContent: 'center', marginBottom: '15px' }}>
              <h2 style={{ color: '#e74c3c' }}>Confirmer la suppression</h2>
            </div>
            <p style={{ marginBottom: '25px', color: '#34495e', fontSize: '15px', lineHeight: '1.5' }}>
              Êtes-vous sûr de vouloir supprimer la ligne <br/>
              <strong>{lineToDelete.destination1} ➔ {lineToDelete.destination2}</strong> ? <br/><br/>
              Cette action est irréversible.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-cancel" onClick={() => setLineToDelete(null)}>Annuler</button>
              <button className="btn-save" style={{ background: '#e74c3c', boxShadow: '0 4px 10px rgba(231, 76, 60, 0.2)' }} onClick={confirmDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
