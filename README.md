# EVOLVE Adaptive Cloud Log Analytics Dashboard

EVOLVE is a high-fidelity interactive dashboard for cloud log analytics and anomaly detection. This is the **frontend specification prototype** built using React, Recharts, Lucide Icons, and Vite.

All data, training cycles, file uploads, and model deployment loops are currently mock-simulated locally to demonstrate visual layout, user navigation flows, and components.

---

## ⚡ Quick Start

### 1. Requirements
Ensure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

### 2. Install Dependencies
Run the following command at the project root to install React, Recharts, and Lucide:
```bash
npm install
```

### 3. Run Development Server
Start the local Vite dev server (defaults to port `3000`):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to interact with the dashboard.

### 4. Build for Production
To compile and bundle assets into minified production files (outputting to `/dist`):
```bash
npm run build
```

---

## 📂 Project Structure

- `index.html` - Root Vite HTML entrypoint.
- `package.json` - Node package dependencies and npm script hooks.
- `vite.config.js` - Configuration plugin mapping for Vite and React.
- `src/`
  - `main.jsx` - Mounting script loading React DOM client, gating the dashboard behind the login screen.
  - `LoginPage.jsx` - Sign in / sign up screen backed by the auth API.
  - `EvolveApp.jsx` - Primary monolithic React application shell housing local mock states, sidebar routing, sub-pages (Dashboard, Log Sources, Detection, Analytics, Model Management, Settings), charts, modal dialogs, and slide-out details drawers.
- `EVOLVE-design-system.md` - Companion spec outlining colors, typography hierarchy, and UX flows.

All styling lives in the components themselves (inline styles plus a small
injected `<style>` block), so there are no separate stylesheet files.
