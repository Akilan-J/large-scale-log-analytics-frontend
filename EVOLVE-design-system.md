# EVOLVE — UI/UX Design Package

Companion to `evolve-prototype.html`. That file is the high-fidelity, interactive mockup;
this document covers the parts a single screen can't: sitemap, flows, the design system as
reusable rules, and the UX rationale behind them.

---

## 1. Application Sitemap

```
EVOLVE
│
├── Dashboard  (/)
│   └── default landing after login
│
├── Log Sources  (/sources)
│   ├── Upload panel (drag-drop + browse)
│   ├── Connector grid (CloudWatch, Azure Monitor, GCP Logging, Kafka, Syslog...)
│   └── Upload History table
│       └── Row → Log Detail drawer (schema preview, parse errors, record count)
│
├── Detection Results  (/detection)
│   ├── Summary KPIs (total / normal / anomalous / avg score)
│   ├── Filterable, searchable event table
│   └── Row → Anomaly Detail drawer (raw log, feature contributions, related events)
│
├── Analytics  (/analytics)
│   ├── Anomalies over time
│   ├── Log level / event / component distribution
│   ├── Processing throughput
│   └── Detection trends by component (stacked)
│
├── Model Management  (/models)
│   ├── Lineage strand (deployed / candidate / retired generations)
│   ├── Deployed model card
│   ├── Candidate model card + training progress
│   ├── Deployment history table
│   └── Model evolution timeline
│       └── Deploy modal → confirmation → toast
│
└── Settings  (/settings)
    ├── Workspace & team
    ├── Alerting & notification rules
    ├── API keys / integrations
    └── Account
```

**Global chrome:** persistent left sidebar (collapsible icon rail), sticky topbar (search,
ingestion-status pill, notifications, account) on every authenticated route.

---

## 2. Primary User Flow

The core loop EVOLVE is built around — a security analyst investigating a spike:

```
Login
  │
  ▼
Dashboard  ──(sees Anomalies Detected KPI has spiked)
  │
  ▼
Detection Results  ──(filters by Critical severity)
  │
  ▼
Click a row  ──(opens Anomaly Detail drawer)
  │
  ├─→ Confirms real threat → escalate / export / annotate
  │
  └─→ Suspects false positive
        │
        ▼
      Analytics  ──(checks Detection Trends by Component to see if it's model drift,
        │           not a real incident)
        ▼
      Model Management  ──(sees Candidate V3 is already training in response to the drift)
        │
        ▼
      Deploy V3 (once training completes) → confirm in modal → toast confirms rollout
```

Secondary flow — onboarding a new log source:

```
Log Sources → Upload panel → drag file → progress bar → toast ("queued for analysis")
  → row appears in Upload History as "Processing" → auto-updates to "Processed"
  → surfaces in Detection Results once scored
```

Design intent: every page answers a specific question a security analyst asks in sequence
(*Is something wrong? → What exactly? → Is it real? → Why is it happening? → What do I do
about it?*), and the sidebar order mirrors that question order top to bottom.

---

## 3. Wireframe Notes (per page)

Low-fidelity structure — see the prototype for the resolved version.

**Dashboard:** 4-up KPI row → 8/4 split (main trend chart + activity feed) → 3-up row
(quick stats, severity mix, model evolution snapshot). Model Evolution gets a permanent
slot here specifically so the product's differentiator is visible on the very first screen,
not buried three clicks deep.

**Log Sources:** 4/8 split (upload dropzone + connector grid) → full-width history table.
Upload is left-weighted because it's the primary action; connectors are shown even when
unavailable ("Not connected" + Connect button) so the roadmap is visible without needing a
separate marketing page.

**Detection Results:** KPI row → toolbar (search + severity pills + date range) directly
above the table it filters, no separation → dense data table as the page's entire reason
for existing.

**Analytics:** No single hero chart — a deliberate grid of six visualizations at three
sizes (1 large trend, 2 medium distributions, 3 small distributions + 1 full-width stacked
trend) so an analyst can scan the whole system state in one screen without scrolling.

**Model Management:** Lineage strand as full-width hero (the signature element) → 6/6 split
comparing deployed vs. candidate model stats → 7/5 split (deployment history table +
narrative timeline). Two representations of the same data (table = precise, timeline =
narrative) because analysts and engineering leads read model history differently.

---

## 4. Component Hierarchy

