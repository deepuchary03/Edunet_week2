import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./common.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for Confirm Password
  const [phone, setPhone] = useState(""); // New state for Phone Number
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, phone }), // Include phone number
      });

      if (response.ok) {
        navigate("/signin");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Sign-up failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="signup-container">
      <h2 className="signup-title">Create Your Account</h2>
      {error && <p className="error-message">{error}</p>}
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number:</label>
          <input
            id="phone"
            type="tel" // Use 'tel' for phone number input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password:</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="form-control"
          />
        </div>

        <button type="submit" className="submit-button">
          Sign Up
        </button>
      </form>
      <div className="navigation">
        <p>
          Already have an account?{" "}
          <button onClick={() => navigate("/signin")} className="nav-button">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
