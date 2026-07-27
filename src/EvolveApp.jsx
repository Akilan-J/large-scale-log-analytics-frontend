import React, { useState, useEffect, useRef } from "react";
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

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const C = {
  bg: "#0A0E13", bgRaised: "#0D1219", card: "#121821", cardHover: "#161D27",
  border: "#1D2733", borderSoft: "#161E29",
  primary: "#3B82F6", primaryDim: "#1E3A66", cyan: "#22D3EE",
  success: "#10B981", successDim: "#0B3B2C",
  warning: "#F59E0B", warningDim: "#4A3608",
  danger: "#EF4444", dangerDim: "#4A1414",
  textHi: "#E6EDF3", textMd: "#B4C0CC", textLo: "#8A97A6", textFaint: "#5A6672",
  mono: "'IBM Plex Mono', monospace", sans: "'Inter', -apple-system, sans-serif",
};

/* ============================================================
   MOCK DATA
   ============================================================ */
const activity = [
  { c: C.danger, text: "Critical anomaly detected in **auth-service** — score 0.94", t: "2 min ago" },
  { c: C.primary, text: "Ingested 42,118 records from **cluster-auth.log**", t: "8 min ago" },
  { c: C.warning, text: "Candidate model **V3** reached epoch 140/200", t: "23 min ago" },
  { c: C.success, text: "Model **V2.3** passed health check — fitness 0.928", t: "1 hr ago" },
  { c: C.primary, text: "New source connected: **AWS CloudWatch**", t: "2 hr ago" },
  { c: C.danger, text: "Anomaly cluster flagged in **payment-gateway**", t: "3 hr ago" },
];

const uploadsData = [
  { name: "cluster-auth.log", src: "Manual Upload", size: "128 MB", rec: "412,004", time: "2026-07-27 09:14", status: "success" },
  { name: "cloudwatch-export-0726.json", src: "AWS CloudWatch", size: "340 MB", rec: "1,204,552", time: "2026-07-26 22:03", status: "success" },
  { name: "payment-gateway.log", src: "Manual Upload", size: "64 MB", rec: "198,441", time: "2026-07-26 14:51", status: "processing" },
  { name: "network-flow-0725.csv", src: "Manual Upload", size: "22 MB", rec: "88,120", time: "2026-07-25 11:20", status: "success" },
  { name: "legacy-app.log", src: "Manual Upload", size: "9 MB", rec: "14,032", time: "2026-07-24 08:02", status: "failed" },
  { name: "cloudwatch-export-0723.json", src: "AWS CloudWatch", size: "288 MB", rec: "1,090,332", time: "2026-07-23 20:11", status: "success" },
];

const connectors = [
  { name: "Manual File Upload", meta: "Active · 6 files this week", Icon: Database, enabled: true, accent: C.primary },
  { name: "AWS CloudWatch", meta: "Streaming · connected", Icon: Cloud, enabled: true, accent: C.cyan },
  { name: "Azure Monitor", meta: "Not connected", Icon: Server, enabled: false },
  { name: "GCP Logging", meta: "Not connected", Icon: Waypoints, enabled: false },
  { name: "Kafka Stream", meta: "Not connected", Icon: ListTree, enabled: false },
  { name: "Syslog (RFC 5424)", meta: "Not connected", Icon: FileText, enabled: false },
];

