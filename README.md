# PTE Class Coverage Tracker

A small React app for tracking PTE exam preparation class coverage and sessions.

---

## Key Features

- **☁️ Cloud Persistence (Supabase)**: Loads a user's saved state after sign-in and automatically saves subsequent changes. Initialization stops after fatal load failures to avoid overwriting cloud data.
- **👤 Guest Mode**: Offline-first design utilizing `localStorage` if not logged in. Guest data and the guest choice persist across reloads until the browser's storage is cleared. On sign-in, if the guest data differs from the cloud data, you choose to merge both or overwrite this browser's copy with the cloud data.
- **🏫 Institutes**: Add, remove and switch between institutes. Each one has its own classes, coverage and session history. Session history is collapsible.
- **📊 Smart Priority & Weightage**: Orders question types dynamically by mark contribution (High to Low) to focus study plans.
- **🔒 Overwrite on Login**: Overwrites local work with cloud-saved profiles upon sign-in for clean state transitions.

---

## How it works

- `src/state.ts` — the tracker state and every change to it, as plain functions (toggle coverage, log a session, add/remove/reset a class, add/remove an institute, merge states). Data saved before institutes existed becomes the default institute. Stored or imported data is repaired by `normalizeState` before it is used.
- `src/coverage.ts`, `src/data.ts` — the weightage chart and which question types count towards 72 marks per skill.
- `src/useTracker.ts` — loads and auto-saves the state (cloud when signed in, `localStorage` as a guest). Changes are only saved after a successful load, and saves run one at a time, in order.
- `src/storage.ts`, `src/supabase.ts` — the two places the state can live.
- `src/App.tsx`, `src/components/` — the UI.

---

## Tech Stack

- **Framework**: React 19 + Vite
- **Backend & Auth**: Supabase
- **Styling**: Vanilla CSS (Dark Mode support)
- **Testing**: Vitest + React Testing Library

---

## Setup & Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For a fresh database, follow [Database setup](supabase/README.md). The migration creates
`pte_tracker_state` with explicit grants and RLS so authenticated users can read and
upsert only their own state. Guest mode works without Supabase configuration.

### GitHub Actions Deployment

For production builds (e.g. GitHub Pages), configure the secrets in your repository settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Starts the Vite development server  |
| `npm run build`      | Type-checks and builds the bundle   |
| `npm run type-check` | Strict TypeScript check             |
| `npm test`           | Runs the test suite                 |
| `npm run check`      | Type-check and tests (what CI runs) |
