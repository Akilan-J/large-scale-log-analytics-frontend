import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import { apiDownload, apiGet, apiPost, apiUpload } from "./api.js";
import {
  LayoutDashboard, Database, ShieldAlert, BarChart3, GitBranch, Settings,
  Search, Bell, ChevronLeft, Plus, RefreshCw, UploadCloud, Download,
  MoreVertical, ArrowUp, ArrowDown, CheckCircle2, Cloud, Server, Waypoints,
  ListTree, AlertTriangle, FileText, X, Check, HardDrive, Activity, Radio, Zap
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, LineChart, AreaChart, Area, BarChart, ReferenceLine
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

const ACTIVITY_TONE = { anomaly: C.danger, promotion: C.success, rejection: C.warning, rollback: C.warning, refit: C.primary };

// Maps the connector icon names the backend returns onto lucide components.
// Connector status from /api/sources/connectors: what works now, what can be
// started, and what is future work (with the reason in its detail line).
const CONNECTOR_BADGE = {
  active: { tone: "success", label: "Active" },
  live: { tone: "success", label: "Live" },
  idle: { tone: "primary", label: "Idle" },
  available: { tone: "primary", label: "Available" },
  unknown: { tone: "warning", label: "Unknown" },
  future: { tone: "neutral", label: "Future work" },
};

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
    { key: "storage", label: "Smart Storage", Icon: HardDrive },
    { key: "stream", label: "Live Stream", Icon: Activity },
  ]},
  { label: "System", items: [
    { key: "models", label: "Model Management", Icon: GitBranch },
    { key: "settings", label: "Settings", Icon: Settings },
  ]},
];

