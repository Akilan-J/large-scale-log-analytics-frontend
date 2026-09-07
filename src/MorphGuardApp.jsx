import React, { useState, useEffect, useRef } from "react";
import { apiGet, apiPost, apiUpload } from "./api.js";
import {
  LayoutDashboard, Database, ShieldAlert, BarChart3, GitBranch, Settings,
  Search, Bell, ChevronLeft, Plus, RefreshCw, UploadCloud, Download,
  MoreVertical, ArrowUp, ArrowDown, CheckCircle2, Cloud, Server, Waypoints,
  ListTree, AlertTriangle, FileText, X, Check
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, LineChart, AreaChart, Area, BarChart
} from "recharts";

const DARK_THEME = {
  bg: "#0A0E13", bgRaised: "#0D1219", card: "#121821", cardHover: "#161D27",
  border: "#1D2733", borderSoft: "#161E29",
  primary: "#3B82F6", primaryDim: "#1E3A66", cyan: "#22D3EE",
  success: "#10B981", successDim: "#0B3B2C",
  warning: "#F59E0B", warningDim: "#4A3608",
  danger: "#EF4444", dangerDim: "#4A1414",
  textHi: "#E6EDF3", textMd: "#B4C0CC", textLo: "#8A97A6", textFaint: "#5A6672",
};

const LIGHT_THEME = {
  bg: "#F5F7FA", bgRaised: "#FFFFFF", card: "#FFFFFF", cardHover: "#F0F3F7",
  border: "#DDE3EA", borderSoft: "#E7ECF1",
  primary: "#2563EB", primaryDim: "#DCE7FC", cyan: "#0891B2",
  success: "#059669", successDim: "#D1FAE5",
  warning: "#D97706", warningDim: "#FEF3C7",
  danger: "#DC2626", dangerDim: "#FEE2E2",
  textHi: "#0F172A", textMd: "#3F4C5C", textLo: "#64748B", textFaint: "#94A3B8",
};

export const C = {
  ...DARK_THEME,
  mono: "'IBM Plex Mono', monospace", sans: "'Inter', -apple-system, sans-serif",
};

function prefersLight() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: light)").matches
    : false;
}

function applyTheme(isLight) {
  Object.assign(C, isLight ? LIGHT_THEME : DARK_THEME);
}
applyTheme(prefersLight());

export function useSystemTheme() {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e) => {
      applyTheme(e.matches);
      setTick((t) => t + 1);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
}

const ACTIVITY_TONE = { anomaly: C.danger, promotion: C.success, rejection: C.warning };

// Maps the connector icon names the backend returns onto lucide components.
const CONNECTOR_ICONS = {
  Database, Cloud, Server, Waypoints, ListTree, FileText,
};

const SEVERITY_COLOR = { critical: C.danger, high: C.warning, medium: C.cyan };
const SEVERITY_TONE = { critical: "danger", high: "warning", medium: "primary" };
const CHART_PALETTE = [C.primary, C.cyan, C.success, C.warning, C.danger, C.textFaint];

const navSections = [
  { label: "Monitor", items: [
    { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { key: "sources", label: "Log Sources", Icon: Database },
    { key: "detection", label: "Detection Results", Icon: ShieldAlert },
    { key: "analytics", label: "Analytics", Icon: BarChart3 },
  ]},
  { label: "System", items: [
    { key: "models", label: "Model Management", Icon: GitBranch },
    { key: "settings", label: "Settings", Icon: Settings },
  ]},
];

const titles = {
  dashboard: "Dashboard", sources: "Log Sources", detection: "Detection Results",
  analytics: "Analytics", models: "Model Management", settings: "Settings",
};

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("mg_user") || "null");
  } catch {
    return null;
  }
}

function initialsOf(user) {
  if (user?.name?.trim()) {
    return user.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  }
  if (user?.email) return user.email[0].toUpperCase();
  return "U";
}

function displayName(user) {
  if (user?.name?.trim()) return user.name.trim();
  if (user?.email) return user.email.split("@")[0];
  return "Signed in";
}

function bold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") ? <strong key={i} style={{ color: C.textHi }}>{p.slice(2, -2)}</strong> : p
  );
}