const detectionEvents = [
  { t: "09:41:22", ev: "Unauthorized Access Attempt", comp: "auth-service", score: 0.94, sev: "critical", ip: "103.42.88.101" },
  { t: "09:38:07", ev: "Anomalous API Latency Spike", comp: "payment-gateway", score: 0.88, sev: "high", ip: "10.0.4.22" },
  { t: "09:22:51", ev: "Unusual Login Geography", comp: "auth-service", score: 0.81, sev: "high", ip: "198.51.100.7" },
  { t: "08:57:14", ev: "Repeated Token Refresh Failures", comp: "api-gateway", score: 0.77, sev: "medium", ip: "172.16.5.44" },
  { t: "08:40:03", ev: "Privilege Escalation Pattern", comp: "iam-controller", score: 0.91, sev: "critical", ip: "10.0.1.9" },
  { t: "08:12:39", ev: "Config Drift Detected", comp: "k8s-scheduler", score: 0.72, sev: "medium", ip: "10.0.9.13" },
  { t: "07:55:18", ev: "Data Exfiltration Signature", comp: "storage-service", score: 0.89, sev: "high", ip: "203.0.113.61" },
  { t: "07:30:44", ev: "Brute Force Login Sequence", comp: "auth-service", score: 0.95, sev: "critical", ip: "45.33.12.201" },
  { t: "07:02:09", ev: "Abnormal Outbound Traffic", comp: "network-proxy", score: 0.79, sev: "medium", ip: "10.0.2.61" },
  { t: "06:44:57", ev: "Certificate Validation Failure", comp: "api-gateway", score: 0.75, sev: "medium", ip: "10.0.6.30" },
];

const deployHistory = [
  { v: "V2.3", acc: "95.4%", fit: "0.928", date: "2026-07-21", status: "success" },
  { v: "V2.2", acc: "94.1%", fit: "0.911", date: "2026-07-14", status: "success" },
  { v: "V2.1", acc: "93.6%", fit: "0.902", date: "2026-07-07", status: "rollback" },
  { v: "V2.0", acc: "92.8%", fit: "0.895", date: "2026-06-29", status: "success" },
  { v: "V1", acc: "91.2%", fit: "0.870", date: "2026-06-15", status: "success" },
];

const modelTimeline = [
  { c: C.warning, title: "V3 training started", meta: "2026-07-27 07:00", desc: "Retraining triggered by drift detection in auth-service traffic." },
  { c: C.success, title: "V2.3 deployed to production", meta: "2026-07-21 16:20", desc: "Gradual rollout completed, fitness stable at 0.928." },
  { c: C.success, title: "V2.2 promoted from candidate", meta: "2026-07-14 10:05", desc: "Accuracy improved 1.3pp on validation set." },
  { c: C.danger, title: "V2.1 rolled back", meta: "2026-07-07 03:44", desc: "Fitness dropped below 0.90 threshold post-deploy; reverted to V2.0." },
  { c: C.success, title: "V1 initial deployment", meta: "2026-06-15 09:00", desc: "Baseline isolation-forest model shipped." },
];

const volumeData = ["Jul 14","Jul 15","Jul 16","Jul 17","Jul 18","Jul 19","Jul 20","Jul 21","Jul 22","Jul 23","Jul 24","Jul 25","Jul 26","Jul 27"]
  .map((d, i) => ({
    day: d,
    logs: [902,1001,963,1056,1144,1089,1232,1188,1265,1320,1298,1386,1441,1412][i],
    anomalies: [62,58,71,65,80,74,88,95,90,102,98,110,118,128][i],
  }));

const severityMix = [
  { name: "Critical", value: 18, color: C.danger },
  { name: "High", value: 34, color: C.warning },
  { name: "Medium", value: 48, color: C.cyan },
];

const anomalyTrendData = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => ({
  day: d, anomalies: [142,168,155,190,210,175,128][i], threshold: 150,
}));

const logLevelData = [
  { name: "INFO", value: 62, color: C.primary },
  { name: "WARN", value: 21, color: C.warning },
  { name: "ERROR", value: 12, color: C.danger },
  { name: "DEBUG", value: 5, color: C.textFaint },
];

const eventDistData = [
  { name: "Auth Fail", value: 38 }, { name: "API Latency", value: 27 },
  { name: "Priv. Esc.", value: 19 }, { name: "Data Exfil", value: 12 }, { name: "Config Drift", value: 9 },
];

const componentDistData = [
  { name: "auth-svc", value: 34 }, { name: "api-gw", value: 26 },
  { name: "iam-ctrl", value: 18 }, { name: "k8s-sched", value: 14 }, { name: "storage", value: 8 },
];

