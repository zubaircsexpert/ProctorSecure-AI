import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // 🔒 Basic validation
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://proctorsecure-ai-jkc2.onrender.com/api/auth/login",
        {
          email,
          password,
        }
      );

      // ✅ Safe store
      if (res.data?.token && res.data?.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        alert("Login Successful ✅");

        // 🔥 YAHAN CHANGE KIYA HAI: window.location.href use kiya hai
        // Is se page auto-refresh hoga aur options foran show honge
        if (res.data.user.role === "teacher") {
          window.location.href = "/teacher-panel";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        alert("Invalid server response ❌");
      }

    } catch (error) {
      console.error("Login Error:", error);

      alert(
        error.response?.data?.message ||
        "Login Failed ❌ (Server not running?)"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>

      <h1>Login 🔐</h1>

      <form onSubmit={handleLogin}>

        <div style={{ marginBottom: "10px" }}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "10px", width: "250px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "10px", width: "250px" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            backgroundColor: "#00cc88",
            border: "none",
            color: "white",
            borderRadius: "5px"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

      <p style={{ marginTop: "20px" }}>
        Don’t have an account?{" "}
        <Link to="/register">Register Here</Link>
      </p>

    </div>
  );
}

export default Login;