function useApiData(fetcher, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef.current()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((err) => { if (!cancelled) setState({ data: null, loading: false, error: err.message || "Failed to load." }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

function PageLoading() {
  return <div style={{ padding: "60px 0", textAlign: "center", color: C.textFaint, fontSize: 13 }}>Loading…</div>;
}

function PageError({ message }) {
  return (
    <Card style={{ textAlign: "center", padding: "32px 20px" }}>
      <div style={{ color: C.danger, fontWeight: 600, marginBottom: 4 }}>Couldn't load this page</div>
      <div style={{ color: C.textFaint, fontSize: 12.5 }}>{message}</div>
    </Card>
  );
}

function formatCompact(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatTimestamp(iso) {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 19);
}

function formatDateRange(range) {
  if (!range) return "";
  const fmt = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(range.min)} – ${fmt(range.max)}`;
}

export function Logo({ size = 30, radius = 8 }) {
  const inner = Math.round(size * 0.64);
  return (
    <div
      role="img"
      aria-label="MorphGuard"
      style={{
        width: size, height: size, flexShrink: 0, borderRadius: radius,
        background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <g stroke="#04141d" strokeWidth="2.1" strokeLinecap="round">
          <path d="M12 2.5 C19.5 6, 19.5 9, 12 12.5 C4.5 16, 4.5 19, 12 22.5" />
          <path d="M12 2.5 C4.5 6, 4.5 9, 12 12.5 C19.5 16, 19.5 19, 12 22.5" />
        </g>
        <g stroke="#04141d" strokeWidth="1.7" strokeLinecap="round" opacity="0.85">
          <path d="M7.6 7.2 H16.4" />
          <path d="M7.6 17.8 H16.4" />
        </g>
      </svg>
    </div>
  );
}

function Badge({ children, tone = "neutral", dot = false }) {
  const tones = {
    success: { bg: C.successDim, fg: "#4ADE9A", bd: "rgba(16,185,129,.3)" },
    warning: { bg: C.warningDim, fg: "#FBBF54", bd: "rgba(245,158,11,.3)" },
    danger: { bg: C.dangerDim, fg: "#FB7676", bd: "rgba(239,68,68,.3)" },
    primary: { bg: C.primaryDim, fg: "#8FBBFF", bd: "rgba(59,130,246,.35)" },
    neutral: { bg: C.bgRaised, fg: C.textMd, bd: C.border },
  }[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
      padding: "3px 9px", borderRadius: 20, letterSpacing: ".2px", textTransform: "uppercase",
      background: tones.bg, color: tones.fg, border: `1px solid ${tones.bd}`, whiteSpace: "nowrap",
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />}
      {children}
    </span>
  );
}

function Card({ children, style, hoverable = false, padded = true }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => hoverable && setHover(false)}
      style={{
        background: C.card, border: `1px solid ${hover ? "#2A3644" : C.border}`, borderRadius: 12,
        boxShadow: hover ? "0 4px 16px rgba(0,0,0,.35)" : "0 1px 2px rgba(0,0,0,.4)",
        transform: hover ? "translateY(-2px)" : "none", transition: "all .15s",
        padding: padded ? "20px 22px" : 0, ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, meta, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h3 style={{ fontSize: 13.5, fontWeight: 600, color: C.textHi }}>{title}</h3>
      {right ? right : meta ? <span style={{ fontSize: 11.5, color: C.textFaint }}>{meta}</span> : null}
    </div>
  );
}

function Button({ children, variant = "secondary", size = "md", onClick, style, icon: Icon, disabled = false }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, borderRadius: 8,
    border: "1px solid transparent", cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap",
    fontSize: size === "sm" ? 12 : 13, padding: size === "sm" ? "6px 12px" : "9px 16px",
    transition: "all .15s", fontFamily: C.sans, opacity: disabled ? 0.6 : 1,
  };
  const variants = {
    primary: { background: C.primary, color: "#fff" },
    secondary: { background: C.card, borderColor: C.border, color: C.textHi },
    ghost: { background: "transparent", color: C.textMd },
  };
  return (
    <button disabled={disabled} style={{ ...base, ...variants[variant], ...style }} onClick={onClick}>
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function ProgressBar({ pct, color = C.primary, height = 8 }) {
  return (
    <div style={{ height, borderRadius: 6, background: C.bgRaised, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 6, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function PillTabs({ options, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, background: C.bgRaised, padding: 4, borderRadius: 10, border: `1px solid ${C.border}` }}>
      {options.map((opt) => (
        <div key={opt.value} onClick={() => onChange(opt.value)} style={{
          padding: "6px 14px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          color: active === opt.value ? C.textHi : C.textLo,
          background: active === opt.value ? C.card : "transparent",
          boxShadow: active === opt.value ? "0 1px 2px rgba(0,0,0,.4)" : "none",
          transition: "all .15s",
        }}>{opt.label}</div>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder, width = 280 }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: "7px 12px", width,
    }}>
      <Search size={15} color={C.textFaint} />
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: "none", border: "none", color: C.textHi, fontSize: 13, width: "100%", outline: "none", fontFamily: C.sans }}
      />
    </div>
  );
}

function KpiCard({ label, value, valueColor, icon: Icon, iconBg, iconColor, delta, deltaUp, footer }) {
  return (
    <Card hoverable>
      {Icon && (
        <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, background: iconBg, color: iconColor }}>
          <Icon size={18} />
        </div>
      )}
      <div style={{ fontSize: 12, color: C.textLo, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 600, letterSpacing: "-.5px", color: valueColor || C.textHi }}>{value}</div>
      {delta && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 12, fontWeight: 600, color: deltaUp ? C.success : C.danger }}>
          {deltaUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {delta}
        </div>
      )}
      {footer}
    </Card>
  );
}

function ChartCard({ title, meta, right, height = 260, children }) {
  return (
    <Card>
      <CardHeader title={title} meta={meta} right={right} />
      <div style={{ height }}>{children}</div>
    </Card>
  );
}

const tooltipStyle = {
  contentStyle: { background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: C.mono, fontSize: 11.5 },
  labelStyle: { color: C.textMd }, itemStyle: { color: C.textHi },
};

function Table({ head, children }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} style={{
                textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px",
                color: C.textFaint, padding: "10px 14px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, mono = false, title = false, style }) {
  const [hover] = [false];
  return (
    <td style={{
      padding: "13px 14px", borderBottom: `1px solid ${C.borderSoft}`,
      color: title ? C.textHi : C.textMd, fontWeight: title ? 500 : 400,
      fontFamily: mono ? C.mono : C.sans, whiteSpace: "nowrap", ...style,
    }}>{children}</td>
  );
}

function Row({ children }) {
  const [hover, setHover] = useState(false);
  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? C.cardHover : "transparent", transition: "background .12s" }}>
      {children}
    </tr>
  );
}

function Sidebar({ active, setActive, expanded, setExpanded }) {
  const user = currentUser();
  return (
    <aside style={{
      width: expanded ? 232 : 72, flexShrink: 0, background: C.bgRaised, borderRight: `1px solid ${C.borderSoft}`,
      display: "flex", flexDirection: "column", transition: "width .22s cubic-bezier(.4,0,.2,1)",
      position: "sticky", top: 0, height: "100vh", zIndex: 40,
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          position: "absolute", top: 20, right: -12, width: 24, height: 24, background: C.card,
          border: `1px solid ${C.border}`, borderRadius: "50%", display: "flex", alignItems: "center",
          justifyContent: "center", color: C.textLo, cursor: "pointer", zIndex: 41,
        }}>
        <ChevronLeft size={12} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .22s" }} />
      </div>

      <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", borderBottom: `1px solid ${C.borderSoft}`, whiteSpace: "nowrap", overflow: "hidden" }}>
        <Logo size={30} />
        <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: ".2px", opacity: expanded ? 1 : 0, transition: "opacity .15s" }}>MorphGuard</div>
      </div>

      <nav style={{ padding: "16px 12px", flex: 1 }}>
        {navSections.map((section) => (
          <div key={section.label}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: C.textFaint, padding: "0 12px 8px",
              textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden",
              height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0, transition: "opacity .15s", marginTop: section.label === "System" ? 8 : 0,
            }}>{section.label}</div>
            {section.items.map(({ key, label, Icon }) => {
              const isActive = active === key;
              return (
                <div key={key} onClick={() => setActive(key)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderRadius: 8,
                  color: isActive ? "#BFD7FF" : C.textLo, fontWeight: 500, fontSize: 13.5, whiteSpace: "nowrap",
                  overflow: "hidden", marginBottom: 2, position: "relative", cursor: "pointer",
                  background: isActive ? C.primaryDim : "transparent", transition: "background .12s, color .12s",
                }}>
                  {isActive && <div style={{ position: "absolute", left: -12, top: 8, bottom: 8, width: 3, background: C.primary, borderRadius: "0 4px 4px 0" }} />}
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  <span style={{ opacity: expanded ? 1 : 0, transition: "opacity .15s" }}>{label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: "auto", padding: 12, borderTop: `1px solid ${C.borderSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#2a3f5f,#1a2634)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.cyan }}>{initialsOf(user)}</div>
          <div style={{ opacity: expanded ? 1 : 0, transition: "opacity .15s", overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textHi, textOverflow: "ellipsis", overflow: "hidden" }}>{displayName(user)}</div>
            <div style={{ fontSize: 11, color: C.textFaint, textOverflow: "ellipsis", overflow: "hidden" }}>{user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ pageTitle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = initialsOf(currentUser());

  function handleLogout() {
    localStorage.removeItem("mg_token");
    localStorage.removeItem("mg_user");
    window.location.reload();
  }

  return (
    <header style={{
      height: 64, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", borderBottom: `1px solid ${C.borderSoft}`, background: C.bgRaised,
      backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 30,
    }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.textHi }}>{pageTitle}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <SearchBox value="" onChange={() => {}} placeholder="Search logs, events, models..." width={260} />
        <div style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.success,
          background: C.successDim, border: "1px solid rgba(16,185,129,0.25)", padding: "6px 12px", borderRadius: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block" }} />
          Ingestion Live
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMd, position: "relative" }}>
          <Bell size={17} />
          <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: C.danger, boxShadow: `0 0 0 2px ${C.card}` }} />
        </div>
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setMenuOpen((v) => !v)}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2a3f5f,#1a2634)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.cyan, cursor: "pointer" }}
          >
            {initials}
          </div>
          {menuOpen && (
            <div style={{
              position: "absolute", right: 0, top: 44, background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, boxShadow: C.shadowMd || "0 12px 40px rgba(0,0,0,0.3)", overflow: "hidden", minWidth: 120, zIndex: 40,
            }}>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "10px 14px", background: "transparent", border: "none",
                  color: C.textHi, fontSize: 13, textAlign: "left", cursor: "pointer",
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DashboardPage() {
  const { data, loading, error } = useApiData(() => apiGet("/api/dashboard"), []);

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} />;

  const { kpis, volume_by_day, severity_mix, model_evolution, recent_activity, date_range } = data;

  return (
    <div>
      <PageHeader
        title="Overview"
        sub={`Isolation Forest anomaly detection over the HDFS log trace (${formatDateRange(date_range)})`}
        right={<>
          <Button size="sm" icon={Plus}>New Log Source</Button>
          <Button size="sm" variant="primary" icon={RefreshCw}>Run Detection Scan</Button>
        </>}
      />

      <div className="mg-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 18 }}>
        <KpiCard label="Total Logs Processed" value={formatCompact(kpis.total_logs_processed)} icon={FileText} iconBg={C.primaryDim} iconColor={C.primary} />
        <KpiCard label="Anomalies Detected" value={kpis.anomalies_detected.toLocaleString()} icon={AlertTriangle} iconBg={C.dangerDim} iconColor={C.danger} delta={`${kpis.anomaly_rate_pct.toFixed(2)}% of blocks`} deltaUp={false} />
        <Card hoverable>
          <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, background: "rgba(34,211,238,0.12)", color: C.cyan }}>
            <GitBranch size={18} />
          </div>
          <div style={{ fontSize: 12, color: C.textLo, fontWeight: 500, marginBottom: 6 }}>Current Model Version</div>
          <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 600, letterSpacing: "-.5px" }}>V{kpis.current_version}</div>
          <LineageMini />
        </Card>
        <Card hoverable>
          <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, background: C.successDim, color: C.success }}>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: 12, color: C.textLo, fontWeight: 500, marginBottom: 6 }}>Model Status</div>
          <div style={{ fontSize: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>Active <Badge tone="success" dot>Healthy</Badge></div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }}>
            {kpis.false_positive_rate_pct != null ? `${kpis.false_positive_rate_pct.toFixed(2)}% false positive rate` : "Serving all traffic"}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Log Volume & Anomalies — by Day" meta={formatDateRange(date_range)}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volume_by_day} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: C.sans }} />
              <Bar yAxisId="left" dataKey="logs" name="Log events" fill="rgba(59,130,246,0.55)" radius={[4,4,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="anomalies" name="Anomalous blocks" stroke={C.danger} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader title="Recent Activity" meta="Detections + model events" />
          {recent_activity.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < recent_activity.length - 1 ? `1px solid ${C.borderSoft}` : "none", paddingTop: i === 0 ? 0 : 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: ACTIVITY_TONE[a.type] || C.primary }} />
              <div>
                <div style={{ fontSize: 13, color: C.textHi, lineHeight: 1.4 }}>{bold(a.text)}</div>
                <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 2, fontFamily: C.mono }}>{formatTimestamp(a.timestamp)}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
        <Card>
          <CardHeader title="Quick Statistics" />
          <Stat label="Blocks analyzed" value={kpis.total_blocks_analyzed.toLocaleString()} />
          <Stat label="Anomaly rate" value={`${kpis.anomaly_rate_pct.toFixed(2)}%`} />
          <Stat label="False positive rate" value={kpis.false_positive_rate_pct != null ? `${kpis.false_positive_rate_pct.toFixed(2)}%` : "—"} color={C.success} />
        </Card>

        <ChartCard title="Anomaly Severity Mix" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={severity_mix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={75} paddingAngle={2}>
                {severity_mix.map((s, i) => <Cell key={i} fill={SEVERITY_COLOR[s.name.toLowerCase()] || C.textFaint} stroke="none" />)}
              </Pie>
              <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 10.5, fontFamily: C.sans }} />
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader title="Model Evolution" right={<Badge tone="primary">Deploy-if-better</Badge>} />
          <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 4 }}>Current</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700 }}>V{kpis.current_version}</span>
            <Badge tone="success" dot>Active</Badge>
          </div>
          {model_evolution.map((r) => (
            <div key={r.version} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 8 }}>
              <span style={{ width: 30, fontFamily: C.mono, color: r.active ? C.cyan : C.textFaint }}>{r.version}</span>
              <div style={{ flex: 1 }}><ProgressBar pct={r.accuracy_pct} color={r.active ? C.cyan : C.textFaint} height={8} /></div>
              <span style={{ fontFamily: C.mono, color: C.textMd, width: 44 }}>{r.accuracy_pct.toFixed(1)}%</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 11.5, color: C.textFaint }}>Promotes a retrained candidate only when it beats the currently deployed model's F1 score.</div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span style={{ color: C.textMd, fontSize: 12.5 }}>{label}</span>
      <span style={{ fontFamily: C.mono, fontWeight: 600, color: color || C.textHi }}>{value}</span>
    </div>
  );
}