const throughputData = ["00h","04h","08h","12h","16h","20h","24h"].map((t, i) => ({
  t, rate: [812,760,940,1210,1180,1050,880][i],
}));

const detectionTrendData = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => ({
  day: d,
  "auth-service": [40,52,38,60,55,44,30][i],
  "payment-gateway": [20,18,25,22,30,19,14][i],
  "api-gateway": [15,20,17,24,19,16,12][i],
  "iam-controller": [10,12,8,14,11,9,7][i],
}));

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

/* ============================================================
   SMALL HELPERS / PRIMITIVES
   ============================================================ */
function bold(text) {
  // renders **word** as <strong>, used only for the mock activity feed copy
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") ? <strong key={i} style={{ color: C.textHi }}>{p.slice(2, -2)}</strong> : p
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

function Button({ children, variant = "secondary", size = "md", onClick, style, icon: Icon }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, borderRadius: 8,
    border: "1px solid transparent", cursor: "pointer", whiteSpace: "nowrap",
    fontSize: size === "sm" ? 12 : 13, padding: size === "sm" ? "6px 12px" : "9px 16px",
    transition: "all .15s", fontFamily: C.sans,
  };
  const variants = {
    primary: { background: C.primary, color: "#fff" },
    secondary: { background: C.card, borderColor: C.border, color: C.textHi },
    ghost: { background: "transparent", color: C.textMd },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }} onClick={onClick}>
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

/* ============================================================
   SIDEBAR
   ============================================================ */
function Sidebar({ active, setActive, expanded, setExpanded }) {
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
        <div style={{
          width: 30, height: 30, flexShrink: 0, borderRadius: 8,
          background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#03131a",
        }}>E</div>
        <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: ".3px", opacity: expanded ? 1 : 0, transition: "opacity .15s" }}>EVOLVE</div>
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
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#2a3f5f,#1a2634)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.cyan }}>RK</div>
          <div style={{ opacity: expanded ? 1 : 0, transition: "opacity .15s", overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textHi }}>R. Kannan</div>
            <div style={{ fontSize: 11, color: C.textFaint }}>Security Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   TOPBAR
   ============================================================ */
