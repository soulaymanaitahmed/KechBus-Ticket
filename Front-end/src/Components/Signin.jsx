import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUserPlus,
} from "react-icons/fi";
import { FaBusAlt } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import "../Styles/AuthPages.css";

export default function SignUpForm() {
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialCheck, setInitialCheck] = useState(true);

  useEffect(() => {
    let isMounted = true;
    axios
      .get("http://localhost:8866/client/me", { timeout: 5000 })
      .then((res) => {
        if (Number(res.data.c_type) === 1) navigate("/tickets");
        else navigate("/");
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setInitialCheck(false);
      });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    general: "",
  });

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

  if (initialCheck)
    return (
      <div className="auth-loading-screen">
        <div className="auth-spinner" />
      </div>
    );

  const validate = () => {
    const newErrors = { username: "", email: "", password: "", general: "" };
    let valid = true;

    if (!username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "L'adresse e-mail est requise";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Veuillez saisir une adresse e-mail valide";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit comporter au moins 6 caractères";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;

    setIsLoading(true);
    try {
      await axios.post("http://localhost:8866/signup", {
        username,
        email,
        password,
      });
      window.location.replace("/login");
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors((prev) => ({ ...prev, email: "Cette adresse e-mail existe déjà" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "Une erreur est survenue. Veuillez réessayer.",
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="auth-page">
      {/* ─── LEFT BRAND PANEL ─── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-dots">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
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
            Rejoignez la révolution
            <br />
            <em>du transport intelligent.</em>
          </h2>
          <p className="auth-brand-desc">
            Créez votre compte gratuit et commencez à acheter des tickets de bus
            numériques sur toutes les lignes de Marrakech — pas de file
            d&apos;attente, pas de papier, scannez et voyagez.
          </p>
          <div className="auth-brand-illustration">
            <div className="auth-float-bus">
              <svg
                viewBox="0 0 120 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="10"
                  y="15"
                  width="100"
                  height="45"
                  rx="8"
                  fill="#405d72"
                />
                <rect
                  x="10"
                  y="15"
                  width="100"
                  height="12"
                  rx="8"
                  fill="#5a8aad"
                />
                <rect
                  x="18"
                  y="32"
                  width="18"
                  height="14"
                  rx="3"
                  fill="rgba(255,255,255,0.25)"
                />
                <rect
                  x="42"
                  y="32"
                  width="18"
                  height="14"
                  rx="3"
                  fill="rgba(255,255,255,0.25)"
                />
                <rect
                  x="66"
                  y="32"
                  width="18"
                  height="14"
                  rx="3"
                  fill="rgba(255,255,255,0.25)"
                />
                <rect
                  x="90"
                  y="32"
                  width="14"
                  height="14"
                  rx="3"
                  fill="rgba(255,255,255,0.15)"
                />
                <circle
                  cx="30"
                  cy="64"
                  r="7"
                  fill="#1e293b"
                  stroke="#405d72"
                  strokeWidth="2"
                />
                <circle cx="30" cy="64" r="3" fill="#94a3b8" />
                <circle
                  cx="90"
                  cy="64"
                  r="7"
                  fill="#1e293b"
                  stroke="#405d72"
                  strokeWidth="2"
                />
                <circle cx="90" cy="64" r="3" fill="#94a3b8" />
                <rect
                  x="4"
                  y="26"
                  width="6"
                  height="20"
                  rx="3"
                  fill="#f0a500"
                  opacity="0.8"
                />
                <rect
                  x="110"
                  y="30"
                  width="8"
                  height="8"
                  rx="2"
                  fill="#ef4444"
                  opacity="0.7"
                />
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
            <h1 className="auth-card-title">Créer un compte</h1>
            <p className="auth-card-subtitle">
              Inscrivez-vous pour commencer avec KechBus
            </p>
          </div>

          {/*
            Using a real <form> with proper name/autocomplete attributes
            so Chrome offers to save and autofill credentials on signup too.
          */}
          <form
            className="auth-form"
            onSubmit={handleSubmit}
            autoComplete="on"
            method="post"
          >
            {/* Username */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-username">
                Nom d&apos;utilisateur
              </label>
              <div
                className={`auth-input-wrap ${errors.username ? "auth-input-error" : ""}`}
              >
                <span className="auth-input-icon">
                  <FiUser />
                </span>
                <input
                  id="signup-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Choisissez un nom d'utilisateur"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError("username");
                  }}
                />
              </div>
              {errors.username && (
                <p className="auth-field-error">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-email">
                E-mail
              </label>
              <div
                className={`auth-input-wrap ${errors.email ? "auth-input-error" : ""}`}
              >
                <span className="auth-input-icon">
                  <FiMail />
                </span>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                />
              </div>
              {errors.email && (
                <p className="auth-field-error">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-password">
                Mot de passe
              </label>
              <div
                className={`auth-input-wrap ${errors.password ? "auth-input-error" : ""}`}
              >
                <span className="auth-input-icon">
                  <FiLock />
                </span>
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Créez un mot de passe robuste"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
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
              {errors.password && (
                <p className="auth-field-error">{errors.password}</p>
              )}

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

            {/* General error */}
            {errors.general && (
              <div className="auth-general-error">{errors.general}</div>
            )}

            {/* Submit */}
            <button
              className="auth-submit-btn"
              type="submit"
            >
              {isLoading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <FiUserPlus size={18} />
                  Créer le compte
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <p className="auth-switch-text">
            Vous avez déjà un compte ? <Link to="/login">Connectez-vous</Link>
          </p>

          <div className="auth-divider">ou</div>

          <div className="auth-social-row">
            <button
              className="auth-social-btn"
              type="button"
              onClick={() =>
                setErrors((prev) => ({
                  ...prev,
                  general: "L'inscription avec Google n'est pas encore configurée.",
                }))
              }
            >
              <FcGoogle size={20} /> Continuer avec Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
