import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import { FaBusAlt } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import "../Styles/AuthPages.css";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialCheck, setInitialCheck] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:8866/client/me")
      .then((res) => {
        if (Number(res.data.c_type) === 1) navigate("/tickets");
        else navigate("/");
      })
      .catch(() => setInitialCheck(false));
  }, [navigate]);

  if (initialCheck)
    return (
      <div className="auth-loading-screen">
        <div className="auth-spinner" />
      </div>
    );
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!email || !password) {
      setError("Veuillez saisir votre e-mail et votre mot de passe.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8866/login", {
        email,
        password,
      });
      if (Number(response.data.type) === 1) {
        window.location.replace("/tickets");
      } else {
        window.location.replace("/");
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("E-mail ou mot de passe incorrect.");
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
            <h1 className="auth-card-title">Ravi de vous revoir</h1>
            <p className="auth-card-subtitle">
              Connectez-vous à votre compte pour continuer
            </p>
          </div>

          {/* 
            Using a real <form> with proper name/autocomplete attributes 
            so Chrome offers to save and autofill credentials.
          */}
          <form
            className="auth-form"
            onSubmit={handleLogin}
            autoComplete="on"
            method="post"
          >
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">
                E-mail
              </label>
              <div
                className={`auth-input-wrap ${error ? "auth-input-error" : ""}`}
              >
                <span className="auth-input-icon">
                  <FiMail />
                </span>
                <input
                  id="login-email"
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

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-password">
                Mot de passe
              </label>
              <div
                className={`auth-input-wrap ${error ? "auth-input-error" : ""}`}
              >
                <span className="auth-input-icon">
                  <FiLock />
                </span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Saisissez votre mot de passe"
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
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && <div className="auth-general-error">{error}</div>}

            {/* Remember + Forgot */}
            <div className="auth-options-row">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Se souvenir de moi
              </label>
              <Link to="/forgot-password" className="auth-forgot-btn">
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit – type="submit" is critical for Chrome to prompt saving */}
            <button
              className="auth-submit-btn"
              type="submit"
            >
              {isLoading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <FiLogIn size={18} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign Up */}
          <p className="auth-switch-text">
            Vous n&apos;avez pas de compte ?{" "}
            <Link to="/signup">Créer un compte</Link>
          </p>

          <div className="auth-divider">ou</div>

          <div className="auth-social-row">
            <button className="auth-social-btn" type="button">
              <FcGoogle size={20} /> Continuer avec Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
