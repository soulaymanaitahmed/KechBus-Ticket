import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiLock, FiEye, FiEyeOff, FiShield } from "react-icons/fi";
import { FaBusAlt } from "react-icons/fa";
import "../Styles/Logins.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialCheck, setInitialCheck] = useState(true);

  useEffect(() => {
    // Check if already logged in as admin
    axios.get("http://localhost:8866/admin/me")
      .then(() => {
        navigate("/finances");
      })
      .catch(() => setInitialCheck(false));
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Veuillez saisir votre nom d'utilisateur et votre mot de passe.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await axios.post("http://localhost:8866/admin/login", { username, password });
      navigate("/finances");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Nom d'utilisateur ou mot de passe incorrect.");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer plus tard.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (initialCheck) return (
    <div className="login-wrapper admin-login-bg">
      <div className="btn-loader" style={{ color: 'white' }}>Vérification de la session...</div>
    </div>
  );

  return (
    <div className="login-wrapper admin-login-bg">
      <div className="login-card admin-login-card">
        <div className="login-header">
          <div className="login-brand">
            <FaBusAlt className="brand-icon" />
          </div>
          <h1 className="login-title">Espace Administration</h1>
          <p className="login-subtitle">Connectez-vous pour gérer KechBus</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="field-label">Nom d'utilisateur</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder="Ex: admin_marrakech"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="field-label">Mot de passe</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="eye-btn"
                onClick={() => setShowPassword((p) => !p)}
                type="button"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {error && <div className="login-error-msg">{error}</div>}

          <button 
            className="login-btn-primary" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loader">Connexion en cours...</span>
            ) : (
              "Accéder au Dashboard"
            )}
          </button>
        </form>
        
        <div className="login-footer-note">
          <FiShield className="shield-icon" />
          <span>Accès sécurisé et surveillé · KechBus 2026</span>
        </div>
      </div>
    </div>
  );
}
