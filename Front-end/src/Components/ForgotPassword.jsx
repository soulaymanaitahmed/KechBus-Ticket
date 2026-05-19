import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiMail, FiArrowLeft, FiSend } from "react-icons/fi";
import { FaBusAlt } from "react-icons/fa";
import "../Styles/AuthPages.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!email) {
      setError("Veuillez saisir votre e-mail.");
      return;
    }

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8866/forgot-password", {
        email,
      });
      setMessage(response.data.message);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Une erreur est survenue. Veuillez réessayer plus tard.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ─── LEFT BRAND PANEL ─── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-dots">
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <div className="auth-brand-logo-icon">
              <FaBusAlt />
            </div>
            <span className="auth-brand-logo-text">
              Kech<strong>Bus</strong>
            </span>
          </div>
          <h2 className="auth-brand-tagline">
            Votre trajet quotidien,<br />
            <em>simplifié.</em>
          </h2>
          <p className="auth-brand-desc">
            Achetez votre ticket de bus en quelques secondes, évitez la file
            d&apos;attente et embarquez instantanément grâce à votre pass
            numérique sur l&apos;ensemble du réseau de Marrakech.
          </p>
          <div className="auth-brand-illustration">
            <div className="auth-float-bus">
              <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="15" width="100" height="45" rx="8" fill="#405d72" />
                <rect x="10" y="15" width="100" height="12" rx="8" fill="#5a8aad" />
                <rect x="18" y="32" width="18" height="14" rx="3" fill="rgba(255,255,255,0.25)" />
                <rect x="42" y="32" width="18" height="14" rx="3" fill="rgba(255,255,255,0.25)" />
                <rect x="66" y="32" width="18" height="14" rx="3" fill="rgba(255,255,255,0.25)" />
                <rect x="90" y="32" width="14" height="14" rx="3" fill="rgba(255,255,255,0.15)" />
                <circle cx="30" cy="64" r="7" fill="#1e293b" stroke="#405d72" strokeWidth="2" />
                <circle cx="30" cy="64" r="3" fill="#94a3b8" />
                <circle cx="90" cy="64" r="7" fill="#1e293b" stroke="#405d72" strokeWidth="2" />
                <circle cx="90" cy="64" r="3" fill="#94a3b8" />
                <rect x="4" y="26" width="6" height="20" rx="3" fill="#f0a500" opacity="0.8" />
                <rect x="110" y="30" width="8" height="8" rx="2" fill="#ef4444" opacity="0.7" />
              </svg>
            </div>
            <div className="auth-road" />
          </div>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL ─── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Mobile brand */}
          <div className="auth-mobile-brand">
            <div className="auth-mobile-brand-icon">
              <FaBusAlt />
            </div>
            <span className="auth-mobile-brand-text">
              Kech<strong>Bus</strong>
            </span>
          </div>

          <div className="auth-card-header">
            <h1 className="auth-card-title">Mot de passe oublié</h1>
            <p className="auth-card-subtitle">
              Saisissez votre e-mail pour recevoir un lien de réinitialisation de mot de passe.
            </p>
          </div>

          {message ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  background: "rgba(22, 163, 74, 0.08)",
                  border: "1px solid rgba(22, 163, 74, 0.2)",
                  color: "var(--auth-success)",
                  padding: "16px",
                  borderRadius: "var(--auth-radius-sm)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  marginBottom: "24px",
                  fontWeight: "500",
                }}
              >
                {message}
              </div>
              <Link
                to="/login"
                className="auth-submit-btn"
                style={{ textDecoration: "none" }}
              >
                <FiArrowLeft size={18} /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} autoComplete="on" method="post">
              {/* Email */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-email">
                  Adresse e-mail
                </label>
                <div className={`auth-input-wrap ${error ? "auth-input-error" : ""}`}>
                  <span className="auth-input-icon">
                    <FiMail />
                  </span>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                  />
                </div>
              </div>

              {/* Error message */}
              {error && <div className="auth-general-error">{error}</div>}

              {/* Submit */}
              <button className="auth-submit-btn" type="submit">
                {isLoading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <FiSend size={16} />
                    Envoyer le lien
                  </>
                )}
              </button>

              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <Link
                  to="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--auth-primary)",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  <FiArrowLeft size={16} /> Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
