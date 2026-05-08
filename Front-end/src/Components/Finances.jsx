import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoneyBillWave, FaChartLine, FaRegCalendarAlt, FaRoute, FaTicketAlt } from 'react-icons/fa';
import { MdOutlineAssessment } from "react-icons/md";
import { BsArrowUpRight, BsArrowDownRight } from 'react-icons/bs';
import "../Styles/Dashboard.css";

function Finances() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const response = await axios.get('http://localhost:8866/admin/finances');
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      setLoading(false);
    }
  };

  const calculateGrowth = () => {
    if (!data || !data.prevMonthly || data.prevMonthly === 0) return 100;
    const growth = ((data.monthly - data.prevMonthly) / data.prevMonthly) * 100;
    return growth.toFixed(1);
  };

  const growthValue = calculateGrowth();
  const isPositive = growthValue >= 0;

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) return <div className="main-container dashboard-page"><div className="loading-state">Chargement des données financières...</div></div>;

  if (!data) return <div className="main-container dashboard-page"><div className="error-state">Erreur de chargement des finances.</div></div>;

  return (
    <div className="main-container dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Aperçu financier</p>
          <h1 className="dashboard-title">Finances</h1>
          <p className="dashboard-sub">{today}</p>
        </div>
        <span className="dashboard-badge finance-badge">Rapport en direct</span>
      </header>

      <section className="dashboard-stats" aria-label="Indicateurs financiers">
        <article className="dashboard-stat stat-accent--teal">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Revenu Total</span>
            <span className="dashboard-stat-icon"><FaMoneyBillWave /></span>
          </div>
          <p className="dashboard-stat-value">{Number(data?.total || 0).toLocaleString()} MAD</p>
          <p className="dashboard-stat-hint">Global cumulé</p>
        </article>

        <article className="dashboard-stat stat-accent--green">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Ce Mois</span>
            <span className="dashboard-stat-icon"><FaChartLine /></span>
          </div>
          <p className="dashboard-stat-value">{Number(data?.monthly || 0).toLocaleString()} MAD</p>
          <p className="dashboard-stat-hint" style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
            {isPositive ? <BsArrowUpRight /> : <BsArrowDownRight />} 
            {isPositive ? '+' : ''}{growthValue}% vs mois dernier
          </p>
        </article>

        <article className="dashboard-stat stat-accent--blue">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Cette Semaine</span>
            <span className="dashboard-stat-icon"><FaRegCalendarAlt /></span>
          </div>
          <p className="dashboard-stat-value">{Number(data?.weekly || 0).toLocaleString()} MAD</p>
          <p className="dashboard-stat-hint">Derniers 7 jours</p>
        </article>

        <article className="dashboard-stat stat-accent--slate">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Panier Moyen</span>
            <span className="dashboard-stat-icon"><MdOutlineAssessment /></span>
          </div>
          <p className="dashboard-stat-value">
            {data?.total ? (data.total / 150).toFixed(2) : '0.00'} MAD
          </p>
          <p className="dashboard-stat-hint">Par transaction</p>
        </article>
      </section>

      <section className="dashboard-stats" aria-label="Statistiques des tickets">
        <article className="dashboard-stat stat-accent--blue">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Tickets Vendus</span>
            <span className="dashboard-stat-icon"><FaTicketAlt /></span>
          </div>
          <p className="dashboard-stat-value">{Number(data?.totalTicketsSold || 0).toLocaleString('fr-FR')}</p>
          <p className="dashboard-stat-hint">Total cumulé</p>
        </article>

        <article className="dashboard-stat stat-accent--green">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Tickets (30 jours)</span>
            <span className="dashboard-stat-icon"><FaRegCalendarAlt /></span>
          </div>
          <p className="dashboard-stat-value">{Number(data?.monthlyTicketsSold || 0).toLocaleString('fr-FR')}</p>
          <p className="dashboard-stat-hint">Dernier mois</p>
        </article>

        <article className="dashboard-stat stat-accent--teal">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Tickets (7 jours)</span>
            <span className="dashboard-stat-icon"><FaRegCalendarAlt /></span>
          </div>
          <p className="dashboard-stat-value">{Number(data?.weeklyTicketsSold || 0).toLocaleString('fr-FR')}</p>
          <p className="dashboard-stat-hint">Dernière semaine</p>
        </article>

        <article className="dashboard-stat stat-accent--slate">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Revenu Tickets</span>
            <span className="dashboard-stat-icon"><FaMoneyBillWave /></span>
          </div>
          <p className="dashboard-stat-value">{Number(data?.ticketRevenue || 0).toLocaleString('fr-FR')} MAD</p>
          <p className="dashboard-stat-hint">Hors abonnements</p>
        </article>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <h2 className="dashboard-panel-title">
              <FaRoute className="dashboard-panel-title-icon" />
              Lignes les plus rentables
            </h2>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Itinéraire</th>
                  <th>Revenue (MAD)</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topLines || []).map((line, idx) => (
                  <tr key={idx}>
                    <td>{line?.l_destination1 || 'N/A'} ↔ {line?.l_destination2 || 'N/A'}</td>
                    <td className="dashboard-td-time">{Number(line?.revenue || 0).toLocaleString()}</td>
                    <td>
                      <span className={`dash-tag dash-tag--${idx === 0 ? 'boarding' : 'on-time'}`}>
                        {idx === 0 ? 'Top 1' : `Niveau ${idx + 1}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <h2 className="dashboard-panel-title">Répartition des Ventes</h2>
          </div>
          <div className="finance-breakdown">
            {(data?.breakdown || []).map((item, idx) => (
              <div key={idx} className="breakdown-item">
                <div className="breakdown-info">
                  <span className="breakdown-label">{item?.type || 'Inconnu'}</span>
                  <span className="breakdown-amount">{Number(item?.amount || 0).toLocaleString()} MAD</span>
                </div>
                <div className="breakdown-progress-bg">
                  <div 
                    className="breakdown-progress-fill" 
                    style={{ 
                      width: `${data?.total ? (item.amount / data.total * 100).toFixed(1) : 0}%`,
                      backgroundColor: idx === 0 ? '#3b82f6' : '#10b981'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="finance-summary-box">
            <h3>Analyse Quick-View</h3>
            <p>
              La majorité de vos revenus provient des <strong>
                {data?.breakdown && data.breakdown[0]?.amount > data.breakdown[1]?.amount ? 'Tickets' : 'Abonnements'}
              </strong>.
            </p>
            <div className="finance-tip">
              <strong>Conseil:</strong> Pensez à promouvoir les abonnements premium pour stabiliser les revenus mensuels.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Finances;
