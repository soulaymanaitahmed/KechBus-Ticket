import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { FaBusAlt } from "react-icons/fa";
import "../Styles/AuthPages.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: "Faible" };
    if (score <= 3) return { level: 2, label: "Moyen" };
    return { level: 3, label: "Robuste" };
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!token) {
      setError("Le jeton de réinitialisation est manquant ou invalide.");
      return;
    }

    if (!password) {
      setError("Le mot de passe est requis.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8866/reset-password", {
        token,
        password,
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
            <h1 className="auth-card-title">Nouveau mot de passe</h1>
            <p className="auth-card-subtitle">
              Saisissez et confirmez votre nouveau mot de passe robuste ci-dessous.
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
                <FiArrowLeft size={18} /> Se connecter maintenant
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} autoComplete="on" method="post">
              {/* New Password */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="new-password">
                  Nouveau mot de passe
                </label>
                <div className={`auth-input-wrap ${error ? "auth-input-error" : ""}`}>
                  <span className="auth-input-icon">
                    <FiLock />
                  </span>
                  <input
                    id="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Saisissez votre nouveau mot de passe"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                  />
                  <button
                    className="auth-eye-btn"
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {/* Password strength meter */}
                {password && (
                  <>
                    <div className="auth-password-strength">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`auth-strength-bar${
                            passwordStrength.level >= i ? " active" : ""
                          }${
                            passwordStrength.level >= i && passwordStrength.level === 2
                              ? " medium"
                              : ""
                          }${
                            passwordStrength.level >= i && passwordStrength.level === 3
                              ? " strong"
                              : ""
                          }`}
                        />
                      ))}
                    </div>
                    <p className="auth-strength-label">
                      {passwordStrength.label}
                    </p>
                  </>
                )}
              </div>

              {/* Confirm Password */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="confirm-password">
                  Confirmer le mot de passe
                </label>
                <div className={`auth-input-wrap ${error ? "auth-input-error" : ""}`}>
                  <span className="auth-input-icon">
                    <FiLock />
                  </span>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirmez votre nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
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
                    <FiCheckCircle size={16} />
                    Enregistrer le mot de passe
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