function Topbar({ pageTitle }) {
  return (
    <header style={{
      height: 64, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", borderBottom: `1px solid ${C.borderSoft}`, background: "rgba(10,14,19,0.85)",
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
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2a3f5f,#1a2634)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.cyan }}>RK</div>
      </div>
    </header>
  );
}

/* ============================================================
   PAGE: DASHBOARD
   ============================================================ */
function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Overview"
        sub="Real-time system health across ingestion, detection, and model performance"
        right={<>
          <Button size="sm" icon={Plus}>New Log Source</Button>
          <Button size="sm" variant="primary" icon={RefreshCw}>Run Detection Scan</Button>
        </>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 18 }}>
        <KpiCard label="Total Logs Processed" value="18.42M" icon={FileText} iconBg={C.primaryDim} iconColor={C.primary} delta="12.4% vs last 24h" deltaUp />
        <KpiCard label="Anomalies Detected" value="1,284" icon={AlertTriangle} iconBg={C.dangerDim} iconColor={C.danger} delta="3.1% vs last 24h" deltaUp={false} />
        <Card hoverable>
          <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, background: "rgba(34,211,238,0.12)", color: C.cyan }}>
            <GitBranch size={18} />
          </div>
          <div style={{ fontSize: 12, color: C.textLo, fontWeight: 500, marginBottom: 6 }}>Current Model Version</div>
          <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 600, letterSpacing: "-.5px" }}>V2.3</div>
          <LineageMini />
        </Card>
        <Card hoverable>
          <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, background: C.successDim, color: C.success }}>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: 12, color: C.textLo, fontWeight: 500, marginBottom: 6 }}>Model Status</div>
          <div style={{ fontSize: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>Active <Badge tone="success" dot>Healthy</Badge></div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }}>Serving 100% of traffic</div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Log Volume & Anomalies — Last 14 Days" right={<PillTabs options={[{value:"14d",label:"14D"},{value:"30d",label:"30D"},{value:"90d",label:"90D"}]} active="14d" onChange={()=>{}} />}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volumeData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: C.sans }} />
              <Bar yAxisId="left" dataKey="logs" name="Logs (K)" fill="rgba(59,130,246,0.55)" radius={[4,4,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="anomalies" name="Anomalies" stroke={C.danger} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader title="Recent Activity" meta="Live feed" />
          {activity.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < activity.length - 1 ? `1px solid ${C.borderSoft}` : "none", paddingTop: i === 0 ? 0 : 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: a.c }} />
              <div>
                <div style={{ fontSize: 13, color: C.textHi, lineHeight: 1.4 }}>{bold(a.text)}</div>
                <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 2, fontFamily: C.mono }}>{a.t}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
        <Card>
          <CardHeader title="Quick Statistics" />
          <Stat label="Avg. detection latency" value="218ms" />
          <Stat label="Active log sources" value="6 / 8" />
          <Stat label="False positive rate" value="2.1%" color={C.success} />
          <Stat label="Storage utilization" value="64%" />
          <div style={{ marginTop: 6 }}><ProgressBar pct={64} /></div>
        </Card>

        <ChartCard title="Anomaly Severity Mix" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={severityMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={75} paddingAngle={2}>
                {severityMix.map((s, i) => <Cell key={i} fill={s.color} stroke="none" />)}
              </Pie>
              <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 10.5, fontFamily: C.sans }} />
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader title="Model Evolution" right={<Badge tone="primary">Auto-optimizing</Badge>} />
          <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 4 }}>Current</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700 }}>V2.3</span>
            <Badge tone="success" dot>Active</Badge>
          </div>
          {[
            { v: "V1", pct: 91, color: C.textFaint, label: "91%" },
            { v: "V2.3", pct: 95, color: C.cyan, label: "95%" },
            { v: "V3", pct: 96, color: C.warning, label: "96%*" },
          ].map((r) => (
            <div key={r.v} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 8 }}>
              <span style={{ width: 30, fontFamily: C.mono, color: r.color }}>{r.v}</span>
              <div style={{ flex: 1 }}><ProgressBar pct={r.pct} color={r.color} height={8} /></div>
              <span style={{ fontFamily: C.mono, color: C.textMd, width: 30 }}>{r.label}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 11.5, color: C.textFaint }}>Last optimized <span style={{ fontFamily: C.mono }}>2h ago</span> · V3 training <span style={{ fontFamily: C.mono }}>73%</span></div>
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

/* ============================================================
   PAGE: LOG SOURCES
   ============================================================ */
