import React, { useState } from "react";
import { Logo } from "./MorphGuardApp.jsx";
import { API_BASE } from "./api.js";
import {
  ShieldAlert, GitBranch, BarChart3, Mail, Lock, ShieldCheck, ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    Icon: ShieldAlert,
    title: "Behavioral Anomaly Detection",
    body: "An Isolation Forest scores every log block in real time, flagging the events that deviate from normal system behavior.",
  },
  {
    Icon: GitBranch,
    title: "Evolutionary Model Optimization",
    body: "A genetic algorithm continuously re-tunes feature selection, thresholds, and hyperparameters — and only promotes a candidate that beats what's deployed.",
  },
  {
    Icon: BarChart3,
    title: "Deep Analytics",
    body: "Component, event-type, and severity breakdowns across the entire log estate, not just a single anomaly count.",
  },
];

export default function LoginPage({ colors: C, onAuthenticated }) {
  const [mode, setMode] = useState("login");
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

      localStorage.setItem("mg_token", data.token);
      localStorage.setItem("mg_user", JSON.stringify(data.user));
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message || "Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const inputWrapStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px 10px 38px",
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.bgRaised,
    color: C.textHi,
    fontFamily: C.sans,
    fontSize: 14,
    outline: "none",
  };

  const inputIconStyle = {
    position: "absolute",
    left: 12,
    width: 15,
    height: 15,
    color: C.textFaint,
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
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
        .mg-login-hero { display: flex; }
        @media (max-width: 900px) {
          .mg-login-hero { display: none; }
          .mg-login-form-col { flex: 1 1 100% !important; }
        }
      `}</style>

      {/* Hero / marketing panel */}
      <div
        className="mg-login-hero"
        style={{
          flex: "1 1 56%",
          position: "relative",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 56px",
          background: "linear-gradient(160deg, #0A0E14 0%, #101A2C 45%, #16305C 100%)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", top: -120, right: -120, width: 360, height: 360,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: -160, left: -100, width: 420, height: 420,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 70%)",
          }}
        />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <Logo size={34} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#F5F8FC" }}>MorphGuard</div>
          </div>

          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px",
              borderRadius: 999, background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)",
              fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
              color: "#67E8F9", marginBottom: 18,
            }}
          >
            Isolation Forest · GA-optimized
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, color: "#F5F8FC", maxWidth: 480, marginBottom: 12 }}>
            Real-time log analytics for cloud infrastructure.
          </h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#9FB0C6", maxWidth: 440, marginBottom: 36 }}>
            A SIEM-inspired system that parses, scores, and continuously re-optimizes anomaly
            detection across your log estate — so the model that guards your infrastructure
            keeps morphing to match it.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} style={{ display: "flex", gap: 14 }}>
                <div
                  style={{
                    flexShrink: 0, width: 34, height: 34, borderRadius: 8,
                    background: "rgba(59,130,246,0.16)", border: "1px solid rgba(59,130,246,0.28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon size={17} color="#7CA6F5" />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#F0F4F9", marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#8B9AB0", maxWidth: 380 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign-in form */}
      <div
        className="mg-login-form-col"
        style={{
          flex: "1 1 44%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
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
          <div className="mg-login-form-brand" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Logo size={36} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textMd }}>Cloud Log Analytics</div>
          </div>

          <div
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
              color: C.primary, marginBottom: 8,
            }}
          >
            {mode === "login" ? "Secure access" : "Create account"}
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {mode === "login" ? "Sign in" : "Create an account"}
          </h1>
          <p style={{ fontSize: 13, color: C.textLo, marginBottom: 20 }}>
            {mode === "login"
              ? "Welcome back — pick up where you left off on the dashboard."
              : "Set up access to the detection pipeline and model dashboard."}
          </p>

          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.textMd, display: "block", marginBottom: 6 }}>Name</label>
              <input
                style={{ ...inputStyle, padding: "10px 12px" }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.textMd, display: "block", marginBottom: 6 }}>Email</label>
            <div style={inputWrapStyle}>
              <Mail style={inputIconStyle} />
              <input
                style={inputStyle}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: C.textMd, display: "block", marginBottom: 6 }}>Password</label>
            <div style={inputWrapStyle}>
              <Lock style={inputIconStyle} />
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
          </div>

          <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 20 }}>
            {mode === "register" ? "At least 8 characters." : " "}
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
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            {!loading && <ArrowRight size={15} />}
          </button>

          <div
            style={{
              display: "flex", alignItems: "flex-start", gap: 7, marginTop: 16,
              fontSize: 11.5, color: C.textFaint, lineHeight: 1.5,
            }}
          >
            <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1, color: C.textFaint }} />
            Passwords are hashed with bcrypt before storage — we never store or transmit them in plain text.
          </div>

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
    </div>
  );
}