function LineageMini() {
  const Node = ({ tone }) => {
    const styles = {
      past: { border: C.textFaint, bg: C.bgRaised },
      active: { border: C.cyan, bg: C.cyan, glow: true },
      candidate: { border: C.warning, bg: "transparent", dashed: true },
    }[tone];
    return (
      <div style={{
        width: 11, height: 11, borderRadius: "50%", border: `2px ${styles.dashed ? "dashed" : "solid"} ${styles.border}`,
        background: styles.bg, flexShrink: 0, boxShadow: styles.glow ? "0 0 0 4px rgba(34,211,238,0.15)" : "none",
      }} />
    );
  };
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 6, padding: "4px 0" }}>
      <Node tone="past" /><div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${C.textFaint}, ${C.cyan})`, margin: "0 -1px" }} />
      <Node tone="active" /><div style={{ flex: 1, height: 2, background: `repeating-linear-gradient(90deg, ${C.warning} 0 4px, transparent 4px 8px)`, opacity: 0.6, margin: "0 -1px" }} />
      <Node tone="candidate" />
    </div>
  );
}

function PageHeader({ title, sub, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.3px" }}>{title}</div>
        <div style={{ fontSize: 13, color: C.textLo, marginTop: 4 }}>{sub}</div>
      </div>
      {right && <div style={{ display: "flex", gap: 10 }}>{right}</div>}
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1; }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

function SourcesPage() {
  const [dragOver, setDragOver] = useState(false);
  const [upload, setUpload] = useState(null);
  const fileRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: history, loading, error } = useApiData(() => apiGet("/api/sources/uploads"), [refreshKey]);
  const { data: connectorData } = useApiData(() => apiGet("/api/sources/connectors"), []);
  const rows = history?.uploads || [];
  const connectors = connectorData?.connectors || [];

  // A just-uploaded file parses in the background, so poll while anything is
  // still processing and stop once every row has settled.
  const anyProcessing = rows.some((r) => r.status === "processing");
  useEffect(() => {
    if (!anyProcessing) return;
    const iv = setInterval(() => setRefreshKey((k) => k + 1), 2500);
    return () => clearInterval(iv);
  }, [anyProcessing]);

  async function handleFile(file) {
    if (!file) return;
    setUpload({ name: file.name, pct: 0 });
    try {
      await apiUpload("/api/sources/upload", file, (pct) => setUpload({ name: file.name, pct }));
      setToast({ title: "Upload complete", sub: `${file.name} is queued for analysis` });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setToast({ title: "Upload failed", sub: err.message });
    } finally {
      setUpload(null);
      setTimeout(() => setToast(null), 3600);
    }
  }

  return (
    <div>
      <PageHeader title="Log Sources" sub="Upload log files and connect streaming sources for continuous ingestion"
        right={<Button size="sm" icon={Plus}>Connect Source</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 18, marginBottom: 18 }}>
        <Card>
          <CardHeader title="Upload Log File" />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
            style={{
              border: `1.5px dashed ${dragOver ? C.primary : C.border}`, borderRadius: 12, padding: "44px 20px",
              textAlign: "center", cursor: "pointer", transition: "border-color .2s, background .2s",
              background: dragOver ? "rgba(59,130,246,0.04)" : "transparent",
            }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: C.bgRaised, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.primary }}>
              <UploadCloud size={24} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>Drag &amp; drop log files</div>
            <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 14 }}>.log, .json, .csv, .txt — up to 500MB</div>
            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>Browse Files</Button>
            <input ref={fileRef} type="file" accept=".log,.json,.csv,.txt" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          </div>
          {upload && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: C.textMd }}>{upload.name}</span>
                <span style={{ fontFamily: C.mono, color: C.textFaint }}>{Math.round(upload.pct)}%</span>
              </div>
              <ProgressBar pct={upload.pct} />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Supported Sources" meta="Future-ready connectors" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {connectors.map((c) => {
              const Icon = CONNECTOR_ICONS[c.icon] || Database;
              return (
                <div key={c.name} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `1px solid ${C.border}`,
                  borderRadius: 8, background: C.bgRaised, opacity: c.enabled ? 1 : 0.45,
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c.enabled ? C.primaryDim : C.bg, color: c.enabled ? C.primary : C.textFaint }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: c.enabled ? C.textHi : C.textMd }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: C.textFaint }}>{c.enabled ? "Active" : "Not connected"}</div>
                  </div>
                  {c.enabled
                    ? <Badge tone="success" dot>Enabled</Badge>
                    : <Button variant="ghost" size="sm" style={{ marginLeft: "auto" }}>Connect</Button>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div style={{ padding: "20px 22px 0" }}>
          <CardHeader title="Upload History" meta={history ? `${history.total} file${history.total === 1 ? "" : "s"} total` : ""} />
        </div>
        {loading && !history ? <PageLoading /> : error ? <PageError message={error} /> : rows.length === 0 ? (
          <div style={{ padding: "44px 20px", textAlign: "center", color: C.textFaint, fontSize: 13 }}>
            No uploads yet — drop a log file above to get started.
          </div>
        ) : (
          <Table head={["File Name", "Source", "Size", "Records", "Uploaded", "Status", ""]}>
            {rows.map((u) => (
              <Row key={u.id}>
                <Td title>
                  {u.name}
                  {u.status === "failed" && u.error && (
                    <div style={{ fontSize: 11, fontWeight: 400, color: C.danger, marginTop: 3, whiteSpace: "normal", maxWidth: 340 }}>{u.error}</div>
                  )}
                </Td>
                <Td>{u.source}</Td>
                <Td mono>{formatBytes(u.size_bytes)}</Td>
                <Td mono>
                  <span title={u.total_lines != null ? `${u.total_lines.toLocaleString()} lines in file` : undefined}>
                    {u.records != null ? u.records.toLocaleString() : "—"}
                  </span>
                </Td>
                <Td mono>{formatTimestamp(u.uploaded_at)}</Td>
                <Td>{u.status === "processed" ? <Badge tone="success" dot>Processed</Badge> : u.status === "processing" ? <Badge tone="warning">Processing</Badge> : <Badge tone="danger">Failed</Badge>}</Td>
                <Td><MoreVertical size={14} color={C.textFaint} style={{ cursor: "pointer" }} /></Td>
              </Row>
            ))}
          </Table>
        )}
      </Card>

      {toast && <Toast title={toast.title} sub={toast.sub} />}
    </div>
  );
}

function DetectionPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sev, setSev] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: summary } = useApiData(() => apiGet("/api/detections/summary"), []);
  const { data, loading, error } = useApiData(
    () => apiGet("/api/detections", { search: debouncedSearch, severity: sev, page, limit }),
    [debouncedSearch, sev, page]
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div>
      <PageHeader title="Detection Results" sub="Block-level anomaly classification from the currently deployed Isolation Forest model"
        right={<Button size="sm" icon={Download}>Export CSV</Button>} />

      <div className="mg-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 18 }}>
        <KpiCard label="Total Blocks Analyzed" value={summary ? summary.total_analyzed.toLocaleString() : "—"} />
        <KpiCard label="Normal Blocks" value={summary ? summary.normal_count.toLocaleString() : "—"} valueColor={C.success}
          footer={summary && <div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }}>{(summary.normal_count / summary.total_analyzed * 100).toFixed(2)}% of total</div>} />
        <KpiCard label="Anomalous Blocks" value={summary ? summary.anomalous_count.toLocaleString() : "—"} valueColor={C.danger}
          footer={summary && <div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }}>{(summary.anomalous_count / summary.total_analyzed * 100).toFixed(2)}% of total</div>} />
        <KpiCard label="Avg. Anomaly Score" value={summary ? summary.avg_anomaly_score.toFixed(3) : "—"} valueColor={C.warning}
          footer={summary && <div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }}>Contamination: {summary.contamination_threshold.toFixed(3)}</div>} />
      </div>

      <Card padded={false} style={{ marginBottom: 18 }}>
        <div style={{ padding: "20px 22px 16px" }}>
          <CardHeader title="Detection Summary" />
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <SearchBox value={search} onChange={setSearch} placeholder="Search block ID, component, event type, source IP..." width={300} />
            <PillTabs
              active={sev} onChange={(v) => { setSev(v); setPage(1); }}
              options={[{ value: "all", label: "All" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }]}
            />
          </div>
        </div>
        {error && <div style={{ padding: "0 22px 16px", color: C.danger, fontSize: 13 }}>{error}</div>}
        <Table head={["Timestamp", "Block ID", "Component", "Event Type", "Anomaly Score", "Severity", "Source IP"]}>
          {(data?.items || []).map((e) => (
            <Row key={e.block_id}>
              <Td mono>{formatTimestamp(e.timestamp)}</Td>
              <Td title mono>{e.block_id}</Td>
              <Td mono>{e.component}</Td>
              <Td mono>{e.event_type}</Td>
              <Td mono>{e.anomaly_score.toFixed(4)}</Td>
              <Td>{e.severity === "normal" ? <Badge tone="neutral">normal</Badge> : <Badge tone={SEVERITY_TONE[e.severity]} dot>{e.severity}</Badge>}</Td>
              <Td mono>{e.source_ip}</Td>
            </Row>
          ))}
          {!loading && data && data.items.length === 0 && (
            <tr><td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", color: C.textFaint, fontSize: 13 }}>No blocks match this filter — try a different search or severity.</td></tr>
          )}
        </Table>
        {loading && <div style={{ padding: "24px 0" }}><PageLoading /></div>}
        {data && data.total > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderTop: `1px solid ${C.borderSoft}` }}>
            <span style={{ fontSize: 12, color: C.textFaint }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total.toLocaleString()}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: page <= 1 ? 0.4 : 1 }}>Prev</Button>
              <span style={{ fontSize: 12, color: C.textMd, fontFamily: C.mono, padding: "6px 4px" }}>Page {page} / {totalPages}</span>
              <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ opacity: page >= totalPages ? 0.4 : 1 }}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function AnalyticsPage() {
  const { data, loading, error } = useApiData(() => apiGet("/api/analytics"), []);

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} />;

  const {
    component_distribution, event_type_distribution, log_level_distribution,
    hour_of_day_distribution, anomalies_by_day, anomalies_by_component_by_day,
    top_components, date_range,
  } = data;

  return (
    <div>
      <PageHeader title="Analytics" sub={`Real distributions from the HDFS log trace (${formatDateRange(date_range)})`} />

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Anomalies Detected — by Day" meta={formatDateRange(date_range)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={anomalies_by_day} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="anomalies" name="Anomalies Detected" stroke={C.danger} strokeWidth={2} dot={{ r: 4, fill: C.danger }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Log Level Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={log_level_distribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={2}>
                {log_level_distribution.map((s, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} stroke="none" />)}
              </Pie>
              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 10.5, fontFamily: C.sans }} />
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Event Type Distribution" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={event_type_distribution} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.textMd, fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill={C.primary} radius={[0,4,4,0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Component Distribution" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={component_distribution} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.textMd, fontSize: 10 }} axisLine={false} tickLine={false} width={150} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill={C.cyan} radius={[0,4,4,0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ marginBottom: 18 }}>
        <ChartCard title="Events by Hour of Day" meta="Aggregated across the full trace" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hour_of_day_distribution} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: C.textFaint, fontSize: 9.5, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="count" name="Blocks" stroke={C.success} fill="rgba(16,185,129,0.12)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Anomalies by Component" meta={`Stacked, ${formatDateRange(date_range)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={anomalies_by_component_by_day} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={C.borderSoft} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={{ stroke: C.border }} tickLine={false} />
            <YAxis tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: C.sans }} />
            {top_components.map((component, i) => (
              <Bar key={component} dataKey={component} stackId="s" fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                radius={i === top_components.length - 1 ? [4,4,0,0] : [0,0,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

const TIMELINE_COLOR = { success: C.success, danger: C.danger, warning: C.warning };

function useElapsedSeconds(startedAt, running) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [running]);
  if (!startedAt) return 0;
  return Math.max(0, Math.round((now - new Date(startedAt).getTime()) / 1000));
}

function ModelsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [job, setJob] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error } = useApiData(() => apiGet("/api/models"), [refreshKey]);

  useEffect(() => {
    if (data?.job && !job) setJob(data.job);
  }, [data, job]);

  useEffect(() => {
    if (!job || job.state !== "running") return;
    const iv = setInterval(async () => {
      try {
        const updated = await apiGet(`/api/models/retrain/${job.job_id}`);
        setJob(updated);
        if (updated.state !== "running") {
          setToast({
            title: updated.state === "error" ? "Retrain failed" : updated.result.promoted ? "Candidate promoted" : "Candidate not promoted",
            sub: updated.state === "error" ? updated.error : updated.result.promoted
              ? `Promoted to V${updated.result.new_version} (${updated.result.metric}: ${updated.result.candidate_metric_value.toFixed(4)})`
              : `${updated.result.metric} ${updated.result.candidate_metric_value.toFixed(4)} did not beat current ${updated.result.current_metric_value.toFixed(4)}`,
          });
          setTimeout(() => setToast(null), 5000);
          setRefreshKey((k) => k + 1);
        }
      } catch {
        // transient poll failure — try again on the next tick
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [job]);

  const elapsed = useElapsedSeconds(job?.started_at, job?.state === "running");

  async function startRetrain() {
    setModalOpen(false);
    try {
      const { job_id } = await apiPost("/api/models/retrain");
      setJob({ state: "running", started_at: new Date().toISOString(), job_id, result: null, error: null });
    } catch (err) {
      setToast({ title: "Couldn't start retrain", sub: err.message });
      setTimeout(() => setToast(null), 4000);
    }
  }

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} />;

  const { current, history_table, timeline } = data;
  const isRunning = job?.state === "running";
  const previous = history_table.length > 1 ? history_table[history_table.length - 2] : null;
  const lastOutcome = timeline[0];

  return (
    <div>
      <PageHeader title="Model Management" sub="Retrains via genetic-algorithm optimization and promotes a candidate only if it beats the currently deployed model"
        right={<Button variant="primary" size="sm" onClick={() => setModalOpen(true)} disabled={isRunning}>{isRunning ? "Retrain running…" : "Run Retrain Cycle"}</Button>} />

      <Card style={{ padding: "28px 26px 20px", marginBottom: 18 }}>
        <CardHeader title="Model Evolution Lineage" right={<Badge tone="primary">{history_table.length} version{history_table.length === 1 ? "" : "s"}</Badge>} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 10px 10px" }}>
          <div style={{ position: "absolute", left: "5%", right: "5%", top: 60, height: 2, background: C.border, zIndex: 0 }} />
          <div style={{ position: "absolute", left: "5%", top: 60, height: 2, width: "62%", background: `linear-gradient(90deg, ${C.textFaint}, ${C.primary}, ${C.cyan})`, zIndex: 1 }} />

          {previous
            ? <GenNode tone="retired" label="Retired" version={previous.version} acc={`${previous.accuracy_pct.toFixed(1)}% acc`} status={<Badge tone="neutral">Retired</Badge>} />
            : <GenNode tone="retired" label="Baseline" version={current.version === 1 ? `V${current.version}` : "—"} acc="" status={<Badge tone="neutral">—</Badge>} />}
          <GenNode tone="deployed" label="Deployed" version={`V${current.version}`} acc={`${(current.metrics?.accuracy * 100 || 0).toFixed(1)}% acc`} status={<Badge tone="success" dot>Active</Badge>} />
          {isRunning
            ? <GenNode tone="candidate" label="Candidate" version={`${elapsed}s`} acc="running" status={<Badge tone="warning">Training…</Badge>} />
            : lastOutcome
              ? <GenNode tone="candidate" label="Last Attempt" version={lastOutcome.title.startsWith("V") ? lastOutcome.title.split(" ")[0] : "Rejected"}
                  acc={lastOutcome.desc} status={<Badge tone={lastOutcome.tone === "success" ? "success" : "danger"} dot={lastOutcome.tone === "success"}>{lastOutcome.tone === "success" ? "Promoted" : "Rejected"}</Badge>} />
              : <GenNode tone="candidate" label="Candidate" version="—" acc="No runs yet" status={<Badge tone="neutral">Idle</Badge>} />}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <Card>
          <CardHeader title={`Deployed Model — V${current.version}`} right={<Badge tone="success" dot>Live</Badge>} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <MetricBlock label="Accuracy" value={`${((current.metrics?.accuracy || 0) * 100).toFixed(1)}%`} />
            <MetricBlock label="F1 Score" value={(current.metrics?.f1 || 0).toFixed(4)} />
            <MetricBlock label="Precision" value={(current.metrics?.precision || 0).toFixed(4)} />
            <MetricBlock label="Recall" value={(current.metrics?.recall || 0).toFixed(4)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Candidate / Last Retrain" right={isRunning ? <Badge tone="warning">Running</Badge> : <Badge tone="neutral">Idle</Badge>} />
          {isRunning ? (
            <div>
              <div style={{ fontSize: 12, color: C.textLo, marginBottom: 8 }}>GA optimization in progress</div>
              <ProgressBar pct={Math.min(95, elapsed / 180 * 100)} color={C.warning} />
              <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 6 }}>Elapsed {elapsed}s · typically ~3 minutes</div>
            </div>
          ) : lastOutcome ? (
            <div>
              <div style={{ fontSize: 13, color: C.textHi, marginBottom: 6 }}>{lastOutcome.title}</div>
              <div style={{ fontSize: 12.5, color: C.textMd, marginBottom: 6 }}>{lastOutcome.desc}</div>
              <div style={{ fontSize: 11.5, color: C.textFaint, fontFamily: C.mono }}>{formatTimestamp(lastOutcome.meta)}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: C.textFaint }}>No retrain cycle has run yet.</div>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 18 }}>
        <Card>
          <CardHeader title="Deployment History" />
          <Table head={["Version", "Accuracy", "F1", "Promoted", "Status"]}>
            {history_table.map((d) => (
              <Row key={d.version}>
                <Td title mono>{d.version}</Td>
                <Td mono>{d.accuracy_pct.toFixed(1)}%</Td>
                <Td mono>{d.f1?.toFixed(4) ?? "—"}</Td>
                <Td mono>{formatTimestamp(d.promoted_at)}</Td>
                <Td>{d.status === "active" ? <Badge tone="success" dot>Active</Badge> : <Badge tone="neutral">Retired</Badge>}</Td>
              </Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHeader title="Model Evolution Timeline" />
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 6, top: 4, bottom: 4, width: 2, background: C.border }} />
            {timeline.length === 0 && <div style={{ fontSize: 12.5, color: C.textFaint }}>No retrain cycles recorded yet.</div>}
            {timeline.map((t, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i < timeline.length - 1 ? 22 : 0 }}>
                <div style={{ position: "absolute", left: -28, top: 2, width: 14, height: 14, borderRadius: "50%", background: `${TIMELINE_COLOR[t.tone]}22`, border: `2px solid ${TIMELINE_COLOR[t.tone]}`, zIndex: 1 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textHi }}>{t.title}</div>
                <div style={{ fontSize: 12, color: C.textFaint, marginTop: 3, fontFamily: C.mono }}>{formatTimestamp(t.meta)}</div>
                <div style={{ fontSize: 12.5, color: C.textMd, marginTop: 4 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {modalOpen && (
        <div onClick={() => setModalOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(5,7,10,0.7)", backdropFilter: "blur(3px)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: "90vw", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.45)", padding: 26 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Start a new retrain cycle?</h3>
            <p style={{ fontSize: 13, color: C.textMd, marginBottom: 18, lineHeight: 1.5 }}>
              Runs a fresh GA optimization pass over the full labeled dataset (~3 minutes) to produce a candidate model,
              then automatically promotes it to <strong style={{ fontFamily: C.mono, color: C.textHi }}>V{current.version + 1}</strong> only
              if its F1 score beats the currently deployed <strong style={{ fontFamily: C.mono, color: C.textHi }}>V{current.version}</strong> (F1: {(current.metrics?.f1 || 0).toFixed(4)}).
              Otherwise the candidate is archived and nothing changes.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={startRetrain}>Start Retrain</Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast title={toast.title} sub={toast.sub} />}
    </div>
  );
}

function GenNode({ tone, label, version, acc, status }) {
  const dotStyles = {
    retired: { border: "#2A3644", bg: C.bgRaised },
    deployed: { border: C.cyan, bg: C.cyan, glow: true },
    candidate: { border: C.warning, bg: C.bg, dashed: true },
  }[tone];
  return (
    <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", border: `3px ${dotStyles.dashed ? "dashed" : "solid"} ${dotStyles.border}`,
        background: dotStyles.bg, marginBottom: 14,
        boxShadow: dotStyles.glow ? "0 0 0 6px rgba(34,211,238,0.14), 0 0 18px rgba(34,211,238,.35)" : "none",
      }} />
      <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: C.mono, fontWeight: 700, fontSize: 17, color: C.textHi }}>{version}</div>
      <div style={{ fontFamily: C.mono, fontSize: 12.5, color: C.textMd, marginTop: 4 }}>{acc}</div>
      <div style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}

function MetricBlock({ label, value, color, small }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.textLo, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: C.mono, fontSize: small ? 15 : 22, fontWeight: 600, color: color || C.textHi, paddingTop: small ? 4 : 0 }}>{value}</div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" sub="Workspace, alerting, and account preferences" />
      <Card style={{ padding: "48px 20px", textAlign: "center" }}>
        <Settings size={40} color={C.textFaint} style={{ margin: "0 auto 14px", opacity: 0.5 }} />
        <div style={{ fontWeight: 600, color: C.textMd }}>Out of scope for this prototype</div>
        <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 4 }}>Wired up in the sitemap — see the accompanying design document.</div>
      </Card>
    </div>
  );
}

