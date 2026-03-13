# FactPage

FactPage is a very benign fact-browsing page. Look through Facts until you are bored or we run out of new Facts. Then, click on a button to get more Facts... or rather stats about users browsing fact page.

Each user is presented with a webpage that has one of four possible design combinations. Interactions with the page are recorded and used to do a nifty A/B test that users are welcome to peruse. 

Seeing empty stats? Don't worry, we just haven't gotten enough users yet. FactPage will grow as the users do. *Note: To preview stats locally without real users, run `python seed_demo_data.py` from the `backend/` directory.*

# How it works

Mix together a SQLite database, a fastAPI+uvicorn supported backend, some analytics and a Next.js frontend. Et voila - FactPage.

## SQLite

- Used to store sessions and events
- `backend/factpage.db` is created automatically on the first run

## Backend

- `/api/assignment/` - assigns A/B testing variants
- `/api/events/` - records user interactions with the page
- `/api/stats/` - returns live experiment results

## Analytics

- Two proportion z-test per experiment
- Unlocks once each variant has ~197 independent sessions (power analysis: α=0.05, power=0.80, MDE=10%)
- Stats recomputed on every request or 30s auto-refresh

## Next.js

- App router
    - *Main* page hosts the Facts in the assigned variant, either list or button
    - *Stats* shows live results with 30s auto-refresh

# Running FactPage

Prerequisites: Python 3.11+ and Node 18+

1. Copy and fill in env files:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.local.example frontend/.env.local`

2. Install dependencies (once):
   - Backend: `python -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt`
   - Frontend: `npm install --prefix frontend`

3. Run (each in its own terminal, venv active):
   - Activate backend venv `source .venv/bin/activate`
   - `make backend`   → http://localhost:8000
And
   - `make frontend`  → http://localhost:3000

To run tests, from root: `make test`

## What do these commands do?

- `make backend` is the equivalent of running `uvicorn main:app --app-dir backend --reload` 
- `make frontend` is the equivalent of running `npm --prefix frontend run dev`
- `make test` is the equivalent of running `pytest` at root

# Coming Next

- Real Facts
- Deployment with Vercel and Render
- Further analytics