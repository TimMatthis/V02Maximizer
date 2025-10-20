# Performance Maximizer — Personalized Performance Insights (Prototype)

Interactive React + TypeScript prototype that explores how training, recovery, and lifestyle factors shape VO2max and power output using explainability-style visuals (waterfall/force plots) and a simple online-learning simulation. Built with Vite and Tailwind CSS.

A Rolls Data and AI in Australia collaboration.

## Quick Start

- Prerequisites: Node.js 18+ and npm
- Install: `npm install`
- Develop: `npm run dev` (Vite dev server)
- Build: `npm run build` (TypeScript + Vite)
- Preview: `npm run preview` (serve production build)

## Tech Stack

- `React 18` + `TypeScript`
- `Vite` build tool
- `Tailwind CSS 4` + `PostCSS`
- `D3` and `Recharts` for visualizations
- `mathjs` for simple stats
- `react-router-dom` for routing

## App Overview

- Landing/Home: overview with links to Dashboard, Data Manager, and Goals & Plans (`src/pages/Landing.tsx:1`).
- Dashboard: interactive explainability view with factor controls, SHAP-like contributions, warnings, and insights (`src/views/DashboardView.tsx:1`).
- Data Manager: placeholder to manage personas and future data sources (`src/pages/DataManager.tsx:1`).
- Goals & Plans: target-setting and suggested adjustments based on response curves and priorities (`src/pages/GoalsPlans.tsx:1`).

Navigation shell and branding live in the header (`src/components/Header.tsx:1`). App routes are defined in (`src/App.tsx:1`).

## Core Features

- Explainability visuals
  - SHAP-like Waterfall (`src/components/SHAPWaterfall.tsx:1`)
  - Force Plot (D3) (`src/components/d3/ForcePlot.tsx:1`)
  - Importance ranking, dependency plots (`src/components/ImportanceRanking.tsx`, `src/components/DependencyPlots.tsx`)
- Factor exploration and scenarios
  - Basic/Advanced factor controls with overrides (`src/components/FactorControls.tsx`, `src/components/AdvancedFactorControls.tsx`)
  - Save and compare scenarios (`src/views/DashboardView.tsx:1`)
- Personalization (simulated)
  - Synthetic personas and daily metric generation (`src/utils/personas.ts:1`)
  - Online-learning style weight updates (`src/utils/onlineLearning.ts:1`)
  - Simplified SHAP computation over a normalized feature space (`src/utils/shapSimplified.ts:1`)
- Guidance and safety rails
  - Threshold warnings for overtraining/sleep/HRV patterns (`src/utils/thresholds.ts:1`)
  - Priority actions and recommendations derived from response curves (`src/utils/priority.ts:1`, `src/utils/responseCurves.ts`)

State management is implemented via a lightweight `Context + useReducer` pattern (`src/state/AppState.tsx:1`). Domain types live in (`src/types.ts:1`).

## Data & Assumptions

- All data is synthetic and generated on the client.
- No third-party integrations are used in this prototype.
- Model “weights” evolve via a simple online-learning simulator; SHAP values are approximated for interactivity and clarity rather than fidelity to any specific ML model.

## Project Structure

- `index.html` — App entry
- `src/main.tsx` — React bootstrap
- `src/App.tsx` — Routing and providers
- `src/pages/*` — Top-level pages
- `src/views/*` — Complex page-level compositions (e.g., Dashboard)
- `src/components/*` — Reusable UI and visualization components
- `src/state/*` — App state container
- `src/utils/*` — Domain logic (personas, SHAP, thresholds, priorities)
- `src/types.ts` — TypeScript domain types
- `public/*` — Static assets (e.g., `public/vite.svg`)

## Runbook

- Start dev server: `npm run dev` then open the printed local URL.
- Navigate:
  - Dashboard: toggle between VO2max and Power models, tweak factors, view SHAP waterfall/force, save scenarios.
  - Goals & Plans: set a VO2max or Power target and apply suggested factor targets.
  - Data Manager: review personas and placeholder sync actions.

## Oura OAuth (Prototype Backend)

This repo includes a minimal Express auth server for Oura OAuth (Authorization Code flow) to enable data access.

1) Create a `.env` file in the repo root with:

```
OURA_CLIENT_ID=your_oura_client_id
OURA_CLIENT_SECRET=your_oura_client_secret
OURA_REDIRECT_URI=http://localhost:8080/auth/oura/callback
APP_URL=http://localhost:5173
PORT=8080
```

2) Run the server: `npm run server`

3) In the app (Data Manager), click `Connect Oura` to start the OAuth flow. After consenting, you’ll be redirected back to `/data` with a `?oura=connected` hint.

Notes
- This is a development scaffold. Tokens are stored in `server/data/tokens.json` (local file). Do not use in production.
- Garmin requires Garmin Health program access; a stub endpoint is provided but not active.

Frontend config
- Optionally set `VITE_SERVER_URL` in a `.env` (or `.env.local`) for the Vite app if your backend is not at `http://localhost:8080`.

## Known Issues & TODOs

- Asset placeholder: `Landing` references `/images/hero-athlete.jpg` which isn't included; add or remove reference.
- Real integrations: add Garmin/Oura connectors and sync flows; persist user data.
- Testing: add unit tests for utils (SHAP, thresholds, priority) and basic component tests.
- Accessibility & i18n: audit ARIA usage, keyboard navigation, and add localization.
- Model improvements: refine power model calculations and relationships between VO2max and power output.

## Scripts (from `package.json`)

- `dev` — run Vite dev server
- `build` — type-check (`tsc`) and build for production
- `preview` — serve built assets locally

---
This repository represents an interactive prototype and is not a medical or training device. Use for exploration and UX validation.