```
AppShell
├── Sidebar
│   ├── Brand
│   ├── NavSection (Monitor: Dashboard, Log Sources, Detection Results, Analytics)
│   ├── NavSection (System: Model Management, Settings)
│   └── UserChip
├── Topbar
│   ├── Breadcrumb
│   ├── SearchBox
│   ├── StatusPill (ingestion live)
│   ├── IconButton (notifications, badge dot)
│   └── Avatar
└── PageOutlet
    ├── PageHeader (title, subtitle, primary actions)
    ├── KpiCard × n        (icon, label, mono value, delta, optional sparkline/lineage-mini)
    ├── ChartCard          (header + pill-tabs date range + Chart.js canvas)
    ├── DataTableCard       (header + toolbar[search, filter pills, select] + Table)
    │   └── Table
    │       ├── TableHeaderRow
    │       └── TableRow × n → RowActions
    ├── ActivityFeed        (FeedItem × n: dot, text, timestamp)
    ├── LineageStrand        (GenNode × n: dot, label, version, accuracy, status badge)
    ├── Timeline             (TimelineItem × n: dot, title, meta, description)
    ├── Modal                (title, description, data-preview block, actions)
    └── Toast                (icon, title, subtext)
```

Shared primitives used across every page: `Card`, `Badge`, `Button` (primary / secondary /
ghost × sm/md), `Pill` (single + tab-group), `ProgressBar`, `SearchBox`, `IconButton`.

---

## 5. Design System

### Color
| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0A0E13` | App background |
| `--bg-raised` | `#0D1219` | Sidebar, topbar, input fills |
| `--card` | `#121821` | Card surfaces |
| `--card-hover` | `#161D27` | Hover state on rows/cards |
| `--border` | `#1D2733` | Default hairline border |
| `--primary` | `#3B82F6` | Primary actions, links, ingestion accents |
| `--cyan` | `#22D3EE` | Data/model accents (distinguishes "model" from "action") |
| `--success` | `#10B981` | Healthy, deployed, normal |
| `--warning` | `#F59E0B` | Training, medium severity, attention |
| `--danger` | `#EF4444` | Critical severity, anomalies, failures |
| `--text-hi` / `--text-md` / `--text-lo` / `--text-faint` | `#E6EDF3` / `#B4C0CC` / `#8A97A6` / `#5A6672` | 4-step text hierarchy |

