import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "../Styles/Logins2.css";

export default function SignUpForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    general: "",
  });

  const validate = () => {
    const newErrors = { username: "", email: "", password: "", general: "" };
    let valid = true;

    if (!username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await axios.post("http://localhost:8866/signup", {
        username,
        email,
        password,
      });
      navigate("/login");
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors((prev) => ({ ...prev, email: "This email already exists" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "Something went wrong. Please try again.",
        }));
      }
    }
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <h1 className="signup-title">Create account on KechBus</h1>
        <p className="signup-subtitle">Sign up to get started</p>

        {/* Username */}
        <label className="field-label">Username</label>
        <div className={`input-wrapper ${errors.username ? "error" : ""}`}>
          <FiUser className="input-icon" />
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              clearError("username");
            }}
          />
        </div>
        {errors.username && <p className="field-error">{errors.username}</p>}

        {/* Email */}
        <label className="field-label">Email</label>
        <div className={`input-wrapper ${errors.email ? "error" : ""}`}>
          <FiMail className="input-icon" />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
          />
        </div>
        {errors.email && <p className="field-error">{errors.email}</p>}

        {/* Password */}
        <label className="field-label">Password</label>
        <div className={`input-wrapper ${errors.password ? "error" : ""}`}>
          <FiLock className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
          />
          <button
            className="eye-btn"
            type="button"
            onClick={() => setShowPassword((p) => !p)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        {errors.password && <p className="field-error">{errors.password}</p>}

        {/* General error */}
        {errors.general && <p className="field-error">{errors.general}</p>}

        <button className="btn-signup" type="button" onClick={handleSubmit}>
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