function SourcesPage() {
  const [dragOver, setDragOver] = useState(false);
  const [upload, setUpload] = useState(null); // { name, pct }
  const fileRef = useRef(null);
  const [toast, setToast] = useState(null);

  function simulateUpload(name) {
    name = name || "new-log-file.log";
    setUpload({ name, pct: 0 });
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18;
      if (p >= 100) {
        p = 100; clearInterval(iv);
        setToast({ title: "Upload complete", sub: `${name} is queued for analysis` });
        setTimeout(() => setToast(null), 3200);
      }
      setUpload({ name, pct: Math.min(p, 100) });
    }, 220);
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
            onDrop={(e) => { e.preventDefault(); setDragOver(false); simulateUpload(e.dataTransfer.files[0]?.name); }}
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
            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => simulateUpload(e.target.files[0]?.name)} />
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
            {connectors.map((c) => (
              <div key={c.name} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `1px solid ${C.border}`,
                borderRadius: 8, background: C.bgRaised, opacity: c.enabled ? 1 : 0.45,
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c.enabled ? C.primaryDim : C.bg, color: c.accent || C.textFaint }}>
                  <c.Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.enabled ? C.textHi : C.textMd }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: C.textFaint }}>{c.meta}</div>
                </div>
                {c.enabled
                  ? <Badge tone="success" dot>Enabled</Badge>
                  : <Button variant="ghost" size="sm" style={{ marginLeft: "auto" }}>Connect</Button>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div style={{ padding: "20px 22px 0" }}><CardHeader title="Upload History" meta="42 files total" /></div>
        <Table head={["File Name", "Source", "Size", "Records", "Uploaded", "Status", ""]}>
          {uploadsData.map((u) => (
            <Row key={u.name}>
              <Td title>{u.name}</Td>
              <Td>{u.src}</Td>
              <Td mono>{u.size}</Td>
              <Td mono>{u.rec}</Td>
              <Td mono>{u.time}</Td>
              <Td>{u.status === "success" ? <Badge tone="success" dot>Processed</Badge> : u.status === "processing" ? <Badge tone="warning">Processing</Badge> : <Badge tone="danger">Failed</Badge>}</Td>
              <Td><MoreVertical size={14} color={C.textFaint} style={{ cursor: "pointer" }} /></Td>
            </Row>
          ))}
        </Table>
      </Card>

      {toast && <Toast title={toast.title} sub={toast.sub} />}
    </div>
  );
}

/* ============================================================
   PAGE: DETECTION RESULTS
   ============================================================ */
