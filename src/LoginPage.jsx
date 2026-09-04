import React, { useState } from "react";
import { Logo } from "./EvolveApp.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function LoginPage({ colors: C, onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { email, password, name };
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      localStorage.setItem("evolve_token", data.token);
      localStorage.setItem("evolve_user", JSON.stringify(data.user));
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message || "Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.bgRaised,
    color: C.textHi,
    fontFamily: C.sans,
    fontSize: 14,
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
        color: C.textHi,
        fontFamily: C.sans,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: ${C.bg}; }
        input::placeholder { color: ${C.textFaint}; }
      `}</style>

      <form
        onSubmit={handleSubmit}
        style={{
          width: 380,
          maxWidth: "90vw",
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 32,
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Logo size={36} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>EVOLVE</div>
            <div style={{ fontSize: 12, color: C.textLo }}>Cloud Log Analytics</div>
          </div>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          {mode === "login" ? "Sign in" : "Create an account"}
        </h1>
        <p style={{ fontSize: 13, color: C.textLo, marginBottom: 20 }}>
          {mode === "login" ? "Welcome back to your dashboard." : "Set up access to your dashboard."}
        </p>

        {mode === "register" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.textMd, display: "block", marginBottom: 6 }}>Name</label>
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: C.textMd, display: "block", marginBottom: 6 }}>Email</label>
          <input
            style={inputStyle}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: C.textMd, display: "block", marginBottom: 6 }}>Password</label>
          <input
            style={inputStyle}
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div
            style={{
              background: C.dangerDim, color: C.danger, borderRadius: 8,
              padding: "8px 12px", fontSize: 13, marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
            background: C.primary, color: "#fff", fontWeight: 600, fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.textLo }}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("register"); setError(""); }} style={{ color: C.primary, fontWeight: 600 }}>
                Sign up
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); setError(""); }} style={{ color: C.primary, fontWeight: 600 }}>
                Sign in
              </a>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