function Toast({ title, sub }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.success}`, borderRadius: 8, padding: "14px 18px", boxShadow: "0 12px 40px rgba(0,0,0,.45)",
      display: "flex", alignItems: "center", gap: 12, zIndex: 200,
    }}>
      <Check size={18} color={C.success} />
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: C.textFaint }}>{sub}</div>
      </div>
    </div>
  );
}

export default function MorphGuardApp() {
  useSystemTheme();
  const [page, setPage] = useState("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const pages = {
    dashboard: <DashboardPage />,
    sources: <SourcesPage />,
    detection: <DetectionPage />,
    analytics: <AnalyticsPage />,
    models: <ModelsPage />,
    settings: <SettingsPage />,
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: C.bg, color: C.textHi, fontFamily: C.sans, fontSize: 14,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { margin: 0; padding: 0; background: ${C.bg}; width: 100%; height: 100%; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 8px; }
        select:focus, input:focus { outline: 2px solid ${C.cyan}; outline-offset: 1px; }
        @media (max-width: 1180px) {
          .mg-grid-4 { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <Sidebar active={page} setActive={setPage} expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar pageTitle={titles[page]} />
        <main style={{ padding: 28, flex: 1 }}>
          {pages[page]}
        </main>
      </div>
    </div>
  );
}
