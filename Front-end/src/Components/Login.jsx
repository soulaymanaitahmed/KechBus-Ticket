import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import "../Styles/Logins.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Welcome back to KechBus</h1>
        <p className="login-subtitle">Sign in to your account</p>

        <label className="field-label">Email</label>
        <div className="input-wrapper">
          <FiMail className="input-icon" />
          <input type="email" placeholder="Enter your email" />
        </div>

        <label className="field-label">Password</label>
        <div className="input-wrapper">
          <FiLock className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
          />
          <button
            className="eye-btn"
            onClick={() => setShowPassword((p) => !p)}
            type="button"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

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

        <button className="btn-signin" type="button">
          Sign In
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