function DetectionPage() {
  const [search, setSearch] = useState("");
  const [sev, setSev] = useState("all");

  const filtered = detectionEvents.filter((e) => {
    const matchSev = sev === "all" || e.sev === sev;
    const q = search.toLowerCase();
    const matchSearch = !q || e.ev.toLowerCase().includes(q) || e.comp.toLowerCase().includes(q) || e.ip.includes(q);
    return matchSev && matchSearch;
  });

  const sevTone = { critical: "danger", high: "warning", medium: "primary" };
  const sevColor = { critical: C.danger, high: C.warning, medium: C.cyan };

  return (
    <div>
      <PageHeader title="Detection Results" sub="Anomaly classification output from model V2.3 across all ingested sources"
        right={<Button size="sm" icon={Download}>Export CSV</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 18 }}>
        <KpiCard label="Total Logs Analyzed" value="842,910" />
        <KpiCard label="Normal Logs" value="841,626" valueColor={C.success} footer={<div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }}>99.85% of total</div>} />
        <KpiCard label="Anomalous Logs" value="1,284" valueColor={C.danger} footer={<div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }}>0.15% of total</div>} />
        <KpiCard label="Avg. Anomaly Score" value="0.847" valueColor={C.warning} footer={<div style={{ marginTop: 10, fontSize: 12, color: C.textFaint }}>Threshold: 0.75</div>} />
      </div>

      <Card padded={false} style={{ marginBottom: 18 }}>
        <div style={{ padding: "20px 22px 16px" }}>
          <CardHeader title="Detection Summary" />
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <SearchBox value={search} onChange={setSearch} placeholder="Search event, component, IP..." width={260} />
            <PillTabs
              active={sev} onChange={setSev}
              options={[{ value: "all", label: "All" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }]}
            />
            <select style={{ marginLeft: "auto", background: C.bgRaised, border: `1px solid ${C.border}`, color: C.textMd, borderRadius: 8, padding: "8px 12px", fontSize: 12.5 }}>
              <option>Last 24 hours</option><option>Last 7 days</option><option>Last 30 days</option>
            </select>
          </div>
        </div>
        <Table head={["Timestamp", "Event Type", "Component", "Anomaly Score", "Severity", "Source IP", ""]}>
          {filtered.map((e, i) => (
            <Row key={i}>
              <Td mono>2026-07-27 {e.t}</Td>
              <Td title>{e.ev}</Td>
              <Td mono>{e.comp}</Td>
              <Td>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: 120 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 4, background: C.bgRaised, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${e.score * 100}%`, background: sevColor[e.sev], borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: C.mono, fontSize: 12 }}>{e.score.toFixed(2)}</span>
                </div>
              </Td>
              <Td><Badge tone={sevTone[e.sev]} dot>{e.sev}</Badge></Td>
              <Td mono>{e.ip}</Td>
              <Td><Button variant="ghost" size="sm">Investigate</Button></Td>
            </Row>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", color: C.textFaint, fontSize: 13 }}>No events match this filter — try a different search or severity.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}

/* ============================================================
   PAGE: ANALYTICS
   ============================================================ */
function AnalyticsPage() {
  const [range, setRange] = useState("7d");
  return (
    <div>
      <PageHeader title="Analytics" sub="Interactive visualizations for trend analysis and system-wide insight"
        right={<PillTabs active={range} onChange={setRange} options={[{value:"7d",label:"7D"},{value:"30d",label:"30D"},{value:"90d",label:"90D"}]} />} />

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Anomalies Over Time" meta="Detected vs. Threshold">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={anomalyTrendData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: C.sans }} />
              <Line type="monotone" dataKey="anomalies" name="Anomalies Detected" stroke={C.danger} strokeWidth={2} dot={{ r: 3, fill: C.danger }} />
              <Line type="monotone" dataKey="threshold" name="Alert Threshold" stroke={C.textFaint} strokeDasharray="6 4" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Log Level Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={logLevelData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={2}>
                {logLevelData.map((s, i) => <Cell key={i} fill={s.color} stroke="none" />)}
              </Pie>
              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 10.5, fontFamily: C.sans }} />
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Event Type Distribution" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventDistData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.textMd, fontSize: 10.5 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill={C.primary} radius={[0,4,4,0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Component Distribution" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={componentDistData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.textMd, fontSize: 10.5 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill={C.cyan} radius={[0,4,4,0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Processing Throughput" meta="logs / sec" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={throughputData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="t" tick={{ fill: C.textFaint, fontSize: 9.5, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="rate" stroke={C.success} fill="rgba(16,185,129,0.12)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Detection Trends by Component" meta="Stacked, last 7 days">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={detectionTrendData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={C.borderSoft} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={{ stroke: C.border }} tickLine={false} />
            <YAxis tick={{ fill: C.textFaint, fontSize: 10, fontFamily: C.mono }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: C.sans }} />
            <Bar dataKey="auth-service" stackId="s" fill={C.danger} radius={[0,0,0,0]} />
            <Bar dataKey="payment-gateway" stackId="s" fill={C.warning} />
            <Bar dataKey="api-gateway" stackId="s" fill={C.cyan} />
            <Bar dataKey="iam-controller" stackId="s" fill={C.primary} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

/* ============================================================
   PAGE: MODEL MANAGEMENT
   ============================================================ */
function ModelsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  function confirmDeploy() {
    setModalOpen(false);
    setToast({ title: "Deployment started", sub: "V3 is rolling out gradually over 30 minutes" });
    setTimeout(() => setToast(null), 3200);
  }

  return (
    <div>
      <PageHeader title="Model Management" sub="EVOLVE continuously trains, evaluates, and promotes candidate models"
        right={<Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>Deploy New Model</Button>} />

      {/* Signature: lineage strand */}
      <Card style={{ padding: "28px 26px 20px", marginBottom: 18 }}>
        <CardHeader title="Model Evolution Lineage" right={<Badge tone="primary">3 generations</Badge>} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 10px 10px" }}>
          <div style={{ position: "absolute", left: "5%", right: "5%", top: 60, height: 2, background: C.border, zIndex: 0 }} />
          <div style={{ position: "absolute", left: "5%", top: 60, height: 2, width: "62%", background: `linear-gradient(90deg, ${C.textFaint}, ${C.primary}, ${C.cyan})`, zIndex: 1 }} />

          <GenNode tone="retired" label="Retired" version="V1" acc="91.2% acc" status={<Badge tone="neutral">Archived</Badge>} />
          <GenNode tone="deployed" label="Deployed" version="V2.3" acc="95.4% acc" status={<Badge tone="success" dot>Active</Badge>} />
          <GenNode tone="candidate" label="Candidate" version="V3" acc="96.1% acc*" status={<Badge tone="warning">Training · 73%</Badge>} />
        </div>
        <div style={{ textAlign: "center", fontSize: 11.5, color: C.textFaint, marginTop: 6 }}>
          *Provisional score on held-out validation set · Last optimized <span style={{ fontFamily: C.mono, color: C.textMd }}>2 hours ago</span>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <Card>
          <CardHeader title="Deployed Model — V2.3" right={<Badge tone="success" dot>Live</Badge>} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <MetricBlock label="Accuracy" value="95.4%" />
            <MetricBlock label="Fitness Score" value="0.928" />
            <MetricBlock label="Detection Threshold" value="0.750" />
            <MetricBlock label="Deployed Since" value="Jul 21, 2026" small />
          </div>
        </Card>
        <Card>
          <CardHeader title="Candidate Model — V3" right={<Badge tone="warning">Training</Badge>} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <MetricBlock label="Accuracy (val)" value="96.1%" color={C.warning} />
            <MetricBlock label="Fitness Score" value="0.941" color={C.warning} />
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ fontSize: 12, color: C.textLo, marginBottom: 8 }}>Training Progress</div>
              <ProgressBar pct={73} color={C.warning} />
              <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 6 }}>Epoch 146 / 200 · ETA 40 min</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 18 }}>
        <Card>
          <CardHeader title="Deployment History" />
          <Table head={["Version", "Accuracy", "Fitness", "Deployed", "Status"]}>
            {deployHistory.map((d) => (
              <Row key={d.v}>
                <Td title mono>{d.v}</Td>
                <Td mono>{d.acc}</Td>
                <Td mono>{d.fit}</Td>
                <Td mono>{d.date}</Td>
                <Td>{d.status === "success" ? <Badge tone="success" dot>Stable</Badge> : <Badge tone="danger">Rolled Back</Badge>}</Td>
              </Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHeader title="Model Evolution Timeline" />
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 6, top: 4, bottom: 4, width: 2, background: C.border }} />
            {modelTimeline.map((t, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i < modelTimeline.length - 1 ? 22 : 0 }}>
                <div style={{ position: "absolute", left: -28, top: 2, width: 14, height: 14, borderRadius: "50%", background: `${t.c}22`, border: `2px solid ${t.c}`, zIndex: 1 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textHi }}>{t.title}</div>
                <div style={{ fontSize: 12, color: C.textFaint, marginTop: 3, fontFamily: C.mono }}>{t.meta}</div>
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
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Deploy candidate model?</h3>
            <p style={{ fontSize: 13, color: C.textMd, marginBottom: 18, lineHeight: 1.5 }}>
              Version <strong style={{ fontFamily: C.mono, color: C.textHi }}>V3</strong> will replace <strong style={{ fontFamily: C.mono, color: C.textHi }}>V2.3</strong> as the active detection model.
              Traffic shifts gradually over 30 minutes with automatic rollback if fitness drops below <strong style={{ fontFamily: C.mono }}>0.90</strong>.
            </p>
            <div style={{ background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 12.5, color: C.textMd, marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Validation accuracy</span><span style={{ fontFamily: C.mono, color: C.warning }}>96.1%</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Training completion</span><span style={{ fontFamily: C.mono, color: C.warning }}>73%</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={confirmDeploy}>Confirm Deployment</Button>
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

/* ============================================================
   PAGE: SETTINGS (stub)
   ============================================================ */
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

/* ============================================================
   TOAST
   ============================================================ */
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

/* ============================================================
   APP SHELL
   ============================================================ */
export default function EvolveApp() {
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
          .evolve-grid-4 { grid-template-columns: repeat(2,1fr) !important; }
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
