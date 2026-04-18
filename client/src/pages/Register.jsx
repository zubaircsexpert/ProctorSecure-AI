import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState(""); // ✅ ADDED
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // .env se URL le raha hai, agar nahi milega toh default localhost use karega
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const handleRegister = async (e) => {
    e.preventDefault();

    // ✅ UPDATED VALIDATION
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      
      // ✅ name ADD kiya
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
        role
      });

      alert(res.data?.message || "Registered Successfully ✅");
      navigate("/");

    } catch (error) {
      console.error("Full Error Object:", error);
      
      const errorMessage =
        error.response?.data?.message ||
        "Connection Timeout! Check MongoDB IP Whitelist.";

      alert("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Create Account 📝</h2>
      <form onSubmit={handleRegister}>

        {/* ✅ NAME FIELD (NEW) */}
        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: "12px", width: "100%", borderRadius: "5px", border: "1px solid #ccc" }}
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "12px", width: "100%", borderRadius: "5px", border: "1px solid #ccc" }}
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <input
            type="password"
            placeholder="Password (Min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "12px", width: "100%", borderRadius: "5px", border: "1px solid #ccc" }}
            required
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Register as:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ padding: "10px", width: "100%", borderRadius: "5px" }}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            width: "100%",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {loading ? "Processing..." : "Register Now"}
        </button>
      </form>

      <p style={{ marginTop: "20px" }}>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
}

export default Register;