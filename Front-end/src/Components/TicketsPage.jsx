import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUser, FaTicketAlt, FaCrown, FaSignOutAlt, FaCheckCircle, FaMapMarkerAlt, FaCalendarAlt, FaBus, FaCreditCard, FaLock, FaCcVisa, FaCcMastercard, FaCcApplePay, FaTimes, FaQrcode, FaClock, FaRulerCombined } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { QRCodeSVG } from 'qrcode.react';
import "../Styles/TicketsPage.css";
import RouteMapModal from "./RouteMapModal";
import LiveTrackerModal from "./LiveTrackerModal";

const TicketsPage = () => {
    const [activeTab, setActiveTab] = useState("buy");
    const [buyMode, setBuyMode] = useState("direct"); // direct or search
    const [clientInfo, setClientInfo] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [lignes, setLignes] = useState([]);
    const [selectedLigne, setSelectedLigne] = useState("");

    // Search by Destination states
    const [searchStart, setSearchStart] = useState("");
    const [searchEnd, setSearchEnd] = useState("");
    const [matchingLignes, setMatchingLignes] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketQuantity, setTicketQuantity] = useState(1);
    const isSubscriptionActive = subscription && subscription.s_status === 'active' && new Date(subscription.s_end_date) > new Date();

    const [showPayment, setShowPayment] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, processing, success
    const [pendingAction, setPendingAction] = useState(null); // { type: 'ticket'|'sub', data: {} }

    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
        currentPassword: "",
        password: ""
    });

    // Credit Card Form State
    const [paymentForm, setPaymentForm] = useState({
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
    });

    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;

        // Simple formatting for card number
        if (name === "cardNumber") {
            const digits = value.replace(/\D/g, '').substring(0, 16);
            const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
            setPaymentForm(prev => ({ ...prev, [name]: formatted }));
            return;
        }

        // Simple formatting for expiry
        if (name === "expiry") {
            const clean = value.replace(/\D/g, '').substring(0, 4);
            const formatted = clean.length > 2 ? `${clean.substring(0, 2)}/${clean.substring(2)}` : clean;
            setPaymentForm(prev => ({ ...prev, [name]: formatted }));
            return;
        }

        // Limit CVV to 3 digits
        if (name === "cvv") {
            const digits = value.replace(/\D/g, '').substring(0, 3);
            setPaymentForm(prev => ({ ...prev, [name]: digits }));
            return;
        }

        setPaymentForm(prev => ({ ...prev, [name]: value }));
    };

    const [isEditing, setIsEditing] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showProfileQrModal, setShowProfileQrModal] = useState(false);

    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [isLiveTrackerOpen, setIsLiveTrackerOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);

    const navigate = useNavigate();
    axios.defaults.withCredentials = true;

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const clientRes = await axios.get("http://localhost:8866/client/me");
            setClientInfo(clientRes.data);
            setProfileData({
                username: clientRes.data.c_username,
                email: clientRes.data.c_email,
                password: ""
            });

            const ticketsRes = await axios.get("http://localhost:8866/client/tickets");
            setTickets(ticketsRes.data);

            const subRes = await axios.get("http://localhost:8866/client/subscription");
            setSubscription(subRes.data);

            const lignesRes = await axios.get("http://localhost:8866/lignes");
            setLignes(lignesRes.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
            navigate("/login");
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:8866/logout");
            navigate("/login");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put("http://localhost:8866/client/me", profileData);
            alert("Profile updated successfully!");
            setIsEditing(false);
            setProfileData(prev => ({ ...prev, currentPassword: "", password: "" }));
            fetchInitialData();
        } catch (err) {
            alert(err.response?.data?.error || "Update failed");
        }
    };

    const handleRouteClick = (lineId, origin, destination) => {
        setSelectedRoute({
            num: `L${lineId}`,
            from: origin,
            to: destination
        });
        setIsRouteModalOpen(true);
    };

    const handleTrackLive = (lineId, origin, destination) => {
        setSelectedRoute({
            num: `L${lineId}`,
            from: origin,
            to: destination
        });
        setIsLiveTrackerOpen(true);
    };

    const initiatePayment = (type, data) => {
        if (type === 'ticket') {
            data.totalPrice = (data.price || 0) * ticketQuantity;
            data.t_nbr = ticketQuantity;
        }
        setPendingAction({ type, data });
        setShowPayment(true);
        setPaymentStatus("pending");
    };

    const processPayment = () => {
        setPaymentStatus("processing");
        setTimeout(async () => {
            try {
                if (pendingAction.type === "ticket") {
                    await axios.post("http://localhost:8866/client/buy-ticket", {
                        ligneId: pendingAction.data.id,
                        t_nbr: pendingAction.data.t_nbr
                    });
                } else if (pendingAction.type === "sub") {
                    await axios.post("http://localhost:8866/client/subscribe", pendingAction.data);
                }
                setPaymentStatus("success");
                setPaymentForm({ cardName: '', cardNumber: '', expiry: '', cvv: '' }); // Clear form
                setTimeout(() => {
                    setShowPayment(false);
                    fetchInitialData();
                    setActiveTab(pendingAction.type === "ticket" ? "tickets" : "subscription");
                }, 2000);
            } catch (err) {
                alert("Payment processing failed on server");
                setShowPayment(false);
            }
        }, 2000);
    };

    // Helper: Get all unique stations and destinations
    const getAllPoints = () => {
        const points = new Set();
        lignes.forEach(l => {
            points.add(l.l_destination1);
            points.add(l.l_destination2);
            if (l.l_stations) {
                l.l_stations.forEach(s => points.add(s));
            }
        });
        return Array.from(points).sort();
    };

    // Helper: Get points reachable from the selected start point
    const getViableEndPoints = () => {
        if (!searchStart) return [];
        const points = new Set();
        lignes.forEach(l => {
            const route = [l.l_destination1, ...l.l_stations, l.l_destination2];
            if (route.includes(searchStart)) {
                route.forEach(p => {
                    if (p !== searchStart) points.add(p);
                });
            }
        });
        return Array.from(points).sort();
    };

    // Logic: Find lines that pass through both selected points
    useEffect(() => {
        if (searchStart && searchEnd && searchStart !== searchEnd) {
            const found = lignes.filter(l => {
                const route = [l.l_destination1, ...l.l_stations, l.l_destination2];
                return route.includes(searchStart) && route.includes(searchEnd);
            });
            setMatchingLignes(found);
        } else {
            setMatchingLignes([]);
        }
    }, [searchStart, searchEnd, lignes]);

    const tabs = [
        { id: "buy", label: "Acheter", icon: <FaTicketAlt /> },
        { id: "tickets", label: "Mes Tickets", icon: <FaBus /> },
        { id: "subscription", label: "Abonnement", icon: <FaCrown /> },
        { id: "profile", label: "Profil", icon: <FaUser /> }
    ];

    return (
        <div className="tp-root">
            <div className="tp-container">
                <header className="tp-header">
                    <a href="/" className="tp-logo">
                        Kech<span>Bus</span>
                    </a>

                    <div className="tp-header-actions">
                        <div className="tp-user-profile">
                            <div className="tp-user-avatar">
                                <FaUser />
                            </div>
                            <div className="tp-user-details">
                                <span className="tp-user-name">{clientInfo?.c_username || "Chargement..."}</span>
                                <span className="tp-user-status">Client Vérifié</span>
                            </div>
                            <button className="tp-logout-compact" onClick={handleLogout} title="Logout">
                                <FaSignOutAlt />
                            </button>
                        </div>
                    </div>
                </header>
                <h1 className="h155">Voyagez simplement. Bougez plus intelligemment.</h1>
                <p className="p55">
                    Achetez des tickets, gérez votre abonnement et consultez vos trajets dans un tableau de bord unique.
                </p>
                <section className="tp-hero">
                    <p className="tp-eyebrow">Billetterie numérique</p>
                    <div className="tp-kpis">
                        <div className="tp-kpi">
                            <span>{tickets.length}</span>
                            <small>Tickets</small>
                        </div>
                        <div className="tp-kpi">
                            <span>{isSubscriptionActive ? "Actif" : "Aucun"}</span>
                            <small>Abonnement</small>
                        </div>
                        <div className="tp-kpi">
                            <span>{lignes.length}</span>
                            <small>Lignes disponibles</small>
                        </div>
                    </div>
                </section>

                <nav className="tp-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tp-tab ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <main className="tp-content">
                    {activeTab === "profile" && (
                        <div className="tp-card tp-profile-card">
                            <div className="tp-card-header">
                                <h2><FaUser /> Mon Profil</h2>
                            </div>

                            <div className="tp-profile-qr-card">
                                <h3><FaQrcode /> QR Profil Client</h3>
                                <button
                                    className="tp-profile-qr-wrap tp-profile-qr-clickable"
                                    type="button"
                                    onClick={() => setShowProfileQrModal(true)}
                                    title="Agrandir le QR"
                                >
                                    <QRCodeSVG
                                        value={`CLIENT-${clientInfo?.c_id || "UNKNOWN"}`}
                                        size={170}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </button>
                                <p className="tp-profile-qr-id">
                                    ID Client: <strong>#{clientInfo?.c_id || "N/A"}</strong>
                                </p>
                            </div>

                            <form onSubmit={handleProfileUpdate}>
                                <div className="tp-form-group">
                                    <label>Nom d'utilisateur</label>
                                    <input
                                        type="text"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                        required
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div className="tp-form-group">
                                    <label>Adresse e-mail</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        required
                                        disabled={!isEditing}
                                    />
                                </div>

                                {isEditing && (
                                    <>
                                        <div className="tp-form-divider">Changer le mot de passe</div>
                                        <div className="tp-form-group">
                                            <label><FaLock /> Mot de passe actuel </label>
                                            <div className="tp-password-input-wrapper">
                                                <input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={profileData.currentPassword}
                                                    onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                                                    placeholder="Confirmez l'ancien mot de passe"
                                                    required={profileData.password !== ""}
                                                />
                                                <button
                                                    type="button"
                                                    className="tp-eye-toggle"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                >
                                                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="tp-form-group">
                                            <label><FaLock /> Nouveau mot de passe</label>
                                            <div className="tp-password-input-wrapper">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={profileData.password}
                                                    onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    className="tp-eye-toggle"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                >
                                                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="tp-form-actions">
                                            <button type="submit" className="tp-btn tp-btn-primary">Enregistrer les modifications</button>
                                            <button type="button" className="tp-btn tp-btn-ghost" onClick={() => {
                                                setIsEditing(false);
                                                fetchInitialData();
                                            }}>Annuler</button>
                                        </div>
                                    </>
                                )}
                            </form>

                            {!isEditing && (
                                <div className="tp-form-actions1">
                                    <button className="tp-btn tp-btn-secondary" onClick={() => setIsEditing(true)}>
                                        Modifier le Profil
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "buy" && (
                        <section className="tp-section">
                            <h2 className="tp-title">Acheter votre ticket</h2>
                            <div className="tp-buy-grid">
                                <div className="tp-card">
                                    <h3>Trajet Simple</h3>
                                    <div className="tp-mode-tabs">
                                        <button
                                            className={`tp-mode-btn ${buyMode === "direct" ? "active" : ""}`}
                                            onClick={() => setBuyMode("direct")}
                                        >
                                            Choisir la ligne
                                        </button>
                                        <button
                                            className={`tp-mode-btn ${buyMode === "search" ? "active" : ""}`}
                                            onClick={() => setBuyMode("search")}
                                        >
                                            Rechercher destination
                                        </button>
                                        <button
                                            className={`tp-mode-btn ${buyMode === "all" ? "active" : ""}`}
                                            onClick={() => setBuyMode("all")}
                                        >
                                            Toutes les lignes
                                        </button>
                                    </div>

                                    {buyMode === "direct" ? (
                                        <>
                                            <p>Sélectionnez une ligne pour acheter un ticket unique.</p>
                                            <select
                                                className="tp-select"
                                                value={selectedLigne}
                                                onChange={(e) => setSelectedLigne(e.target.value)}
                                            >
                                                <option value="">Choisir une ligne...</option>
                                                {lignes.map(l => (
                                                    <option key={l.l_id} value={l.l_id}>
                                                        Ligne {l.l_id}: {l.l_destination1} ↔ {l.l_destination2} ({l.l_price} DH)
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="tp-quantity-selector">
                                                <label>Nombre de tickets</label>
                                                <div className="tp-qty-controls">
                                                    <button type="button" onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}>-</button>
                                                    <span>{ticketQuantity}</span>
                                                    <button type="button" onClick={() => setTicketQuantity(ticketQuantity + 1)}>+</button>
                                                </div>
                                            </div>
                                            <div className="tp-form-actions1">
                                                <button
                                                    className="tp-btn tp-btn-primary"
                                                    disabled={!selectedLigne}
                                                    onClick={() => {
                                                        const l = lignes.find(line => line.l_id == selectedLigne);
                                                        initiatePayment('ticket', {
                                                            id: selectedLigne,
                                                            price: l?.l_price,
                                                            from: l?.l_destination1,
                                                            to: l?.l_destination2
                                                        })
                                                    }}
                                                >
                                                    Acheter {ticketQuantity > 1 ? `${ticketQuantity} Tickets` : "Ticket"}
                                                </button>
                                            </div>
                                        </>
                                    ) : buyMode === "search" ? (
                                        <>
                                            <p>Entrez vos points de départ et d'arrivée pour trouver la bonne ligne.</p>
                                            <div className="tp-search-fields">
                                                <div className="tp-form-group">
                                                    <label><FaMapMarkerAlt /> De</label>
                                                    <select
                                                        className="tp-select"
                                                        value={searchStart}
                                                        onChange={(e) => setSearchStart(e.target.value)}
                                                    >
                                                        <option value="">Choisir départ...</option>
                                                        {getAllPoints().map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                                <div className="tp-form-group">
                                                    <label><FaMapMarkerAlt /> À</label>
                                                    <select
                                                        className="tp-select"
                                                        value={searchEnd}
                                                        onChange={(e) => setSearchEnd(e.target.value)}
                                                        disabled={!searchStart}
                                                    >
                                                        <option value="">{searchStart ? "Choisir destination..." : "Choisir départ d'abord..."}</option>
                                                        {getViableEndPoints().map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            {matchingLignes.length > 0 ? (
                                                <div className="tp-matching-results">
                                                    {matchingLignes.map(l => (
                                                        <div key={l.l_id} className="tp-plan-v2">
                                                            <div className="tp-plan-inner">
                                                                <span className="tp-plan-pricing">
                                                                    {l.l_price} <small>DH</small>
                                                                </span>
                                                                <p className="tp-plan-title">Ligne {l.l_id}</p>
                                                                <p
                                                                    className="tp-plan-info"
                                                                    style={{ cursor: 'pointer', color: 'var(--b2)', textDecoration: 'underline' }}
                                                                    onClick={() => handleRouteClick(l.l_id, l.l_destination1, l.l_destination2)}
                                                                >
                                                                    {l.l_destination1} ↔ {l.l_destination2}
                                                                </p>
                                                                <div className="tp-quantity-selector-sm">
                                                                    <label>Quantité</label>
                                                                    <div className="tp-qty-controls">
                                                                        <button type="button" onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}>-</button>
                                                                        <span>{ticketQuantity}</span>
                                                                        <button type="button" onClick={() => setTicketQuantity(ticketQuantity + 1)}>+</button>
                                                                    </div>
                                                                </div>
                                                                <div className="tp-plan-action">
                                                                    <button
                                                                        className="tp-plan-button"
                                                                        onClick={() => initiatePayment('ticket', {
                                                                            id: l.l_id,
                                                                            price: l.l_price,
                                                                            from: l.l_destination1,
                                                                            to: l.l_destination2
                                                                        })}
                                                                    >
                                                                        Acheter {ticketQuantity > 1 ? `${ticketQuantity} Tickets` : "Ticket"}
                                                                    </button>
                                                                    <button 
                                                                        className="tp-btn tp-btn-secondary tp-btn-sm"
                                                                        style={{ marginTop: '8px', width: '100%', minWidth: 'unset' }}
                                                                        onClick={() => handleTrackLive(l.l_id, l.l_destination1, l.l_destination2)}
                                                                    >
                                                                        <FaBus style={{ marginRight: '8px' }} /> Track Live
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <div className="tp-all-lines-view">
                                            <p className="tp-view-desc">Cliquez sur une ligne pour voir son itinéraire complet.</p>
                                            <div className="tp-all-lines-grid">
                                                {lignes.map(l => (
                                                    <div key={l.l_id} className="tp-line-card-mini" onClick={() => handleRouteClick(l.l_id, l.l_destination1, l.l_destination2)}>
                                                        <div className="tp-line-card-header">
                                                            <span className="tp-line-number">L{l.l_id}</span>
                                                            <span className="tp-line-price-mini">{l.l_price} DH</span>
                                                        </div>
                                                        <div className="tp-line-route-mini">
                                                            <span>{l.l_destination1}</span>
                                                            <FaBus className="tp-route-icon" />
                                                            <span>{l.l_destination2}</span>
                                                        </div>
                                                        <div className="tp-line-card-footer">
                                                            <span onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTrackLive(l.l_id, l.l_destination1, l.l_destination2);
                                                            }} style={{ cursor: 'pointer', color: 'var(--tp-success)' }}>
                                                                <FaBus /> Suivre en direct
                                                            </span>
                                                            <FaMapMarkerAlt />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="tp-card">
                                    <h3>Abonnements Mensuels</h3>
                                    <p>Voyageur fréquent ? Économisez davantage avec nos forfaits mensuels.</p>
                                    <div className="tp-plans-grid">
                                        <div className="tp-plan-v2 popular-v2">
                                            <div className="tp-plan-badge-v2">Meilleur Choix</div>
                                            <div className="tp-plan-inner">
                                                <span className="tp-plan-pricing">
                                                    100 <small>DH/mois</small>
                                                </span>
                                                <p className="tp-plan-title">Étudiant / Travailleur</p>
                                                <p className="tp-plan-info">Idéal pour les navetteurs quotidiens ayant besoin d'un transport fiable chaque jour.</p>
                                                <ul className="tp-plan-features-list">
                                                    <li>
                                                        <span className="tp-icon-wrapper">
                                                            <svg height={24} width={24} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0h24v24H0z" fill="none" />
                                                                <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" />
                                                            </svg>
                                                        </span>
                                                        <span><strong>2 Tickets</strong> par jour</span>
                                                    </li>
                                                    <li>
                                                        <span className="tp-icon-wrapper">
                                                            <svg height={24} width={24} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0h24v24H0z" fill="none" />
                                                                <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" />
                                                            </svg>
                                                        </span>
                                                        <span>Toutes lignes incluses</span>
                                                    </li>
                                                    <li>
                                                        <span className="tp-icon-wrapper">
                                                            <svg height={24} width={24} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0h24v24H0z" fill="none" />
                                                                <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" />
                                                            </svg>
                                                        </span>
                                                        <span>Valable 30 jours</span>
                                                    </li>
                                                </ul>
                                                <div className="tp-plan-action">
                                                    <button
                                                        className="tp-plan-button"
                                                        disabled={isSubscriptionActive}
                                                        onClick={() => initiatePayment('sub', { plan: '2_per_day', price: 100, name: 'Plan Étudiant / Travailleur' })}
                                                    >
                                                        {isSubscriptionActive ? "Déjà abonné" : "S'abonner"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="tp-plan-v2">
                                            <div className="tp-plan-inner">
                                                <span className="tp-plan-pricing">
                                                    175 <small>DH/mois</small>
                                                </span>
                                                <p className="tp-plan-title">Premium</p>
                                                <p className="tp-plan-info">Pour les grands voyageurs souhaitant un maximum de flexibilité.</p>
                                                <ul className="tp-plan-features-list">
                                                    <li>
                                                        <span className="tp-icon-wrapper">
                                                            <svg height={24} width={24} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0h24v24H0z" fill="none" />
                                                                <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" />
                                                            </svg>
                                                        </span>
                                                        <span><strong>4 Tickets</strong> par jour</span>
                                                    </li>
                                                    <li>
                                                        <span className="tp-icon-wrapper">
                                                            <svg height={24} width={24} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0h24v24H0z" fill="none" />
                                                                <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" />
                                                            </svg>
                                                        </span>
                                                        <span>Toutes lignes incluses</span>
                                                    </li>
                                                    <li>
                                                        <span className="tp-icon-wrapper">
                                                            <svg height={24} width={24} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0h24v24H0z" fill="none" />
                                                                <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" />
                                                            </svg>
                                                        </span>
                                                        <span>Valable 30 jours</span>
                                                    </li>
                                                </ul>
                                                <div className="tp-plan-action">
                                                    <button
                                                        className="tp-plan-button"
                                                        disabled={isSubscriptionActive}
                                                        onClick={() => initiatePayment('sub', { plan: '4_per_day', price: 175, name: 'Plan Premium' })}
                                                    >
                                                        {isSubscriptionActive ? "Déjà abonné" : "S'abonner"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === "tickets" && (
                        <section className="tp-section">
                            <h2 className="tp-title">Mes Tickets Achetés</h2>
                            {tickets.length === 0 ? (
                                <div className="tp-empty-state tp-card">
                                    <FaTicketAlt size={48} color="#ccc" />
                                    <p>Vous n'avez pas encore acheté de tickets.</p>
                                </div>
                            ) : (
                                <div className="tp-tickets-grid">
                                    {tickets.map(t => (
                                        <div key={t.t_id} className="tp-plan-v2 tp-clickable-ticket" onClick={() => setSelectedTicket(t)}>
                                            <div className="tp-plan-inner">
                                                <span className={`tp-plan-pricing status-${t.t_status}`}>
                                                    {t.t_status.toUpperCase()}
                                                </span>
                                                <p className="tp-plan-title">Ticket #{t.t_id.toString().padStart(6, '0')}</p>
                                                <p
                                                    className="tp-plan-info"
                                                    style={{ cursor: 'pointer', color: 'var(--b2)', textDecoration: 'underline' }}
                                                    onClick={() => handleRouteClick(t.l_id, t.l_destination1, t.l_destination2)}
                                                >
                                                    {t.l_destination1} ↔ {t.l_destination2}
                                                </p>
                                                <button 
                                                    className="tp-btn tp-btn-secondary tp-btn-sm"
                                                    style={{ marginTop: '12px', width: '100%', minWidth: 'unset' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTrackLive(t.l_id, t.l_destination1, t.l_destination2);
                                                    }}
                                                >
                                                    <FaBus style={{ marginRight: '8px' }} /> Suivre mon bus
                                                </button>
                                                <ul className="tp-plan-features-list">
                                                    <li>
                                                        <span className="tp-icon-wrapper">
                                                            <FaCalendarAlt />
                                                        </span>
                                                        <span>Date : {new Date(t.t_purchase_date).toLocaleDateString()}</span>
                                                    </li>
                                                    <li>
                                                        <span className="tp-icon-wrapper">
                                                            <FaTicketAlt />
                                                        </span>
                                                        <span>{t.t_nbr > 1 ? `${t.t_nbr} Tickets` : "Ticket Simple"}</span>
                                                    </li>
                                                    <li>
                                                        <span className="tp-icon-wrapper">
                                                            <FaBus />
                                                        </span>
                                                        <span>Ligne : {t.l_id}</span>
                                                    </li>
                                                </ul>
                                                <div className="tp-ticket-tap-hint">
                                                    <FaQrcode /> Appuyez pour voir le QR
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === "subscription" && (
                        <section className="tp-section">
                            <h2 className="tp-title">Mon Abonnement</h2>
                            {subscription ? (
                                <div className="tp-plan-v2 popular-v2 tp-single-plan">
                                    <div className="tp-plan-badge-v2">Abonnement Actif</div>
                                    <div className="tp-plan-inner">
                                        <span className="tp-plan-pricing">
                                            {subscription.s_price} <small>DH</small>
                                        </span>
                                        <p className="tp-plan-title">{subscription.s_plan.replace('_', ' ').toUpperCase()}</p>
                                        <p className="tp-plan-info">Vous avez un abonnement actif avec les détails suivants :</p>
                                        <ul className="tp-plan-features-list">
                                            <li>
                                                <span className="tp-icon-wrapper">
                                                    <FaCheckCircle />
                                                </span>
                                                <span>Statut : <strong>{subscription.s_status}</strong></span>
                                            </li>
                                            <li>
                                                <span className="tp-icon-wrapper">
                                                    <FaCalendarAlt />
                                                </span>
                                                <span>Début : {new Date(subscription.s_start_date).toLocaleDateString()}</span>
                                            </li>
                                            <li>
                                                <span className="tp-icon-wrapper">
                                                    <FaCalendarAlt />
                                                </span>
                                                <span>Fin : {new Date(subscription.s_end_date).toLocaleDateString()}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="tp-empty-state tp-card">
                                    <FaCrown size={48} color="#ccc" />
                                    <p>Vous n'avez pas d'abonnement actif.</p>
                                    <button className="tp-btn tp-btn-secondary tp-btn-auto" onClick={() => setActiveTab("buy")}>Voir les forfaits</button>
                                </div>
                            )}
                        </section>
                    )}
                </main>
            </div>

            {/* Payment Modal */}
            {showPayment && (
                <div className="tp-modal-overlay">
                    <div className="tp-pay-modal">
                        {paymentStatus === "pending" && (
                            <form className="tp-pay-form" onSubmit={(e) => { e.preventDefault(); processPayment(); }}>
                                <div className="tp-pay-total-display">
                                    <div className="tp-pay-invoice-header">
                                        <span className="tp-pay-total-label">Résumé du paiement</span>
                                    </div>
                                    <div className="tp-pay-invoice-details">
                                        {pendingAction.type === 'ticket' ? (
                                            <>
                                                <div className="tp-pay-invoice-item">
                                                    <span>ID Ligne :</span>
                                                    <span>Ligne #{pendingAction.data.id}</span>
                                                </div>
                                                <div className="tp-pay-invoice-item">
                                                    <span>Trajet :</span>
                                                    <span>{(pendingAction.data.from && pendingAction.data.from !== "Unknown") ? `${pendingAction.data.from} ↔ ${pendingAction.data.to}` : "Trajet Standard"}</span>
                                                </div>
                                                <div className="tp-pay-invoice-item">
                                                    <span>Prix unitaire :</span>
                                                    <span>{pendingAction.data.price} DH</span>
                                                </div>
                                                <div className="tp-pay-invoice-item">
                                                    <span>Quantité :</span>
                                                    <span>x{pendingAction.data.t_nbr || 1} Tickets</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="tp-pay-invoice-item">
                                                <span>Forfait choisi :</span>
                                                <span>{pendingAction.data.name || "Pass Mensuel"}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="tp-pay-invoice-total">
                                        <span className="tp-pay-total-label">Total à payer</span>
                                        <span className="tp-pay-total-amount">
                                            {pendingAction.data.totalPrice || pendingAction.data.price || "0"} DH
                                        </span>
                                    </div>
                                </div>

                                <div className="tp-pay-separator">
                                    <hr className="tp-pay-line" />
                                    <p>Paiement sécurisé par carte</p>
                                    <hr className="tp-pay-line" />
                                </div>

                                <div className="tp-pay-credit-card-info">
                                    <div className="tp-pay-input-container">
                                        <label className="tp-pay-input-label">Nom complet du titulaire</label>
                                        <input
                                            className="tp-pay-input-field"
                                            type="text"
                                            name="cardName"
                                            value={paymentForm.cardName}
                                            onChange={handlePaymentInputChange}
                                            placeholder="Ex: Ahmed Alami"
                                        />
                                    </div>
                                    <div className="tp-pay-input-container">
                                        <label className="tp-pay-input-label">Numéro de carte</label>
                                        <input
                                            className="tp-pay-input-field"
                                            type="text"
                                            name="cardNumber"
                                            value={paymentForm.cardNumber}
                                            onChange={handlePaymentInputChange}
                                            placeholder="0000 0000 0000 0000"
                                        />
                                    </div>
                                    <div className="tp-pay-input-container">
                                        <label className="tp-pay-input-label">Date d'expiration / CVV</label>
                                        <div className="tp-pay-split">
                                            <input
                                                className="tp-pay-input-field"
                                                type="text"
                                                name="expiry"
                                                value={paymentForm.expiry}
                                                onChange={handlePaymentInputChange}
                                                placeholder="MM/YY"
                                            />
                                            <input
                                                className="tp-pay-input-field"
                                                type="text"
                                                name="cvv"
                                                value={paymentForm.cvv}
                                                onChange={handlePaymentInputChange}
                                                placeholder="CVV"
                                                maxLength="3"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button className="tp-pay-purchase-btn" type="submit">Finaliser le paiement</button>
                                <button type="button" className="tp-btn tp-btn-ghost" style={{ marginTop: "-5px", border: "none" }} onClick={() => setShowPayment(false)}>Annuler</button>
                            </form>
                        )}
                        {paymentStatus === "processing" && (
                            <div className="tp-pay-status-wrapper">
                                <div className="tp-pay-status-icon spinning"><FaBus /></div>
                                <h3>Traitement en cours...</h3>
                                <p>Veuillez patienter pendant la confirmation avec votre banque.</p>
                            </div>
                        )}
                        {paymentStatus === "success" && (
                            <div className="tp-pay-status-wrapper">
                                <div className="tp-pay-status-icon"><FaCheckCircle /></div>
                                <h3>Paiement réussi !</h3>
                                <p>Votre {pendingAction.type === 'ticket' ? 'ticket' : 'abonnement'} a été enregistré avec succès.</p>
                                <button className="tp-btn tp-btn-primary" style={{ marginTop: "10px" }} onClick={() => setShowPayment(false)}>Super !</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="tp-modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="tp-ticket-detail-modal" onClick={e => e.stopPropagation()}>
                        <button className="tp-modal-close" onClick={() => setSelectedTicket(null)}>
                            <FaTimes />
                        </button>

                        <div className="tp-modal-header">
                            <h2>Détails du ticket</h2>
                            <span className={`tp-status-badge tp-status-${selectedTicket.t_status}`}>
                                {selectedTicket.t_status}
                            </span>
                        </div>

                        <div className="tp-qr-section">
                            <div className="tp-qr-container">
                                <QRCodeSVG
                                    value={selectedTicket.t_id.toString()}
                                    size={180}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <p className="tp-ticket-id-display">N° {selectedTicket.t_id.toString().padStart(8, '0')}</p>
                        </div>

                        <div className="tp-ticket-info-grid">
                            <div className="tp-info-item">
                                <label>Trajet</label>
                                <span>{selectedTicket.l_destination1} ↔ {selectedTicket.l_destination2}</span>
                            </div>
                            <div className="tp-info-item">
                                <label>Ligne</label>
                                <span>Ligne {selectedTicket.l_id}</span>
                            </div>
                            <div className="tp-info-item">
                                <label>Date d'achat</label>
                                <span>{new Date(selectedTicket.t_purchase_date).toLocaleString()}</span>
                            </div>
                            <div className="tp-info-item">
                                <label>Quantité</label>
                                <span>{selectedTicket.t_nbr} {selectedTicket.t_nbr > 1 ? "Tickets" : "Ticket"}</span>
                            </div>
                            <div className="tp-info-item">
                                <label>Référence Client</label>
                                <span>{clientInfo?.c_username || "N/A"}</span>
                            </div>
                        </div>

                        <div className="tp-modal-footer">
                            <p><FaBus /> Présentez ce code QR au chauffeur lors de l'embarquement.</p>
                            <button className="tp-btn tp-btn-primary" onClick={() => window.print()}>
                                Imprimer le ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showProfileQrModal && (
                <div className="tp-modal-overlay" onClick={() => setShowProfileQrModal(false)}>
                    <div className="tp-qr-zoom-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="tp-modal-close" onClick={() => setShowProfileQrModal(false)}>
                            <FaTimes />
                        </button>
                        <h3><FaQrcode /> QR Profil Client</h3>
                        <div className="tp-profile-qr-wrap tp-profile-qr-wrap--large">
                            <QRCodeSVG
                                className="tp-profile-qr-large"
                                value={`CLIENT-${clientInfo?.c_id || "UNKNOWN"}`}
                                size={320}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <p className="tp-profile-qr-id">
                            ID Client: <strong>#{clientInfo?.c_id || "N/A"}</strong>
                        </p>
                    </div>
                </div>
            )}

            {/* Route Map Modal */}
            <RouteMapModal 
                isOpen={isRouteModalOpen} 
                onClose={() => setIsRouteModalOpen(false)} 
                route={selectedRoute} 
            />

            {/* Live Tracker Modal */}
            {isLiveTrackerOpen && selectedRoute && (
                <LiveTrackerModal
                    isOpen={isLiveTrackerOpen}
                    onClose={() => setIsLiveTrackerOpen(false)}
                    route={selectedRoute}
                />
            )}
        </div>
    );
};

export default TicketsPage;
