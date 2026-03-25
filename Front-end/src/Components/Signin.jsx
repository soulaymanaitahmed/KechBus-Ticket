import { useState } from "react";
import { Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import "../Styles/Logins2.css";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <h1 className="signup-title">Create account on KechBus</h1>
        <p className="signup-subtitle">Sign up to get started</p>

        <label className="field-label">Username</label>
        <div className="input-wrapper">
          <FiUser className="input-icon" />
          <input type="text" placeholder="Enter your username" />
        </div>

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
            placeholder="Create a password"
          />
          <button
            className="eye-btn"
            onClick={() => setShowPassword((p) => !p)}
            type="button"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <button className="btn-signup" type="button">
          Sign Up
        </button>

        <p className="signin-text">
          Already have an account? <Link to="/login">Log In</Link>
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