const titles = {
  dashboard: "Dashboard", sources: "Log Sources", detection: "Detection Results",
  analytics: "Analytics", models: "Model Management", settings: "Settings",
  storage: "Smart Storage", stream: "Live Stream",
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

// Which log source every source-aware page shows. Remembered per browser.
export const SOURCES = [
  { value: "hdfs", label: "HDFS" },
  { value: "openstack", label: "OpenStack" },
  { value: "apache", label: "Apache" },
  { value: "cloudtrail", label: "CloudTrail" },
  { value: "django", label: "Django" },
];
const SOURCE_KEY = "mg_source";
// Pages that read ?source=; the others (uploads, settings) ignore it.
const SOURCE_PAGES = new Set(["dashboard", "detection", "analytics", "storage", "stream", "models"]);
const SourceCtx = createContext({ source: "hdfs", setSource: () => {} });
function useSource() { return useContext(SourceCtx).source; }
function sourceLabel(value) { return SOURCES.find((s) => s.value === value)?.label || value; }

function readStoredSource() {
  try {
    const stored = localStorage.getItem(SOURCE_KEY);
    return SOURCES.some((s) => s.value === stored) ? stored : "hdfs";
  } catch {
    return "hdfs";
  }
}

function useApiData(fetcher, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null, status: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef.current()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null, status: 200 }); })
      .catch((err) => { if (!cancelled) setState({ data: null, loading: false, error: err.message || "Failed to load.", status: err.status ?? null }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// Says what kind of labels a non-HDFS source has, next to its metrics, so a
// rule-based or synthetic F1 is never read as ground truth.
function SourceBadge({ info }) {
  if (!info || info.name === "hdfs") return null;
  const tone = info.label_kind === "ground truth" ? "success" : "warning";
  return <Badge tone={tone}>{info.title} · {info.label_kind} labels</Badge>;
}

function PageLoading() {
  return <div style={{ padding: "60px 0", textAlign: "center", color: C.textFaint, fontSize: 13 }}>Loading…</div>;
}

function PageError({ message, status }) {
  // 404 from a ?source= endpoint means that source's data isn't on this
  // server, which is a setup step, not a failure.
  if (status === 404) {
    return (
      <Card style={{ textAlign: "center", padding: "32px 20px" }}>
        <div style={{ color: C.warning, fontWeight: 600, marginBottom: 6 }}>Not available on this server yet</div>
        <div style={{ color: C.textMd, fontSize: 12.5, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>{message}</div>
      </Card>
    );
  }
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

function Button({ children, variant = "secondary", size = "md", onClick, style, icon: Icon, disabled = false, title }) {
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
    <button disabled={disabled} title={title} style={{ ...base, ...variants[variant], ...style }} onClick={onClick}>
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
    <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader title={title} meta={meta} right={right} />
      {/* flex: 1 lets the chart fill whatever height the grid row actually
          stretched this card to (e.g. to match a taller sibling), instead of
          leaving dead space below a fixed-height plot; minHeight keeps it
          from collapsing in a short row. */}
      <div style={{ flex: 1, minHeight: height }}>{children}</div>
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

function SourcePicker() {
  const { source, setSource } = useContext(SourceCtx);
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textFaint }}>
      Log source
      <select
        value={source}
        onChange={(e) => setSource(e.target.value)}
        aria-label="Log source"
        style={{
          background: C.card, color: C.textHi, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "7px 10px", fontSize: 13, fontFamily: C.sans, cursor: "pointer",
        }}
      >
        {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </label>
  );
}

// Real stream state (it used to be a fixed green "Ingestion Live"): polls the
// newest processor run and says Live only while one is reporting.
function StreamBadge() {
  const [state, setState] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const poll = () => apiGet("/api/stream/status")
      .then((s) => { if (!cancelled) setState(s.live ? { live: true, source: s.source || "hdfs", rate: s.events_per_sec } : { live: false }); })
      .catch(() => { if (!cancelled) setState({ live: false }); });
    poll();
    const timer = setInterval(poll, 10000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);
  const live = state?.live;
  return (
    <div title={live ? `${sourceLabel(state.source)} stream, ${Math.round(state.rate || 0).toLocaleString("en-US")} events/s` : "No stream processor is running"}
      style={{
        display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
        color: live ? C.success : C.textFaint, background: live ? C.successDim : C.card,
        border: `1px solid ${live ? "rgba(16,185,129,0.25)" : C.border}`, padding: "6px 12px", borderRadius: 20,
      }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: live ? C.success : C.textFaint, display: "inline-block" }} />
      {live ? `Stream live · ${sourceLabel(state.source)}` : "Stream idle"}
    </div>
  );
}

function Topbar({ pageTitle, showSource }) {
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
        {showSource && <SourcePicker />}
        <StreamBadge />
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

function blockNoun(info, plural = false) {
  const noun = info?.block_noun || "block";
  const word = plural ? (noun.endsWith("s") ? noun : `${noun}s`) : noun;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// E1: the deployed model's real state from /api/dashboard (healthy, degraded,
// unverified or unavailable), not a fixed "Healthy" badge.
const STATUS_ICON = { success: CheckCircle2, warning: AlertTriangle, danger: AlertTriangle };
const STATUS_BG = { success: C.successDim, warning: C.warningDim, danger: C.dangerDim };
function ModelStatusCard({ status, fpRate }) {
  const tone = status?.tone || "warning";
  const Icon = STATUS_ICON[tone] || AlertTriangle;
  const state = status?.state || "unknown";
  return (
    <Card hoverable>
      <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, background: STATUS_BG[tone] || C.warningDim, color: C[tone] || C.warning }}>
        <Icon size={18} />
      </div>
      <div style={{ fontSize: 12, color: C.textLo, fontWeight: 500, marginBottom: 6 }}>Model Status</div>
      <div style={{ fontSize: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
        {state === "unavailable" ? "Offline" : "Active"}
        <Badge tone={tone} dot={tone === "success"}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }} title={status?.detail}>
        {status?.detail || "No status reported."}
        {fpRate != null && ` · ${fpRate.toFixed(2)}% false positives`}
      </div>
    </Card>
  );
}

function DashboardPage({ onNavigate }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [job, setJob] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState(null);
  // "auto" reports on the most recently uploaded log file; "dataset" goes back
  // to the full deployed dataset.
  const [scope, setScope] = useState("auto");

  const source = useSource();
  const { data, loading, error, status } = useApiData(
    () => apiGet("/api/dashboard", { source, ...(scope === "dataset" ? { scope: "dataset" } : {}) }),
    [refreshKey, scope]
  );

  // Same global retrain job Model Management drives — the backend only ever
  // runs one at a time, so this is a second entry point onto that one job,
  // not an independent scan.
  useEffect(() => {
    if (!job || job.state !== "running") return;
    const iv = setInterval(async () => {
      try {
        const updated = await apiGet(`/api/models/retrain/${job.job_id}`);
        setJob(updated);
        if (updated.state !== "running") {
          setToast({
            title: updated.state === "error" ? "Detection scan failed" : updated.result.promoted ? "New model promoted" : "Candidate not promoted",
            sub: updated.state === "error"
              ? updated.error
              : updated.result.promoted
                ? `New model instance V${updated.result.new_version} beat the deployed one (${updated.result.metric}: ${updated.result.candidate_metric_value.toFixed(4)}) and is now live.`
                : `New candidate scored ${updated.result.metric} ${updated.result.candidate_metric_value.toFixed(4)}, which didn't beat the current ${updated.result.current_metric_value.toFixed(4)} — nothing changed.`,
          });
          setTimeout(() => setToast(null), 6000);
          setRefreshKey((k) => k + 1);
        }
      } catch {
        // transient poll failure — try again on the next tick
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [job]);

  const isRunning = job?.state === "running";
  const elapsed = useElapsedSeconds(job?.started_at, isRunning);

  async function startScan() {
    setConfirmOpen(false);
    try {
      const { job_id } = await apiPost(`/api/models/retrain?source=${source}`);
      setJob({ state: "running", started_at: new Date().toISOString(), job_id, result: null, error: null });
    } catch (err) {
      setToast({ title: "Couldn't start detection scan", sub: err.message });
      setTimeout(() => setToast(null), 4000);
    }
  }

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} status={status} />;

  const { kpis, volume_by_day, severity_mix, model_evolution, recent_activity, date_range, view } = data;
  const onUpload = view?.mode === "upload";

  return (
    <div>
      <PageHeader
        title="Overview"
        badge={<>
          {onUpload ? <Badge tone="warning">Uploaded File</Badge> : <Badge tone="primary">Full Dataset</Badge>}
          <SourceBadge info={data.source} />
        </>}
        sub={onUpload
          ? `Detection results for ${view.upload.name} — ${kpis.total_blocks_analyzed.toLocaleString("en-US")} blocks from ${kpis.total_logs_processed.toLocaleString("en-US")} log lines (${formatDateRange(date_range)})`
          : `Isolation Forest anomaly detection over the ${data.source?.title || "HDFS"} logs, one row per ${data.source?.block_noun || "block"} (${formatDateRange(date_range)})`}
        right={<>
          {onUpload
            ? <Button size="sm" onClick={() => setScope("dataset")}>View Full Dataset</Button>
            : <Button size="sm" onClick={() => setScope("auto")}>View Latest Upload</Button>}
          <Button size="sm" icon={Plus} onClick={() => onNavigate("sources")}>New Log Source</Button>
          <Button size="sm" variant="primary" icon={RefreshCw} onClick={() => setConfirmOpen(true)} disabled={isRunning}>
            {isRunning ? `Training… ${elapsed}s` : "Run Detection Scan"}
          </Button>
        </>}
      />

      <div className="mg-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 18 }}>
        <KpiCard label="Total Logs Processed" value={formatCompact(kpis.total_logs_processed)} icon={FileText} iconBg={C.primaryDim} iconColor={C.primary} />
        <KpiCard label="Anomalies Detected" value={kpis.anomalies_detected.toLocaleString("en-US")} icon={AlertTriangle} iconBg={C.dangerDim} iconColor={C.danger} delta={`${kpis.anomaly_rate_pct.toFixed(2)}% of blocks`} deltaUp={false} />
        <Card hoverable>
          <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, background: "rgba(34,211,238,0.12)", color: C.cyan }}>
            <GitBranch size={18} />
          </div>
          <div style={{ fontSize: 12, color: C.textLo, fontWeight: 500, marginBottom: 6 }}>Current Model Version</div>
          <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 600, letterSpacing: "-.5px" }}>V{kpis.current_version}</div>
          <LineageMini />
        </Card>
        <ModelStatusCard status={kpis.model_status} fpRate={kpis.false_positive_rate_pct} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title={`${blockNoun(data.source, true)} & Anomalies — by Day`} meta={`${formatDateRange(date_range)} · anomalies on the right axis`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volume_by_day} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: C.sans }} />
              {/* Blocks and anomalous blocks share a unit; raw log lines (a different one) stay in the tooltip. */}
              <Bar yAxisId="left" dataKey="blocks" name={blockNoun(data.source, true)} fill="rgba(59,130,246,0.55)" radius={[4,4,0,0]} />
              <Line yAxisId="left" dataKey="logs" name="Log lines" stroke="transparent" dot={false} activeDot={false} legendType="none" />
              <Line yAxisId="right" type="monotone" dataKey="anomalies" name="Anomalous" stroke={C.danger} strokeWidth={2} dot={{ r: 4, fill: C.danger }} activeDot={{ r: 6 }} />
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
          <Stat label="Blocks analyzed" value={kpis.total_blocks_analyzed.toLocaleString("en-US")} />
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

      <EarlyWarningCard />

      {confirmOpen && (
        <div onClick={() => setConfirmOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(5,7,10,0.7)", backdropFilter: "blur(3px)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: "90vw", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.45)", padding: 26 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Run a detection scan?</h3>
            <p style={{ fontSize: 13, color: C.textMd, marginBottom: 18, lineHeight: 1.5 }}>
              Trains a new candidate model instance via a fresh GA optimization pass over the full labeled dataset (~3 minutes),
              then automatically promotes it to <strong style={{ fontFamily: C.mono, color: C.textHi }}>V{kpis.current_version + 1}</strong> only
              if it beats the currently deployed <strong style={{ fontFamily: C.mono, color: C.textHi }}>V{kpis.current_version}</strong>. Otherwise
              the candidate is archived and nothing changes. This is the same retrain cycle available from Model Management.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={startScan}>Start Scan</Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast title={toast.title} sub={toast.sub} />}
    </div>
  );
}

function formatDuration(seconds) {
  if (seconds == null) return "—";
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)} h`;
  if (seconds >= 60) return `${(seconds / 60).toFixed(1)} min`;
  return `${Math.round(seconds)} s`;
}

// Held-out early-warning results per prefix length k (/api/early-warning/summary).
// Fetched on its own so a missing report only empties this card, not the dashboard.
function EarlyWarningCard() {
  const source = useSource();
  const { data, loading, error } = useApiData(() => apiGet("/api/early-warning/summary", { source }), []);
  const bestK = data?.trade_off_in_progress?.best_k ?? data?.trade_off?.best_k;
  return (
    <Card padded={false} style={{ marginTop: 18 }}>
      <div style={{ padding: "20px 22px 0" }}>
        <CardHeader
          title="Early Warning"
          meta={data ? `held-out test blocks · lead time = how far ahead of the block's last event a correct alert fires` : ""}
        />
      </div>
      {loading ? <PageLoading /> : error ? (
        <div style={{ padding: "0 22px 22px", color: C.textFaint, fontSize: 12.5 }}>{error}</div>
      ) : (
        <Table head={["k (first events)", "Precision", "Recall", "F1", "Lead, all true alerts", "Still running: F1", "Lead share", "Median lead", "Mean lead"]}>
          {data.table.map((row) => {
            const running = row.in_progress;
            return (
              <Row key={row.k}>
                <Td mono title>
                  {row.k}{" "}
                  {row.k === bestK && <Badge tone="success">Best trade-off</Badge>}
                </Td>
                <Td mono>{row.precision.toFixed(3)}</Td>
                <Td mono>{row.recall.toFixed(3)}</Td>
                <Td mono>{row.f1.toFixed(3)}</Td>
                <Td mono>{pct(row.mean_lead_over_true_alerts)} of events</Td>
                <Td mono>{running ? running.f1.toFixed(3) : "—"}</Td>
                <Td mono>{running ? `${pct(running.mean_lead_over_true_alerts)} of events` : "—"}</Td>
                <Td mono>
                  <span title={running?.median_lead_seconds != null ? `${Math.round(running.median_lead_seconds).toLocaleString("en-US")} s` : undefined}>
                    {formatDuration(running?.median_lead_seconds)}
                  </span>
                </Td>
                <Td mono>
                  <span title={running?.mean_lead_seconds != null ? `${Math.round(running.mean_lead_seconds).toLocaleString("en-US")} s` : undefined}>
                    {formatDuration(running?.mean_lead_seconds)}
                  </span>
                </Td>
              </Row>
            );
          })}
        </Table>
      )}
      {data && (
        <div style={{ padding: "12px 22px 18px", fontSize: 11.5, color: C.textFaint, lineHeight: 1.5 }}>
          "Still running" counts only blocks with more than k events, where an alert can come before the block ends; the
          lead columns there cover correct alerts only. Seconds are log time from the k-th event to the block's last event.
        </div>
      )}
    </Card>
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

function PageHeader({ title, sub, right, badge }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.3px" }}>{title}</div>
          {badge}
        </div>
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
  const [detailUpload, setDetailUpload] = useState(null);

  const { data: history, loading, error } = useApiData(() => apiGet("/api/sources/uploads"), [refreshKey]);
  const { data: connectorData } = useApiData(() => apiGet("/api/sources/connectors"), []);
  const rows = history?.uploads || [];
  const connectors = connectorData?.connectors || [];
  // Which log type an upload is parsed and scored as; the list (and whether
  // each has a trained model) comes from the backend.
  const logSources = connectorData?.log_sources || [];
  const [logSource, setLogSource] = useState("hdfs");
  const sourceLabel = Object.fromEntries(logSources.map((s) => [s.value, s.label]));

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
      await apiUpload("/api/sources/upload", file, (pct) => setUpload({ name: file.name, pct }), { source: logSource });
      setToast({ title: "Upload complete", sub: `${file.name} is queued for analysis as ${sourceLabel[logSource] || logSource}` });
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
        right={<Button size="sm" icon={Plus} disabled title="Not implemented yet — only manual file upload is available">Connect Source</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 18, marginBottom: 18 }}>
        <Card>
          <CardHeader title="Upload Log File" />
          {logSources.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.textLo, fontWeight: 500, marginBottom: 6 }}>Log source</div>
              <select
                value={logSource}
                onChange={(e) => setLogSource(e.target.value)}
                style={{
                  width: "100%", background: C.bgRaised, color: C.textHi, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: "8px 10px", fontSize: 13, fontFamily: C.sans, cursor: "pointer",
                }}
              >
                {logSources.map((s) => (
                  <option key={s.value} value={s.value} disabled={!s.trained}>
                    {s.label}{s.trained ? "" : " — no trained model yet"}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 14 }}>.log, .json, .json.gz, .csv, .txt — up to 500MB</div>
            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>Browse Files</Button>
            <input ref={fileRef} type="file" accept=".log,.json,.gz,.csv,.txt" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
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
          <CardHeader title="Connectors" meta="Live status from the server" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {connectors.map((c) => {
              const Icon = CONNECTOR_ICONS[c.icon] || Database;
              const badge = CONNECTOR_BADGE[c.status] || CONNECTOR_BADGE.future;
              return (
                <div key={c.name} title={c.detail} style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", border: `1px solid ${C.border}`,
                  borderRadius: 8, background: C.bgRaised, opacity: c.status === "future" ? 0.6 : 1,
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c.enabled ? C.primaryDim : C.bg, color: c.enabled ? C.primary : C.textFaint }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: c.enabled ? C.textHi : C.textMd }}>{c.name}</div>
                      <Badge tone={badge.tone} dot={c.status === "live" || c.status === "active"}>{badge.label}</Badge>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 4, lineHeight: 1.45, wordBreak: "break-word" }}>{c.detail}</div>
                  </div>
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
          <Table head={["File Name", "Source", "Log Type", "Size", "Records", "Uploaded", "Status", "Anomalies", ""]}>
            {rows.map((u) => {
              const hasResults = u.status === "processed" && u.blocks_analyzed != null && u.blocks_analyzed > 0;
              return (
                <Row key={u.id}>
                  <Td title>
                    {u.name}
                    {u.status === "failed" && u.error && (
                      <div style={{ fontSize: 11, fontWeight: 400, color: C.danger, marginTop: 3, whiteSpace: "normal", maxWidth: 340 }}>{u.error}</div>
                    )}
                  </Td>
                  <Td>{u.source}</Td>
                  <Td>{sourceLabel[u.log_source] || u.log_source}</Td>
                  <Td mono>{formatBytes(u.size_bytes)}</Td>
                  <Td mono>
                    <span title={u.total_lines != null ? `${u.total_lines.toLocaleString("en-US")} lines in file` : undefined}>
                      {u.records != null ? u.records.toLocaleString("en-US") : "—"}
                    </span>
                  </Td>
                  <Td mono>{formatTimestamp(u.uploaded_at)}</Td>
                  <Td>{u.status === "processed" ? <Badge tone="success" dot>Processed</Badge> : u.status === "processing" ? <Badge tone="warning">Processing</Badge> : <Badge tone="danger">Failed</Badge>}</Td>
                  <Td mono>
                    {hasResults ? (
                      <span title={`Scored against V${u.model_version} — ${u.blocks_analyzed.toLocaleString("en-US")} blocks analyzed`}>
                        <span style={{ color: u.anomalies_detected > 0 ? C.danger : C.success, fontWeight: 600 }}>
                          {u.anomalies_detected.toLocaleString("en-US")}
                        </span>
                        <span style={{ color: C.textFaint }}> / {u.blocks_analyzed.toLocaleString("en-US")} ({u.anomaly_rate_pct}%)</span>
                      </span>
                    ) : u.status === "processed" && u.results_available === false ? (
                      <span title={u.results_note} style={{ color: C.textFaint, borderBottom: `1px dotted ${C.textFaint}`, cursor: "help" }}>not on this server</span>
                    ) : "—"}
                  </Td>
                  <Td>
                    {hasResults ? (
                      <Button variant="ghost" size="sm" onClick={() => setDetailUpload(u)}>View</Button>
                    ) : (
                      <MoreVertical size={14} color={C.textFaint} />
                    )}
                  </Td>
                </Row>
              );
            })}
          </Table>
        )}
      </Card>

      {toast && <Toast title={toast.title} sub={toast.sub} />}
      {detailUpload && <UploadDetectionsModal upload={detailUpload} onClose={() => setDetailUpload(null)} />}
    </div>
  );
}