Rule of thumb: **blue = action**, **cyan = model/data state**, **green/amber/red = health
severity**. Never mix these roles (e.g., don't use cyan for a button) — that consistency is
what lets an analyst scan-read the interface instead of parsing labels.

### Typography
- **Inter** — all UI chrome: nav labels, headers, body copy, buttons.
- **IBM Plex Mono** — every number: KPI values, timestamps, scores, versions, table figures.
  This is a deliberate, enterprise-security-tool convention (Splunk/Sentinel/Grafana all do
  this) — it signals "this is measured data" versus "this is a UI label," and it makes
  columns of numbers align predictably.
- Scale: 22px/700 page title → 15px/600 card title → 13.5px/500 body → 12px/500 label →
  11px/700 uppercase eyebrow (0.6–1.2px tracking).

### Spacing & Shape
- Base unit 4px. Card padding 20–22px. Grid gutters 18px. Page padding 28px (16px mobile).
- Card radius 12px, small controls 8px, pills fully rounded.
- Borders are 1px hairlines, not shadows-only — enterprise density needs crisp edges.
- Shadows are subtle (`0 4px 16px rgba(0,0,0,.35)`) and only appear on hover/elevation, not
  at rest — keeps the base UI flat and calm.

### Buttons
| Variant | Use |
|---|---|
| Primary (solid blue) | One per view — the page's main action (Deploy, Run Scan) |
| Secondary (outlined) | Supporting actions (Export, Connect Source) |
| Ghost (text-only) | In-row/table actions (Investigate, row menu) |

### Badges
Uppercase, 11px, pill-shaped, dot + label. Color maps 1:1 to the severity/status tokens
above — never introduce a new badge color without a corresponding system state.

### Tables
Uppercase 11px letter-spaced headers in `--text-faint`, 13px mono for numeric cells, 13px
Inter for text cells, row hover = `--card-hover`, no vertical rules (horizontal hairlines
only) to keep density high without visual noise.

### Charts (Chart.js conventions used throughout)
- Gridlines: `--border-soft`, never full-opacity white lines.
- One accent color per series, mapped to the same severity/role tokens as badges.
- Tooltips/axis text in Plex Mono at 10–11px.
- Doughnuts use 65–70% cutout with bottom legend, never a raw pie.

---

## 6. Dashboard Layout Recommendations

- **F-pattern priority:** most urgent number (Anomalies Detected) and the model's live
  status sit in the top KPI row — the first thing scanned.
- **Don't let Analytics duplicate the Dashboard.** Dashboard = "is everything OK right
  now," Analytics = "why, and what's the trend." If a chart answers a today-question, it
  belongs on the Dashboard; if it needs a date-range control, it belongs on Analytics.
- **Cap KPI cards at 4 per row.** Enterprise dashboards fail when they cram 6–8 metrics
  above the fold — 4 is the limit where each number still gets read, not skimmed past.
- Keep the Model Evolution card present on the Dashboard even in compact form — it's the
  product's differentiator and should never require navigation to notice.

---

## 7. UX Improvements & Best Practices

- **Progressive disclosure on tables:** row click opens a side drawer (not full navigation)
  for anomaly/log detail — keeps the analyst's filtered context intact.
- **Persist filters in the URL** (`?severity=critical&range=24h`) so investigation links are
  shareable between analysts — a real workflow need in SOC-style tools.
- **Empty states should instruct, not apologize** — e.g. "No log sources connected yet —
  upload a file or connect a stream to start detection" rather than a bare "No data."
- **Destructive/high-stakes actions always confirm** — model deployment, source
  disconnection — via modal with the actual numbers being acted on (as in the Deploy
  modal), never a bare "Are you sure?"
- **Color is never the only signal.** Every severity badge pairs color with a text label
  and a dot icon, for colorblind accessibility and screenshot/reporting clarity.
- **Search boxes should live next to what they filter**, not in a separate global-only
  location — the Detection Results table has its own scoped search in addition to the
  global topbar search.

---

## 8. Animation & Micro-interactions

Kept deliberately restrained — this is enterprise software, not a marketing site.

- **Ingestion pulse dot** in the topbar status pill — a slow (2s) expanding-ring pulse,
  the one continuously-animating element, signals "live system" at a glance.
- **Page transitions:** 200–250ms fade + 4px rise on route change — enough to feel
  responsive, not enough to feel like a slideshow.
- **Card hover:** 2px lift + border brighten on interactive cards only (KPI cards, source
  tiles) — static content cards (tables) don't lift, since lift implies "clickable."
- **Progress bars** (upload, training) animate width with an eased transition (600ms
  cubic-bezier) rather than snapping — reinforces "something is actively happening."
- **Candidate model node** (dashed ring) gets a slow continuous rotation — a small,
  literal "still evolving" cue tied directly to the brand concept, used in exactly one
  place so it stays meaningful rather than decorative.
- **Toasts** slide up + fade in on action confirmation (deploy, upload complete), auto
  dismiss after ~3s, never block interaction.
- **Reduced motion:** all of the above should respect `prefers-reduced-motion` — swap
  transitions for instant state changes, keep the pulse dot but drop the ring expansion.

---

## 9. Mobile Responsiveness Strategy

EVOLVE is a monitoring tool, not a mobile-first product — treat mobile as "check status and
triage," not "do deep analysis on a phone."

- **Sidebar** collapses to an off-canvas drawer (hamburger-triggered) below 720px instead
  of the icon-rail — icon-only rail is too cramped on mobile, better to hide entirely.
- **KPI grids** drop from 4/3-column to single column; cards keep their internal layout
  intact rather than becoming denser.
- **Tables** become horizontally scrollable within their card (not reflowed to cards-per-row)
  below 720px — for a security tool, preserving column alignment for scanning matters more
  than avoiding a scrollbar.
- **Charts** stay full width, single column, with axis label font size stepped down; the
  6-chart Analytics grid becomes a vertical stack in visual priority order (trend →
  distributions → throughput).
- **Global search** is hidden on mobile topbar in favor of a search icon that expands to
  full-width overlay on tap — there's no room for a persistent 280px input.
- **Primary actions** (Deploy, Upload, Run Scan) stay as full-width buttons at the top of
  their page rather than being squeezed into a header row.
- Touch targets minimum 40px on interactive rows/buttons at mobile breakpoints, up from the
  36px desktop default.

---

## 10. File Reference

- `evolve-prototype.html` — single-file interactive mockup, open directly in any browser.
  All 5 core pages + Settings stub, live JS interactions (nav, upload simulation, table
  search/filter, deploy modal + toast), Chart.js visualizations wired to mock data.
