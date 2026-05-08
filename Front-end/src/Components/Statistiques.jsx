import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiTrendingUp, FiAlertTriangle, FiPlus, FiMinus, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { FaFire, FaBus } from 'react-icons/fa';
import '../Styles/Stats.css';

export default function Statistiques() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adjustingId, setAdjustingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  console.log("Statistiques component rendering. Loading:", loading, "Stats:", !!stats, "Error:", error);


  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await axios.get('http://localhost:8866/admin/stats');
      const raw = res.data;

      // Normalize data defensively
      const normalized = {
        totalTickets: Number(raw?.totalTickets) || 0,
        activeBuses: Number(raw?.activeBuses) || 0,
        lines: Array.isArray(raw?.lines)
          ? raw.lines.filter(Boolean).map((l) => ({
              l_id: l.l_id,
              l_destination1: l.l_destination1 || '—',
              l_destination2: l.l_destination2 || '—',
              l_bues_nbr: Number(l.l_bues_nbr) || 0,
              total_passengers: Number(l.total_passengers) || 0,
              intensity: parseFloat(l.intensity) || 0,
            }))
          : [],
      };

      setStats(normalized);
    } catch (err) {
      console.error('Stats fetch error:', err);
      setError('Impossible de charger les données. Vérifiez la connexion au serveur.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const adjustBuses = async (lineId, action) => {
    setAdjustingId(lineId);
    try {
      await axios.patch(`http://localhost:8866/admin/lignes/${lineId}/buses`, { action });
      // Optimistic update
      setStats((prev) => ({
        ...prev,
        activeBuses: action === 'increase' ? prev.activeBuses + 1 : Math.max(0, prev.activeBuses - 1),
        lines: prev.lines.map((l) => {
          if (l.l_id !== lineId) return l;
          const newBusCount = action === 'increase' ? l.l_bues_nbr + 1 : Math.max(0, l.l_bues_nbr - 1);
          const newIntensity = newBusCount === 0 ? l.total_passengers : l.total_passengers / newBusCount;
          return { ...l, l_bues_nbr: newBusCount, intensity: newIntensity };
        }),
      }));
    } catch {
      alert("Erreur lors de l'ajustement des bus.");
    } finally {
      setAdjustingId(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="stats-page">
        <div className="stats-loading">
          <div className="stats-spinner" />
          <p>Chargement des analyses en cours…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="stats-page">
        <div className="stats-error-state">
          <FiAlertTriangle size={40} />
          <p>{error}</p>
          <button className="stats-retry-btn" onClick={() => fetchStats()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ── No data guard ────────────────────────────────────────────────────────
  if (!stats) {
    console.log("Statistiques: Stats is null, returning generic error if loading is false.");
    if (!loading && !error) {
       return <div className="stats-page"><div className="stats-error-state"><p>Aucune donnée reçue du serveur.</p></div></div>;
    }
    return null;
  }


  const hotlines = stats.lines.filter((l) => l.intensity > 25);
  const maxIntensity = Math.max(...stats.lines.map((l) => l.intensity), 1);

  const getIntensityColor = (intensity) => {
    if (intensity > 50) return '#ef4444';
    if (intensity > 25) return '#f97316';
    return '#10b981';
  };

  const getIntensityLabel = (intensity) => {
    if (intensity > 50) return 'Critique';
    if (intensity > 25) return 'Surcharge';
    return 'Normal';
  };

  const getIntensityClass = (intensity) => {
    if (intensity > 50) return 'critical';
    if (intensity > 25) return 'overload';
    return 'normal';
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="stats-page">
      {/* ── Header ── */}
      <header className="stats-header">
        <div className="stats-header-left">
          <p className="stats-eyebrow">Tableau de Bord</p>
          <h1 className="stats-title">Statistiques</h1>
          <p className="stats-subtitle">Analyse du trafic &amp; gestion de la flotte en temps réel</p>
        </div>
        <div className="stats-header-right">
          <button
            className={`stats-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            title="Actualiser"
          >
            <FiRefreshCw />
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
          {hotlines.length > 0 && (
            <span className="stats-alert-badge">
              <FaFire /> {hotlines.length} Alerte{hotlines.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* ── KPI Cards ── */}
      <section className="stats-kpi-grid" aria-label="Indicateurs clés">
        <article className="stats-kpi-card kpi-blue">
          <div className="kpi-icon-wrap">
            <FiTrendingUp />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Tickets Vendus</span>
            <strong className="kpi-value">{stats.totalTickets.toLocaleString('fr-FR')}</strong>
            <span className="kpi-hint">Total cumulé</span>
          </div>
        </article>

        <article className="stats-kpi-card kpi-green">
          <div className="kpi-icon-wrap">
            <FaBus />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Bus en Service</span>
            <strong className="kpi-value">{stats.activeBuses}</strong>
            <span className="kpi-hint">Flotte totale active</span>
          </div>
        </article>

        <article className="stats-kpi-card kpi-orange">
          <div className="kpi-icon-wrap">
            <FiActivity />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Lignes Analysées</span>
            <strong className="kpi-value">{stats.lines.length}</strong>
            <span className="kpi-hint">En surveillance</span>
          </div>
        </article>

        <article className={`stats-kpi-card ${hotlines.length > 0 ? 'kpi-red' : 'kpi-slate'}`}>
          <div className="kpi-icon-wrap">
            <FiAlertTriangle />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Lignes en Surcharge</span>
            <strong className="kpi-value">{hotlines.length}</strong>
            <span className="kpi-hint">&gt;25 passagers / bus</span>
          </div>
        </article>
      </section>

      {/* ── Lines Panel ── */}
      <section className="stats-panel">
        <div className="stats-panel-head">
          <h2 className="stats-panel-title">
            <FaFire className="fire-icon" />
            Analyse des Lignes &amp; Détection Hotlines
          </h2>
          <span className="stats-panel-meta">{stats.lines.length} ligne{stats.lines.length !== 1 ? 's' : ''}</span>
        </div>

        {stats.lines.length === 0 ? (
          <div className="stats-empty">Aucune ligne disponible dans la base de données.</div>
        ) : (
          <div className="stats-lines-list">
            {stats.lines.map((line) => {
              const intensityPct = Math.min((line.intensity / maxIntensity) * 100, 100);
              const color = getIntensityColor(line.intensity);
              const label = getIntensityLabel(line.intensity);
              const cls = getIntensityClass(line.intensity);
              const isAdjusting = adjustingId === line.l_id;

              return (
                <div key={line.l_id} className={`line-row line-row--${cls}`}>
                  {/* Status indicator */}
                  <div className="line-status-dot" style={{ background: color }} />

                  {/* Route info */}
                  <div className="line-info">
                    <span className="line-route">
                      #{line.l_id} -
                      {line.l_destination1} <span className="route-arrow">↔</span> {line.l_destination2}
                    </span>
                    <div className="line-metrics">
                      <span className="metric"><strong>{line.total_passengers}</strong> passagers</span>
                      <span className="metric-dot">·</span>
                      <span className="metric"><strong>{line.l_bues_nbr}</strong> bus</span>
                      <span className="metric-dot">·</span>
                      <span className="metric intensity-val" style={{ color }}>
                        Intensité {line.intensity.toFixed(1)}
                      </span>
                    </div>

                    {/* Intensity progress bar */}
                    <div className="intensity-track">
                      <div
                        className="intensity-fill"
                        style={{ width: `${intensityPct}%`, background: color }}
                      />
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`line-badge line-badge--${cls}`}>{label}</span>

                  {/* Bus controls */}
                  <div className="bus-controls">
                    <button
                      className="ctrl-btn ctrl-btn--minus"
                      onClick={() => adjustBuses(line.l_id, 'decrease')}
                      disabled={isAdjusting || line.l_bues_nbr <= 0}
                      title="Retirer un bus"
                    >
                      <FiMinus />
                    </button>
                    <span className="ctrl-count">{line.l_bues_nbr}</span>
                    <button
                      className="ctrl-btn ctrl-btn--plus"
                      onClick={() => adjustBuses(line.l_id, 'increase')}
                      disabled={isAdjusting}
                      title="Ajouter un bus"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
