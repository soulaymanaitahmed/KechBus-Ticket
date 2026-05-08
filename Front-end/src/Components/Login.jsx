import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import "../Styles/Logins.css";

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
    // Check if already logged in
    axios.get("http://localhost:8866/client/me")
      .then(res => {
        if (Number(res.data.c_type) === 1) navigate("/tickets");
        else navigate("/");
      })
      .catch(() => setInitialCheck(false));
  }, [navigate]);

  if (initialCheck) return <div style={{ background: '#f9f5f0', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8866/login", { email, password });
      if (Number(response.data.type) === 1) {
        navigate("/tickets");
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Welcome back to KechBus</h1>
        <p className="login-subtitle">Log in to your account</p>

        <label className="field-label">Email</label>
        <div className="input-wrapper">
          <FiMail className="input-icon" />
          <input
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <label className="field-label">Password</label>
        <div className="input-wrapper">
          <FiLock className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
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

        {error && <p className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>{error}</p>}

        <div className="login-row">
          <label className="remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          <button className="forgot" type="button">
            Forgot password?
          </button>
        </div>

        <button className="btn-signin" type="button" onClick={handleLogin} disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log In"}
        </button>

        <p className="signup-text">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>

        <div className="divider">Or with</div>

        <div className="social-row">
          <button className="btn-social" type="button">
            <FcGoogle size={18} /> Google
          </button>
        </div>
      </div>
    </div>
  );
}