function UploadDetectionsModal({ upload, onClose }) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, loading, error } = useApiData(
    () => apiGet(`/api/sources/uploads/${upload.id}/detections`, { page, limit }),
    [upload.id, page]
  );
  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(5,7,10,0.7)", backdropFilter: "blur(3px)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 640, maxWidth: "94vw", maxHeight: "82vh", overflow: "auto",
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        boxShadow: "0 12px 40px rgba(0,0,0,.45)", padding: 26,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Detection results</h3>
              <Badge tone="primary">This Upload</Badge>
            </div>
            <div style={{ fontSize: 12.5, color: C.textFaint, fontFamily: C.mono }}>{upload.name}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 4 }}>
          This file's own scan. Blocks the dataset hadn't seen before are also counted in the Overview and Detection Results totals; blocks it already had are not counted twice.
        </div>

        <div style={{ display: "flex", gap: 20, margin: "18px 0", fontSize: 12.5, color: C.textMd }}>
          <span>Blocks analyzed: <strong style={{ color: C.textHi, fontFamily: C.mono }}>{upload.blocks_analyzed.toLocaleString("en-US")}</strong></span>
          <span>Anomalies: <strong style={{ color: C.danger, fontFamily: C.mono }}>{upload.anomalies_detected.toLocaleString("en-US")}</strong></span>
          <span>Rate: <strong style={{ color: C.textHi, fontFamily: C.mono }}>{upload.anomaly_rate_pct}%</strong></span>
          <span>Model: <strong style={{ color: C.textHi, fontFamily: C.mono }}>V{upload.model_version}</strong></span>
        </div>

        {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <Table head={["Block ID", "Prediction", "Anomaly Score"]}>
          {(data?.results || []).map((r) => (
            <Row key={r.block_id}>
              <Td title mono>{r.block_id}</Td>
              <Td>{r.predicted_label === "Anomaly" ? <Badge tone="danger" dot>Anomaly</Badge> : <Badge tone="neutral">Normal</Badge>}</Td>
              <Td mono>{r.anomaly_score.toFixed(4)}</Td>
            </Row>
          ))}
        </Table>
        {loading && <div style={{ padding: "20px 0" }}><PageLoading /></div>}

        {data && data.total > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <span style={{ fontSize: 12, color: C.textFaint }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total.toLocaleString("en-US")}, sorted by score
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: page <= 1 ? 0.4 : 1 }}>Prev</Button>
              <span style={{ fontSize: 12, color: C.textMd, fontFamily: C.mono, padding: "6px 4px" }}>Page {page} / {totalPages}</span>
              <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ opacity: page >= totalPages ? 0.4 : 1 }}>Next</Button>
            </div>
          </div>
        )}
      </div>
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

  const source = useSource();
  const { data: summary } = useApiData(() => apiGet("/api/detections/summary", { source }), []);
  const { data, loading, error, status } = useApiData(
    () => apiGet("/api/detections", { source, search: debouncedSearch, severity: sev, page, limit }),
    [debouncedSearch, sev, page]
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div>
      <PageHeader title="Detection Results"
        badge={<><Badge tone="primary">{source === "hdfs" ? "All Ingested Data" : sourceLabel(source)}</Badge><SourceBadge info={summary?.source} /></>}
        sub={source === "hdfs"
          ? "Block-level anomaly classification from the currently deployed Isolation Forest model — the base dataset plus every block ingested through Log Sources"
          : `Anomaly classification per ${summary?.source?.block_noun || "block"} from ${sourceLabel(source)}'s deployed Isolation Forest model`}
        right={<Button size="sm" icon={Download} onClick={() => apiDownload("/api/detections/export", { source, severity: sev, search: debouncedSearch }, `${source}_detections.csv`).catch((e) => alert(e.message))}>Export CSV</Button>} />

      <div className="mg-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 18 }}>
        <KpiCard label="Total Blocks Analyzed" value={summary ? summary.total_analyzed.toLocaleString("en-US") : "—"} />
        <KpiCard label="Normal Blocks" value={summary ? summary.normal_count.toLocaleString("en-US") : "—"} valueColor={C.success}
          footer={summary && <div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }}>{(summary.normal_count / summary.total_analyzed * 100).toFixed(2)}% of total</div>} />
        <KpiCard label="Anomalous Blocks" value={summary ? summary.anomalous_count.toLocaleString("en-US") : "—"} valueColor={C.danger}
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
        {error && (status === 404
          ? <div style={{ padding: "0 22px 16px" }}><PageError message={error} status={404} /></div>
          : <div style={{ padding: "0 22px 16px", color: C.danger, fontSize: 13 }}>{error}</div>)}
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
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total.toLocaleString("en-US")}
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
  const source = useSource();
  const { data, loading, error, status } = useApiData(() => apiGet("/api/analytics", { source }), []);

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} status={status} />;

  const {
    component_distribution, event_type_distribution, log_level_distribution,
    hour_of_day_distribution, anomalies_by_day, anomalies_by_component_by_day,
    top_components, date_range,
  } = data;

  return (
    <div>
      <PageHeader title="Analytics" badge={<SourceBadge info={data.source} />}
        sub={`Real distributions from the ${data.source?.title || "HDFS"} logs (${formatDateRange(date_range)})`} />

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

const TIMELINE_COLOR = { success: C.success, danger: C.danger, warning: C.warning, primary: C.primary };

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

  const source = useSource();
  const { data, loading, error, status } = useApiData(() => apiGet("/api/models", { source }), [refreshKey]);

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
      const { job_id } = await apiPost(`/api/models/retrain?source=${source}`);
      setJob({ state: "running", started_at: new Date().toISOString(), job_id, result: null, error: null });
    } catch (err) {
      setToast({ title: "Couldn't start retrain", sub: err.message });
      setTimeout(() => setToast(null), 4000);
    }
  }

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} status={status} />;

  const { current, history_table, timeline } = data;
  const isRunning = job?.state === "running";
  // The version before the live one; rows after it (rolled-back versions) are not "previous".
  const activeIndex = history_table.findIndex((r) => r.status === "active");
  const previous = activeIndex > 0 ? history_table[activeIndex - 1] : null;
  // The newest promote/reject decision; refits (primary) and manual rollbacks (warning) are not retrain outcomes.
  const lastOutcome = timeline.find((t) => t.tone === "success" || t.tone === "danger");

  return (
    <div>
      <PageHeader title="Model Management" badge={<SourceBadge info={data.source} />}
        sub={`${data.source?.title || "HDFS"}: retrains via genetic-algorithm optimization and promotes a candidate only if it beats the currently deployed model`}
        right={<Button variant="primary" size="sm" onClick={() => setModalOpen(true)} disabled={isRunning}>{isRunning ? "Retrain running…" : "Run Retrain Cycle"}</Button>} />

      {data.evaluation && <HeldOutCard evaluation={data.evaluation} source={data.source} />}

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
                <Td>{d.status === "active" ? <Badge tone="success" dot>Active</Badge>
                  : d.status === "rolled_back" ? <Badge tone="warning">Rolled back</Badge>
                  : <Badge tone="neutral">Retired</Badge>}</Td>
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

// Held-out numbers for the deployed model and every caveat on its labels.
// OpenStack shows both label views side by side (B5): F1 against the by-run
// labels, and how many of the dataset's documented faulty instances it catches.
function HeldOutCard({ evaluation: ev, source }) {
  const f = (v) => (v == null ? "—" : v.toFixed(4));
  const stability = ev.stability?.versions;
  const gt = ev.ground_truth_check;
  return (
    <Card style={{ marginBottom: 18 }}>
      <CardHeader title="Held-out Evaluation" meta={ev.protocol || ""}
        right={source?.name !== "hdfs" && <Badge tone="warning">{ev.label_kind || source?.label_kind} labels</Badge>} />
      <div style={{ display: "grid", gridTemplateColumns: gt ? "repeat(4,1fr)" : "repeat(3,1fr)", gap: 18, marginTop: 6 }}>
        <MetricBlock label="Deployed model · test F1" value={f(ev.deployed_test_f1)} color={C.success} />
        {ev.v1_test_f1 != null
          ? <MetricBlock label="V1 baseline · test F1" value={f(ev.v1_test_f1)} />
          : stability && <MetricBlock label="Test F1 over 5 splits" value={`${stability.V2?.test_f1_mean?.toFixed(3) ?? "—"} ± ${stability.V2?.test_f1_std?.toFixed(3) ?? "—"}`} />}
        <MetricBlock label="Test set" value={ev.test_blocks != null ? `${ev.test_blocks.toLocaleString("en-US")} (${(ev.test_anomalies ?? 0).toLocaleString("en-US")} anomalous)` : "—"} small />
        {gt && <MetricBlock label="Documented faulty instances" value={gt.caught} color={C.warning} small />}
      </div>
      {ev.deployed_caught && <div style={{ fontSize: 12.5, color: C.textMd, marginTop: 12 }}>Deployed model {ev.deployed_caught} held-out anomalies{ev.v1_caught ? ` (V1 ${ev.v1_caught.replace("caught ", "")})` : ""}.</div>}
      {gt?.note && <div style={{ fontSize: 12, color: C.textFaint, marginTop: 6 }}>{gt.note}</div>}
      {ev.label_description && <div style={{ fontSize: 12, color: C.textFaint, marginTop: 6 }}>Labels: {ev.label_description}</div>}
      {(ev.warnings || []).map((w) => (
        <div key={w} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: C.warning, marginTop: 8 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{w}</span>
        </div>
      ))}
    </Card>
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

// ---------------------------------------------------------------------------
// Smart Storage (/api/storage/*)
// ---------------------------------------------------------------------------

const TIERS = ["HOT", "WARM", "COLD"];
const TIER_COLOR = { HOT: C.danger, WARM: C.warning, COLD: C.primary };
// Display names for the report's baseline keys; every number comes from the API.
const POLICY_LABELS = {
  ga_policy: "GA policy",
  keep_all: "Keep all",
  keep_flagged_only: "Flagged only",
  top_k_percent_tuned: "Top-k% (tuned)",
  top_k_percent_same_savings: "Top-k% (same saving)",
  random_sampling_same_savings: "Random (same saving)",
};

function pct(fraction, digits = 1) {
  return fraction == null ? "—" : `${(fraction * 100).toFixed(digits)}%`;
}

function shareOf(part, whole) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}

function Slider({ label, value, min, max, step, onChange, format = (v) => v.toFixed(3), hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: C.textMd, fontWeight: 500 }} title={hint}>{label}</span>
        <span style={{ fontFamily: C.mono, color: C.textHi }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.primary, cursor: "pointer" }}
      />
    </div>
  );
}

