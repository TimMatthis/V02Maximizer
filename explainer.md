## V02Maximizer – Architecture & Application Overview

### What this app does
- **Purpose**: Interactive, explainable performance analytics focused on VO2max and Power output. Users explore how training, sleep, and recovery factors influence outcomes, run what‑if scenarios, and get prioritized actions.
- **Explainability**: Uses a simplified, transparent SHAP approach so users can see factor push/pull on predicted performance.

### Tech stack
- **Frontend**: Vite + React + TypeScript, React Router, Tailwind CSS utility classes, D3/Recharts for visuals.
- **Backend (prototype)**: Node/Express service for Oura OAuth and simple pass‑through API.
- **AI**: OpenAI Chat Completions (streaming) for the Digital Twin advisor.

### High-level flow
1. User lands on `Landing` and navigates to `Dashboard` or `Goals & Plans`.
2. Personas with simulated daily histories are loaded. A global app state tracks active persona, date index, model type, and factor overrides.
3. SHAP values are computed for the current factors to produce a personalized prediction and explainability visuals.
4. Priorities and thresholds generate actionable guidance; users can adjust factors, save scenarios, and compare.
5. Optional: Connect Oura via the server, and chat with the Digital Twin advisor.

### Graph weighting flow (POC)
- Upload CSV in `/graph-demo` (wide format: factors + `performance`).
- Initial weights: compute a small ridge regression on standardized data and set Factor → Performance edge weights from normalized coefficients (SHAP-like seed for linear models).
- Goal-aware updates (optional): load goals to nudge online updates toward progress on the target metric.
- Online updates: use EMA on the most recent window to update weights; toggle goal-aware to emphasize progress.
- Recommendations: list top factors with direction (increase/reduce) based on current weights. Demo-only guidance, apply domain constraints before acting.

### Frontend architecture
- **Entry & routing**
  - `src/main.tsx`: Bootstraps React and renders `App`.
  - `src/App.tsx`: Declares routes and wraps key views in `AppStateProvider`.
  - Routes:
    - `/` → `pages/Landing.tsx`
    - `/data` → `pages/DataManager.tsx`
    - `/goals` → `pages/GoalsPlans.tsx` (wrapped in state provider)
    - `/dashboard` → `views/DashboardView.tsx` (wrapped in state provider)

- **Global state** – `src/state/AppState.tsx`
  - Context + reducer pattern storing:
    - Personas (with history and weights)
    - Active persona index and day index
    - Active model type (`VO2` or `Power`)
    - Date range and factor overrides
    - Saved scenarios and SHAP factor visibility
  - Actions: set persona/index/date range, set/reset factor override, save scenario, toggle factor visibility, switch model.

- **Domain types** – `src/types.ts`
  - `FeatureWeights`, `DailyMetrics`, `ShapContributions`, `PriorityAction`, `ThresholdWarning`, etc.

- **Core views & components**
  - `views/DashboardView.tsx`: Main analytic surface. Composes:
    - Controls: persona selector, model switch, factor controls (inline per priority and as “Other factors”).
    - Explainability: `SHAPWaterfall`, `ForcePlot`, `ImportanceRanking`, `DependencyPlots`.
    - Timelines: `DualTimeline` for performance + factors; `WeightEvolution` history, `PerformanceMetrics`.
    - Guidance: `PriorityPanel` (prioritized actions), `ThresholdWarningBanner` (risk alerts), `PredictionDisplay`, `Insights`.
  - `pages/GoalsPlans.tsx`: Goal setting, simple plan generation, scenario planner, and the Digital Twin chat.
  - `pages/DataManager.tsx`: Integrations page (Oura auth, placeholders for Garmin/Graphio), data flow explanation.
  - Factor controls: `AdvancedFactorControls.tsx`, `SingleFactorControl.tsx` (integrated into priority cards).

- **Styling**
  - Tailwind utility classes throughout.
  - Global CSS: `src/index.css`, `src/style.css`.

### Modeling, SHAP, and prioritization
- **Persona generation** – `src/utils/personas.ts`
  - Defines population weights for VO2 and Power and builds three personas (Existing Elite, Active Weekender, Early Elite).
  - Simulates realistic daily histories with correlated features and evolving model weights (from population toward personal).
  - Computes per‑day predictions and SHAP values for both VO2 and Power models.

- **Simplified SHAP** – `src/utils/shapSimplified.ts`
  - Implements an interpretable SHAP‑like method:
    - Predict with all features vs. with one feature replaced by background mean → delta is that feature’s contribution.
    - Contributions are normalized to percentages of the absolute sum.
    - Prediction is baseline + sum(contributions × scaled weights).

- **Priorities & response curves**
  - `src/utils/responseCurves.ts`: Non‑linear response functions and optimal ranges per factor (e.g., inverted‑U for training load).
  - `src/utils/priority.ts`: Ranks actions by combining SHAP impact, distance from optimal range, and short‑term trend; outputs severity, recommendation, and time‑to‑impact.
  - `src/utils/thresholds.ts`: Safety checks (e.g., overtraining risk, low sleep, HRV below baseline) → warning/critical banners.

### Digital Twin advisor (AI)
- `src/utils/openai.ts`: Builds a system prompt with persona/model context and streams responses from `gpt-4o-mini`.
- Used in `pages/GoalsPlans.tsx` to answer questions, quantify tradeoffs, and reference SHAP top factors and planned gain.

### Backend service (prototype)
- `server/index.js` (Node/Express):
  - Oura OAuth endpoints: `/auth/oura`, `/auth/oura/callback`.
  - Token storage to local file (prototype only).
  - Status endpoint: `/api/oura/status`; example pass‑through `/api/oura/daily-sleep`.
  - CORS configured via `APP_URL`.

### Environment & scripts
- Frontend scripts (`package.json`): `dev`, `build`, `preview`.
- Server script: `server` to run `server/index.js`.
- Env vars:
  - Frontend: `VITE_OPENAI_API_KEY`, `VITE_SERVER_URL`.
  - Server: `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET`, `OURA_REDIRECT_URI`, `OURA_AUTH_URL`, `OURA_TOKEN_URL`, `OURA_SCOPES`, `APP_URL`.

### Key user interactions
- Select persona → explore predicted VO2/Power and factor contributions.
- Adjust factors → immediate SHAP recomputation and updated prediction.
- Review priorities and thresholds → targeted actions with time‑to‑impact.
- Set a target in Goals & Plans → generate a simple plan, apply to scenario, compare.
- Chat with the Digital Twin to refine training and recovery decisions.

### Extensibility notes
- Plug real data sources into `DataManager` and the server; replace simulated personas with ingested histories.
- Swap the SHAP simplification with a trained model API while preserving the same `ShapContributions` shape for the UI.
- Add factors by updating `FeatureWeights`, response curves, thresholds, and control UIs.

### Security & privacy (prototype caveats)
- Tokens are stored locally in a file for development only. Use secure storage for production and least‑privilege scopes.


