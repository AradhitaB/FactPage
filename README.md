# FactPage

A live A/B testing experiment disguised as a fact-browsing page. Visitors read through a list of facts, click a button to see the results and discover stats from the experiment they were a part of.

Each visitor is secretly assigned to one of four design combinations across two simultaneous experiments. Their interactions are recorded, and the stats page shows live results once enough data has been collected.

# Experiments

Each visitor is randomly assigned to one variant per experiment. Conversion is measured as clicking "See the Results".

| # | Name | A | B | Hypothesis |
|---|------|---|---|------------|
| 1 | List format | Snap-scroll (swipe/scroll to advance) | Click-through (Next/Back buttons) | Explicit button navigation creates more intentional interaction than passive scrolling, increasing the proportion of users who click through to results |
| 2 | Button design | Filled/solid button | Outlined/ghost button | A high-contrast filled button has stronger visual salience and drives higher click-through than a subdued outline style |

Both tests use a two-proportion z-test (α = 0.025 per test, Bonferroni-corrected for 2 simultaneous comparisons). The results page unlocks once each variant accumulates ~234 sessions (pre-specified power analysis: 80% power to detect a 10 pp lift from a 50% baseline).

# How the page works

1. A visitor lands on the main page and is silently assigned to one list variant (A or B) and one button variant (A or B) — four possible combinations total.
2. Their assignment is stored server-side, tied to an httpOnly session cookie that persists for 7 days. Repeat visits always return the same variants.
3. They browse the facts. Scroll depth is tracked continuously. When they reach the end (scroll ≥ 80% / last item clicked), a `list_complete` event fires.
4. They click "See the Results". A `button_click` event fires. If depth wasn't already recorded, it's captured here too.
5. The stats page shows which variant they were in, prompts an optional demographic survey, then displays live experiment results.
6. Results are hidden behind a progress threshold — raw counts and a progress bar are shown until each variant has enough sessions. Once unlocked, full z-test output appears: p-value, z-stat, 95% CI, Cohen's h, and observed power.

Stats that haven't reached threshold yet show real data at reduced opacity. Toggle **Sample** on any card to preview what the full results will look like once the experiment concludes.

# How it was built

| Layer | Stack |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS v4 |
| Backend | Python + FastAPI + uvicorn |
| Database | SQLite via SQLAlchemy ORM |
| Statistics | `statsmodels` (z-test, power analysis), `scipy`, `numpy` |
| Rate limiting | `slowapi` |
| Hosting | Cloudflare Pages (frontend) + PythonAnywhere (backend) |

### Key backend endpoints

| Endpoint | What it does |
|---|---|
| `GET /api/assignment` | Assigns (or retrieves) variant pair for the session |
| `POST /api/events` | Records `list_complete`, `button_click`, `list_depth` events |
| `GET /api/demographics` | Returns whether current session submitted the survey |
| `POST /api/demographics` | Submits optional demographic survey (idempotent) |
| `GET /api/stats` | Returns live experiment results (requires valid session) |

### Statistical pipeline

- Power analysis runs once at startup to compute `REQUIRED_PER_VARIANT` (~234 at default settings)
- On each `/api/stats` request: two GROUP BY queries count assignments and conversions per variant
- If threshold is met: `proportions_ztest` + `proportion_effectsize` (Cohen's h) + observed power
- All four stats queries filter `is_synthetic = False` — seeded demo data is permanently invisible to the live results

# Running locally

**Prerequisites:** Python 3.11+ and Node 18+

```bash
# 1. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 2. Install dependencies (once)
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
npm install --prefix frontend

# 3. Run (two terminals, venv active in both)
make backend    # → http://localhost:8000
make frontend   # → http://localhost:3000

# Run tests
make test
```

## Development mode

Development mode enables a floating variant switcher panel (so you can preview all four combinations) and a "Reset survey" button on the stats page (useful since the cookie persists for 7 days).

```bash
make dev-backend    # terminal 1
make dev-frontend   # terminal 2
```

Dev mode is gated behind `NEXT_PUBLIC_DEV_TOOLS=true`, which only `make dev-frontend` sets. Running `make frontend` (the normal command) never shows dev tools, even on localhost.

To preview stats locally without real users:

```bash
cd backend && python seed_demo_data.py
```

This seeds 600 synthetic sessions (above the ~234/variant threshold). The stats page will show full results. All synthetic sessions are filtered out of `/api/stats` automatically when real users arrive — they don't contaminate the live experiment.

## Editing the content

Facts live in [frontend/lib/facts.ts](frontend/lib/facts.ts). Each item has `id`, `title`, and `body`. Add, remove, or reorder freely — both list variants adapt automatically to array length.

# Deploying

Both platforms are free and require no credit card.

## Backend — PythonAnywhere

1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com) (free account)
2. Open a **Bash console** and clone your repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO/backend
   pip install -r requirements.txt
   ```
3. Go to **Web** → **Add a new web app** → Manual configuration → Python 3.11
4. In the WSGI configuration file (linked from the Web tab), replace the contents with:
   ```python
   import sys
   sys.path.insert(0, '/home/YOUR_USERNAME/YOUR_REPO/backend')
   from wsgi import application
   ```
5. Set environment variables under **Web → Environment variables**:
   ```
   ENVIRONMENT=production
   FRONTEND_URL=https://YOUR_PROJECT.pages.dev   ← fill in after step below
   DB_PATH=/home/YOUR_USERNAME/factpage.db
   ALPHA=0.025
   POWER=0.80
   MDE=0.10
   BASELINE_CONVERSION=0.50
   TRUST_PROXY_HEADERS=true
   ```
   `TRUST_PROXY_HEADERS=true` enables per-user rate limiting. Without it, all visitors share the same gateway IP and rate limits apply to the server as a whole rather than per user.
6. Click **Reload**. Your backend is live at `https://YOUR_USERNAME.pythonanywhere.com`.

**To download your data:** PythonAnywhere dashboard → Files → navigate to `/home/YOUR_USERNAME/` → download `factpage.db`. Open it with [DB Browser for SQLite](https://sqlitebrowser.org/).

## Frontend — Cloudflare Pages

1. Sign up at [cloudflare.com](https://www.cloudflare.com) (free account)
2. Go to **Pages** → **Create a project** → connect your GitHub repo
3. Build settings:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Output directory:** `out`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://YOUR_USERNAME.pythonanywhere.com
   ```
5. Deploy. Your frontend is live at `https://YOUR_PROJECT.pages.dev`.

**Two final steps:**

1. Update `frontend/public/_headers` — replace the hardcoded `connect-src` URL with your own PythonAnywhere URL (e.g. `https://YOUR_USERNAME.pythonanywhere.com`), commit and push. Cloudflare will auto-redeploy. Note: Cloudflare Pages cannot inject environment variables into this file, so the URL must be set manually here.

2. Go back to PythonAnywhere and set `FRONTEND_URL` to your Cloudflare Pages URL, then reload.

## What the make commands do

| Command | Equivalent |
|---|---|
| `make backend` | `uvicorn main:app --app-dir backend --reload` |
| `make frontend` | `npm --prefix frontend run dev` |
| `make dev-backend` | same as backend (reload enabled) |
| `make dev-frontend` | `NEXT_PUBLIC_DEV_TOOLS=true npm --prefix frontend run dev` |
| `make test` | `pytest` (backend) + `npm test` (frontend Jest) |