function policyParams(policy, config) {
  return {
    t_hot: policy.thresholds.hot,
    t_warm: policy.thresholds.warm,
    summary_fraction: policy.summary_fraction,
    warm_credit: config.warm_credit,
    // Reports written before proportional WARM credit have no reference share.
    ...(config.warm_ref_fraction != null && { warm_ref_fraction: config.warm_ref_fraction }),
    weights: { ...policy.weights },
    split: "holdout",
    // The Settings page's saved target, else the policy's own.
    ...(readRetentionTarget() != null && { retention_target: readRetentionTarget() }),
  };
}

function SmartStoragePage() {
  const source = useSource();
  const { data, loading, error, status } = useApiData(() => apiGet("/api/storage/summary", { source }), []);
  const [params, setParams] = useState(null);
  const [sim, setSim] = useState(null);
  const [simError, setSimError] = useState(null);
  const [simBusy, setSimBusy] = useState(false);

  useEffect(() => {
    if (data && !params) setParams(policyParams(data.policy, data.config));
  }, [data, params]);

  // Debounced so dragging a slider sends one request when it settles, not one per pixel.
  useEffect(() => {
    if (!params) return;
    let cancelled = false;
    setSimBusy(true);
    const timer = setTimeout(async () => {
      try {
        const result = await apiPost(`/api/storage/simulate?source=${source}`, params);
        if (!cancelled) { setSim(result); setSimError(null); }
      } catch (err) {
        if (!cancelled) setSimError(err.message);
      } finally {
        if (!cancelled) setSimBusy(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [params]);

  // Memoized on the report: simulator updates re-render this page, and fresh
  // arrays on every render would make Recharts re-lay-out the bar charts.
  const tierData = useMemo(() => data && TIERS.map((tier) => ({
    tier,
    blocks: shareOf(data.holdout.tier_counts[tier], data.holdout.n_blocks),
    lines: shareOf(data.holdout.tier_lines[tier], data.holdout.kept_lines),
  })), [data]);
  const comparisonRows = useMemo(() => (data?.holdout_comparison || []).map((row) => ({
    name: POLICY_LABELS[row.name] || row.name,
    saved: Math.round(row.clean.storage_saved_pct * 10) / 10,
    retention: Math.round(row.clean.weighted_retention * 1000) / 10,
    meets: row.clean.meets_retention_target,
  })), [data]);

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} status={status} />;

  const h = data.holdout;
  const target = data.config.retention_target;
  const policy = data.policy;

  const set = (patch) => setParams((p) => {
    const next = { ...p, ...patch };
    // The policy requires t_warm < t_hot; keep the warm slider below the hot one.
    if (next.t_warm >= next.t_hot) next.t_warm = Math.max(0, Math.round((next.t_hot - 0.005) * 1000) / 1000);
    return next;
  });
  const setWeight = (name, value) => setParams((p) => ({ ...p, weights: { ...p.weights, [name]: value } }));
  const o = sim?.outcome;

  return (
    <div>
      <PageHeader
        title="Smart Storage"
        badge={<>{data.stale ? <Badge tone="warning">Stale — re-run the optimizer</Badge> : <Badge tone="primary">Held-out Blocks</Badge>}<SourceBadge info={data.source} /></>}
        sub={`GA-tuned retention policy, tuned on ${data.split.tune.blocks.toLocaleString("en-US")} blocks and measured on ${data.split.holdout.blocks.toLocaleString("en-US")} held-out ones`}
      />

      <div className="mg-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 18 }}>
        <KpiCard label="Storage Saved" value={`${h.storage_saved_pct.toFixed(1)}%`} icon={HardDrive} iconBg={C.primaryDim} iconColor={C.primary}
          footer={<div style={{ fontSize: 12, color: C.textFaint, marginTop: 10 }}>{h.kept_lines.toLocaleString("en-US")} of {h.total_lines.toLocaleString("en-US")} lines kept</div>} />
        <KpiCard label="Anomaly Retention (weighted)" value={pct(h.weighted_retention)} icon={ShieldAlert}
          iconBg={h.meets_retention_target ? C.successDim : C.warningDim} iconColor={h.meets_retention_target ? C.success : C.warning}
          footer={<div style={{ fontSize: 12, color: C.textFaint, marginTop: 10 }}>target {pct(target, 0)} — {h.meets_retention_target ? "met" : "not met"}</div>} />
        <KpiCard label="Full Retention (HOT only)" value={pct(h.full_retention)} icon={CheckCircle2} iconBg={C.successDim} iconColor={C.success}
          footer={<div style={{ fontSize: 12, color: C.textFaint, marginTop: 10 }}>{h.tier_anomalies.HOT.toLocaleString("en-US")} of {h.n_anomalies.toLocaleString("en-US")} anomalies kept in full</div>} />
        <KpiCard label="Coverage (HOT + WARM)" value={pct(h.coverage)} icon={Activity} iconBg="rgba(34,211,238,0.12)" iconColor={C.cyan}
          footer={<div style={{ fontSize: 12, color: C.textFaint, marginTop: 10 }}>
            {data.config.warm_ref_fraction != null
              ? `WARM credit up to ${data.config.warm_credit}, full at ${pct(data.config.warm_ref_fraction, 0)} of a block kept`
              : `WARM credit ${data.config.warm_credit} (flat)`}
          </div>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Tier Split" meta="share of held-out blocks vs. share of lines kept">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tierData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="tier" stroke={C.textFaint} fontSize={11} />
              <YAxis stroke={C.textFaint} fontSize={11} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="blocks" name="Blocks" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {tierData.map((d) => <Cell key={d.tier} fill={TIER_COLOR[d.tier]} />)}
              </Bar>
              <Bar dataKey="lines" name="Lines kept" fill={C.textFaint} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Policy vs. Baselines" meta="held-out blocks; dashed line = retention target">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonRows} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="name" stroke={C.textFaint} fontSize={10.5} interval={0} />
              <YAxis stroke={C.textFaint} fontSize={11} unit="%" domain={[0, 100]} />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={target * 100} stroke={C.success} strokeDasharray="4 4" />
              <Bar dataKey="saved" name="Storage saved" fill={C.primary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="retention" name="Weighted retention" fill={C.cyan} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18 }}>
        <Card padded={false}>
          <div style={{ padding: "20px 22px 0" }}>
            <CardHeader title="Learned Policy" meta={`${data.model.kind === "tune_half_refit" ? "tune-half refit of" : "scored by"} model V${data.model.version}`} />
          </div>
          <Table head={["Parameter", "Value"]}>
            {[
              ["Weight · anomaly score", policy.weights.anomaly_score.toFixed(3)],
              ["Weight · event frequency", policy.weights.event_frequency.toFixed(3)],
              ["Weight · block size", policy.weights.block_size.toFixed(3)],
              ["Fixed error weight", policy.error_weight.toFixed(2)],
              ["HOT threshold", policy.thresholds.hot.toFixed(4)],
              ["WARM threshold", policy.thresholds.warm.toFixed(4)],
              ["WARM summary fraction", policy.summary_fraction.toFixed(4)],
              ["WARM lines kept / block", data.warm_tier?.mean_lines_per_warm_block != null
                ? `${data.warm_tier.mean_lines_per_warm_block.toFixed(1)} of ${data.warm_tier.mean_event_frequency_of_warm_blocks.toFixed(1)}`
                : "—"],
              ["WARM credit earned / anomaly", data.warm_tier?.mean_credit_per_warm_anomaly != null
                ? data.warm_tier.mean_credit_per_warm_anomaly.toFixed(3)
                : "—"],
              ["Retention target", pct(target, 0)],
              ["GA generations", data.ga_summary?.generations_completed ?? "—"],
            ].map(([k, v]) => (
              <Row key={k}><Td title>{k}</Td><Td mono>{v}</Td></Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHeader
            title="Simulate a Policy"
            right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {simBusy && <span style={{ fontSize: 11.5, color: C.textFaint }}>updating…</span>}
              <PillTabs options={[{ value: "holdout", label: "Holdout" }, { value: "tune", label: "Tune" }, { value: "all", label: "All" }]}
                active={params?.split} onChange={(split) => set({ split })} />
              <Button size="sm" variant="ghost" onClick={() => setParams(policyParams(data.policy, data.config))}>Reset</Button>
            </div>}
          />
          {params && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 26px" }}>
              <div>
                <Slider label="HOT threshold" value={params.t_hot} min={0.01} max={1} step={0.005} onChange={(v) => set({ t_hot: v })} />
                <Slider label="WARM threshold" value={params.t_warm} min={0} max={Math.max(0, params.t_hot - 0.005)} step={0.005} onChange={(v) => set({ t_warm: v })} />
                <Slider label="WARM summary fraction" value={params.summary_fraction} min={0.01} max={1} step={0.01} onChange={(v) => set({ summary_fraction: v })} />
                <Slider label="WARM retention credit (max)" value={params.warm_credit} min={0} max={1} step={0.05} onChange={(v) => set({ warm_credit: v })} format={(v) => v.toFixed(2)} />
                {params.warm_ref_fraction != null && (
                  <Slider label="Full credit at share kept" value={params.warm_ref_fraction} min={0.05} max={1} step={0.05} onChange={(v) => set({ warm_ref_fraction: v })} format={(v) => `${Math.round(v * 100)}%`} hint="Thinner summaries earn proportionally less" />
                )}
              </div>
              <div>
                <Slider label="Weight · anomaly score" value={params.weights.anomaly_score} min={0} max={1} step={0.01} onChange={(v) => setWeight("anomaly_score", v)} format={(v) => v.toFixed(2)} />
                <Slider label="Weight · event frequency" value={params.weights.event_frequency} min={0} max={1} step={0.01} onChange={(v) => setWeight("event_frequency", v)} format={(v) => v.toFixed(2)} />
                <Slider label="Weight · block size" value={params.weights.block_size} min={0} max={1} step={0.01} onChange={(v) => setWeight("block_size", v)} format={(v) => v.toFixed(2)} hint="Weights are rescaled to sum to 1" />
              </div>
            </div>
          )}
          {simError ? (
            <div style={{ color: C.danger, fontSize: 12.5, marginTop: 6 }}>{simError}</div>
          ) : o && (
            <div style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 14, marginTop: 4 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                <Stat label="Storage saved" value={`${o.storage_saved_pct.toFixed(1)}%`} color={C.primary} />
                <Stat label="Weighted retention" value={pct(o.weighted_retention)} color={sim.meets_retention_target ? C.success : C.warning} />
                <Stat label="Full retention" value={pct(o.full_retention)} />
                <Stat label="Coverage" value={pct(o.coverage)} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                {sim.meets_retention_target ? <Badge tone="success" dot>Meets {pct(sim.retention_target, 0)} target</Badge> : <Badge tone="warning">Below {pct(sim.retention_target, 0)} target</Badge>}
                {TIERS.map((t) => (
                  <Badge key={t} tone="neutral">{t} {o.tier_counts[t].toLocaleString("en-US")}</Badge>
                ))}
                <span style={{ fontSize: 11.5, color: C.textFaint }}>on {o.n_blocks.toLocaleString("en-US")} {sim.split} blocks</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Stream (/api/stream/*)
// ---------------------------------------------------------------------------

const STREAM_POLL_MS = 2000;
const ALERTS_POLL_MS = 4000;
const RATE_HISTORY = 60;

function LiveStreamPage() {
  const source = useSource();
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [series, setSeries] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [alertType, setAlertType] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const s = await apiGet("/api/stream/status", { source });
        if (cancelled) return;
        setStatus(s);
        setStatusError(null);
        const stamp = new Date().toLocaleTimeString("en-US", { hour12: false });
        setSeries((prev) => [...prev, { t: stamp, eps: s.live ? s.events_per_sec : 0 }].slice(-RATE_HISTORY));
      } catch (err) {
        if (!cancelled) setStatusError(err);
      }
    }
    tick();
    const iv = setInterval(tick, STREAM_POLL_MS);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const data = await apiGet("/api/stream/alerts", { source, limit: 50, type: alertType === "all" ? undefined : alertType });
        if (!cancelled) setAlerts(data);
      } catch {
        // keep the last good list; the status card already reports outages
      }
    }
    tick();
    const iv = setInterval(tick, ALERTS_POLL_MS);
    return () => { cancelled = true; clearInterval(iv); };
  }, [alertType]);

  if (!status && !statusError) return <PageLoading />;
  if (!status && statusError) {
    return (
      <div>
        <PageHeader title="Live Stream" sub="Kafka processor: early warnings, block verdicts and storage decisions as logs arrive" />
        {statusError.status === 404 ? (
          <Card style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No stream processor has reported yet</div>
            <div style={{ color: C.textFaint, fontSize: 12.5 }}>{statusError.message} See docs/streaming_guide.md for the full start-up sequence.</div>
          </Card>
        ) : <PageError message={statusError.message} />}
      </div>
    );
  }

  const s = status;
  const items = alerts?.items || [];

  return (
    <div>
      <PageHeader
        title="Live Stream"
        badge={s.live ? <Badge tone="success" dot>Live</Badge> : <Badge tone="neutral">Stopped</Badge>}
        sub={`Run ${s.run_id} — log time ${formatTimestamp(s.log_time_watermark)}, alerts at k = ${s.ks.join(", ")} events, updated ${s.seconds_since_update}s ago`}
      />

      <div className="mg-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 18 }}>
        <KpiCard label="Events / sec" value={s.events_per_sec.toLocaleString("en-US")} icon={Zap} iconBg={C.primaryDim} iconColor={C.primary}
          footer={<div style={{ fontSize: 12, color: C.textFaint, marginTop: 10 }}>{s.counts.lines_received.toLocaleString("en-US")} lines received</div>} />
        <KpiCard label="Blocks in Flight" value={s.blocks_in_flight.toLocaleString("en-US")} icon={Radio} iconBg="rgba(34,211,238,0.12)" iconColor={C.cyan}
          footer={<div style={{ fontSize: 12, color: C.textFaint, marginTop: 10 }}>{s.storage.blocks_decided.toLocaleString("en-US")} finalized</div>} />
        <KpiCard label="Alerts" value={s.alerts.total.toLocaleString("en-US")} icon={AlertTriangle} iconBg={C.dangerDim} iconColor={C.danger}
          footer={<div style={{ fontSize: 12, color: C.textFaint, marginTop: 10 }}>{s.alerts.early_warning.toLocaleString("en-US")} early warning · {s.alerts.block_anomaly.toLocaleString("en-US")} block anomaly</div>} />
        <KpiCard label="Storage Saved So Far" value={`${s.storage.storage_saved_pct.toFixed(1)}%`} icon={HardDrive} iconBg={C.successDim} iconColor={C.success}
          footer={<div style={{ fontSize: 12, color: C.textFaint, marginTop: 10 }}>{s.storage.lines_kept.toLocaleString("en-US")} of {s.storage.lines_seen.toLocaleString("en-US")} lines kept</div>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Events per Second" meta={`last ${series.length} polls (every ${STREAM_POLL_MS / 1000}s) since this page opened`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
              <defs>
                <linearGradient id="epsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="t" stroke={C.textFaint} fontSize={10.5} minTickGap={28} />
              <YAxis stroke={C.textFaint} fontSize={11} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${v.toLocaleString("en-US")}/s`, "events"]} />
              <Area type="monotone" dataKey="eps" stroke={C.primary} fill="url(#epsFill)" strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader title="Storage Decisions" meta="finalized blocks by tier" />
          {TIERS.map((tier) => {
            const n = s.storage.tier_counts[tier] || 0;
            return (
              <div key={tier} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: C.textMd, fontWeight: 500 }}>{tier}</span>
                  <span style={{ fontFamily: C.mono, color: C.textFaint }}>{n.toLocaleString("en-US")}</span>
                </div>
                <ProgressBar pct={shareOf(n, s.storage.blocks_decided)} color={TIER_COLOR[tier]} />
              </div>
            );
          })}
          <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 6, lineHeight: 1.5 }}>
            Finalized by timeout: {(s.finalize_reasons.timeout || 0).toLocaleString("en-US")} · at end of stream: {(s.finalize_reasons.end_of_stream || 0).toLocaleString("en-US")}
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div style={{ padding: "20px 22px 0" }}>
          <CardHeader
            title="Alerts Feed"
            right={<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 11.5, color: C.textFaint }}>{alerts ? `${alerts.total.toLocaleString("en-US")} in this run` : ""}</span>
              <PillTabs options={[{ value: "all", label: "All" }, { value: "early_warning", label: "Early warning" }, { value: "block_anomaly", label: "Block anomaly" }]}
                active={alertType} onChange={setAlertType} />
            </div>}
          />
        </div>
        {items.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center", color: C.textFaint, fontSize: 13 }}>No alerts in this run yet.</div>
        ) : (
          <Table head={["Type", "Block", "Score", "Events Seen", "Lead Time", "Log Time", "Detected"]}>
            {items.map((a) => (
              <Row key={a.id}>
                <Td>{a.type === "early_warning" ? <Badge tone="warning">Early warning · k={a.k}</Badge> : <Badge tone="danger">Block anomaly</Badge>}</Td>
                <Td mono title>{a.block_id}</Td>
                <Td mono>{a.score.toFixed(4)}{a.threshold != null && <span style={{ color: C.textFaint }}> ≥ {a.threshold.toFixed(4)}</span>}</Td>
                <Td mono>{a.events_total != null ? `${a.events_seen} of ${a.events_total}` : a.events_seen}</Td>
                <Td mono>
                  {a.type === "early_warning"
                    ? (a.lead_fraction != null
                      ? <span title="Share of the block's events still to come when the alert fired">{pct(a.lead_fraction)} ahead</span>
                      : <span style={{ color: C.textFaint }}>block still running</span>)
                    : a.early_warning_k != null
                      ? <span style={{ color: C.textFaint }}>warned at k={a.early_warning_k}</span>
                      : a.finalize_reason === "end_of_stream"
                        ? <span style={{ color: C.textFaint }} title="Forced out when the topic went quiet; may be cut off mid-life">end of stream</span>
                        : "—"}
                </Td>
                <Td mono>{formatTimestamp(a.event_time)}</Td>
                <Td mono>{formatTimestamp(a.detected_at)}</Td>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

const RETENTION_KEY = "mg_retention_target";

function readRetentionTarget() {
  try {
    const value = parseFloat(localStorage.getItem(RETENTION_KEY));
    return value >= 0.5 && value <= 1 ? value : null;
  } catch {
    return null;
  }
}

function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: C.textLo, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

const inputStyle = {
  width: "100%", background: C.bgRaised, color: C.textHi, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: "9px 12px", fontSize: 13, fontFamily: C.sans,
};

function SettingsPage() {
  const { source, setSource } = useContext(SourceCtx);
  const { data: me, error: meError } = useApiData(() => apiGet("/api/auth/me"), []);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwState, setPwState] = useState(null); // { ok, message }
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(() => readRetentionTarget() ?? 0.95);
  const [saved, setSaved] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    if (next !== confirm) { setPwState({ ok: false, message: "The new passwords don't match." }); return; }
    setBusy(true);
    try {
      await apiPost("/api/auth/change-password", { current_password: current, new_password: next });
      setPwState({ ok: true, message: "Password changed." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setPwState({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  function saveTarget() {
    try { localStorage.setItem(RETENTION_KEY, String(target)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const user = me || currentUser() || {};
  return (
    <div>
      <PageHeader title="Settings" sub="Your account and how the dashboard opens" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card>
          <CardHeader title="Account" />
          <Table head={["", ""]}>
            {[
              ["Name", user.name || "—"],
              ["Email", user.email || "—"],
              ["Member since", me?.created_at ? formatTimestamp(me.created_at) : "—"],
            ].map(([k, v]) => <Row key={k}><Td title>{k}</Td><Td mono>{v}</Td></Row>)}
          </Table>
          {meError && <div style={{ fontSize: 12, color: C.warning, marginTop: 8 }}>{meError}</div>}
          <div style={{ fontSize: 12, color: C.textFaint, marginTop: 12 }}>
            Passwords are stored as bcrypt hashes. Sessions last 24 hours.
          </div>
        </Card>

        <Card>
          <CardHeader title="Change Password" />
          <form onSubmit={changePassword}>
            <Field label="Current password">
              <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} style={inputStyle} required />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} style={inputStyle} minLength={8} required />
            </Field>
            <Field label="Confirm new password">
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} required />
            </Field>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="submit" disabled={busy} style={{
                background: C.primary, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px",
                fontSize: 13, fontWeight: 600, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
              }}>{busy ? "Saving…" : "Change password"}</button>
              {pwState && <span style={{ fontSize: 12.5, color: pwState.ok ? C.success : C.danger }}>{pwState.message}</span>}
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Default Log Source" />
          <Field label="Source the data pages open on" hint="Also switchable from the top bar on every data page. Saved in this browser.">
            <select value={source} onChange={(e) => setSource(e.target.value)} style={inputStyle}>
              {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </Card>

        <Card>
          <CardHeader title="Smart Storage" />
          <Field label={`Retention target for the simulator: ${pct(target, 0)}`}
            hint="The share of anomalies a simulated policy must keep. The tuned policy itself was optimised for 95%.">
            <input type="range" min={0.8} max={1} step={0.01} value={target} onChange={(e) => setTarget(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button size="sm" variant="primary" onClick={saveTarget}>Save</Button>
            {saved && <span style={{ fontSize: 12.5, color: C.success }}>Saved</span>}
          </div>
          <div style={{ fontSize: 12, color: C.textFaint, marginTop: 14 }}>Theme follows your system's light or dark setting.</div>
        </Card>
      </div>
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
  const [source, setSourceState] = useState(readStoredSource);
  const setSource = (value) => {
    setSourceState(value);
    try { localStorage.setItem(SOURCE_KEY, value); } catch {}
  };

  const pages = {
    dashboard: <DashboardPage onNavigate={setPage} />,
    sources: <SourcesPage />,
    detection: <DetectionPage />,
    analytics: <AnalyticsPage />,
    storage: <SmartStoragePage />,
    stream: <LiveStreamPage />,
    models: <ModelsPage />,
    settings: <SettingsPage />,
  };

  return (
    <SourceCtx.Provider value={{ source, setSource }}>
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
        <Topbar pageTitle={titles[page]} showSource={SOURCE_PAGES.has(page)} />
        <main style={{ padding: 28, flex: 1 }}>
          {/* key: switching source remounts the page, so no state from the previous source leaks across */}
          <React.Fragment key={SOURCE_PAGES.has(page) ? `${page}:${source}` : page}>{pages[page]}</React.Fragment>
        </main>
      </div>
    </div>
    </SourceCtx.Provider>
  );
}
