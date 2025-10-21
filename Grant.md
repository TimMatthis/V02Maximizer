## V02Maximizer — Grant Summary

## What the technology is

V02Maximizer is an interactive, explainable performance analytics platform that helps athletes and coaches understand how training, recovery, and lifestyle factors affect VO2max and cycling/running power. It combines transparent, SHAP‑style factor attributions with simple online‑learning to personalize guidance, enabling users to explore what‑if scenarios, set goals, and receive prioritized, safety‑aware recommendations.

## How it works

- **Explainable modeling**: A simplified SHAP approach estimates each factor’s positive/negative contribution to current performance versus a baseline, visualized via waterfall and force plots.
- **Personalization loop**: Lightweight online‑learning updates factor weights over time (from population priors toward the individual), reflecting changing responsiveness to training and recovery.
- **Guidance engine**: Response curves and thresholds translate factor gaps into prioritized actions (what to increase/reduce) and warn on overtraining/sleep/HRV risk.
- **Scenario planning**: Users adjust factor controls to test “what if” changes, save scenarios, and compare predicted outcomes.
- **Architecture**: React + TypeScript front end (Vite, Tailwind, D3/Recharts). Prototype Node/Express backend scaffolds OAuth for device integrations (e.g., Oura) and pass‑through APIs. Data is synthetic in the MVP; connectors will enable real histories in the next phase.

## Why it’s innovative

- **Explainability first**: Athlete‑facing SHAP‑style visuals make model reasoning transparent and actionable, building trust over pure black‑box scores.
- **Action orientation**: Prioritization blends contribution magnitude, distance from optimal ranges, and short‑term trends to produce concrete next actions, not just insights.
- **Lightweight personalization**: Online‑learning adapts quickly to the individual with minimal data, reducing cold‑start and enabling useful guidance early.
- **Safety rails**: Threshold warnings explicitly surface risk conditions (e.g., overtraining patterns), aligning optimization with wellbeing.
- **Modular path to real models**: The UI and types are designed so a trained model API can replace the simplified engine without changing the explainability experience.

## Feasibility (development stage, plan, and risks)

- **Current stage (Prototype/MVP)**
  - Interactive app with factor controls, SHAP‑style visuals, priorities, thresholds, and scenario saving.
  - Personas with synthetic daily histories; simple online‑learning weight updates.
  - Prototype backend for OAuth (Oura) and CORS; local token storage (dev only).

- **12–16 week plan to production‑ready pilot**
  1) Data integrations (Weeks 1–4): Harden OAuth, add Garmin/Apple Health scaffolding; secure token storage; ingest daily metrics pipeline; anonymized dev datasets.
  2) Modeling (Weeks 3–8): Replace simplified engine with trained models per sport; calibrate response curves; unit tests and evaluation harness.
  3) Personalization (Weeks 6–10): Per‑user baselines, drift detection, model versioning, guardrail tuning.
  4) UX and accessibility (Weeks 8–12): Mobile‑friendly layouts, A11y audit, localization framework.
  5) Compliance & privacy (Weeks 10–14): Data retention policies, consent flows, audit logging, security review.
  6) Pilot (Weeks 14–16): 50–200 users via partner clubs/coaches; collect outcomes and usability metrics.

- **Key risks and mitigations**
  - Data quality/coverage: Start with partners/devices with robust APIs; validate and impute; clear “data freshness” indicators.
  - Model validity and generalization: Use hold‑out cohorts per sport/age/sex; human‑in‑the‑loop guardrails; continuous evaluation.
  - Privacy/security: Least‑privilege scopes, encrypted storage, regional data residency, opt‑in sharing.
  - Behavior change efficacy: Pair guidance with coach‑mode and nudges; measure adherence and adjust response curves.

## Impact and value

- **For athletes**: Faster, safer progress toward VO2max/power goals with personalized, transparent guidance; reduced injury/overtraining risk; confidence from seeing why recommendations matter.
- **For coaches**: A shared explainability layer that highlights leverage points and risks across athletes, saving analysis time and improving adherence.
- **For partners (clubs, wearable platforms)**: Differentiated UX via explainable insights; increased engagement and retention; white‑label opportunities.
- **Commercial model**: B2C subscription (freemium → premium insights), B2B licensing/white‑label for teams and platforms, coach dashboards as an add‑on.
- **Measurable outcomes** (pilot KPIs):
  - +10–20% improvement in target performance metric over baseline cohort.
  - −20–30% reduction in overtraining/low‑sleep risk flags per user.
  - Weekly active use >35%, scenario saves/user/week ≥2, coach adoption in >60% of pilot teams.

—
This MVP is designed to prove that explainable, safety‑aware guidance can drive meaningful performance gains with minimal friction, while laying a clean migration path to production‑grade models and real data integrations.


