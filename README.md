# FlowLens

FlowLens is a free full-stack workflow analytics dashboard built for learning and portfolio use.

## Stack
- Frontend: React + TypeScript + Vite + D3.js
- App API: Node.js + Express + Mongoose
- Analytics API: Python + FastAPI
- Database: MongoDB (local Docker or MongoDB Atlas free tier)

## What it does
- Create and update tasks
- Track immutable task events
- Show analytics cards and D3 charts
- Compute workflow metrics in a separate Python analytics service

## Project structure
- `client/` React frontend
- `server/` Express API for tasks and events
- `analytics/` FastAPI analytics service

## Beginner setup
### 1) Install software
- Node.js 20+
- Python 3.11+
- Docker Desktop (recommended for free local MongoDB)

### 2) Start MongoDB locally
At the root:

```bash
docker compose up -d mongo
```

This starts MongoDB on `mongodb://localhost:27017/flowlens`.

### 3) Start the Express API
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Runs on `http://localhost:4000`.

### 4) Start the FastAPI analytics service
```bash
cd analytics
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Runs on `http://localhost:8000`.

### 5) Start the React frontend
```bash
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Docker (backend + optional frontend)
Run MongoDB, Express, and FastAPI in containers:

```bash
docker compose up -d
# API: http://localhost:4000  |  Analytics: http://localhost:8000
```

Run the frontend locally (`cd client && npm run dev`) and open http://localhost:5173.

To also serve the built frontend from Docker:

```bash
docker compose --profile with-frontend up -d
# Frontend: http://localhost:3000
```

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full Docker and production deployment (Vercel, Render/Railway, MongoDB Atlas).

## Seed data
The server automatically seeds a few tasks if the database is empty.

## Main endpoints
### Express
- `GET /api/health`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/events`

### FastAPI
- `GET /health`
- `GET /analytics/overview`
- `GET /analytics/throughput`
- `GET /analytics/status-breakdown`
- `GET /analytics/aging`
- `GET /analytics/risk`

## Deployment

FlowLens is built for free-tier deployment: **Frontend → Vercel**, **Backend → Render**, **Analytics → Render**, **Database → MongoDB Atlas**.

### 1. Database — MongoDB Atlas
- Create a [free cluster](https://www.mongodb.com/atlas) and a database user.
- Get the connection string. Create a database named `flowlens` (or use your own and set `DB_NAME` in analytics).
- **Express** needs the URI **with** the database: `mongodb+srv://...mongodb.net/flowlens?retryWrites=true&w=majority`.
- **Analytics** needs the URI **without** the path: `mongodb+srv://...mongodb.net/` and `DB_NAME=flowlens`.

### 2. Backend — Render (Express)
- New **Web Service**; connect your repo. Root directory: **server**.
- **Build command:** `npm install` (or leave default).
- **Start command:** `node src/index.js`.
- **Environment variables:**  
  `PORT` (Render sets this), `MONGODB_URI` (Atlas URI with DB name), `CLIENT_ORIGIN` (your Vercel app URL, e.g. `https://flowlens-xxx.vercel.app`).
- Deploy and copy the service URL (e.g. `https://flowlens-api.onrender.com`).

### 3. Analytics — Render (FastAPI)
- New **Web Service**; connect the same repo. Root directory: **analytics**.
- **Build command:** `pip install -r requirements.txt`.
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Environment variables:**  
  `MONGODB_URI` (Atlas URI without DB path), `DB_NAME=flowlens`, `CORS_ORIGINS` (your Vercel app URL), `PORT` (Render sets this).
- Deploy and copy the service URL (e.g. `https://flowlens-analytics.onrender.com`).

### 4. Frontend — Vercel
- Import the repo at [vercel.com](https://vercel.com). Set **Root Directory** to **client**.
- **Build command:** `npm run build`. **Output directory:** `dist`.
- **Environment variables (required for production):**  
  `VITE_API_URL` = your Render backend URL, `VITE_ANALYTICS_URL` = your Render analytics URL.
- Deploy. Vercel will build with these URLs; no localhost in the production bundle.

### 5. CORS
- Set **CLIENT_ORIGIN** (Express) and **CORS_ORIGINS** (Analytics) to your exact Vercel URL (no trailing slash). This allows the browser to call your APIs from the deployed frontend.

---

## Live Demo Instructions

1. **Before the interview:** Deploy once (Vercel + Render + Atlas) so the live app and API URLs are ready. Optionally run `docker compose up -d` and the client locally to confirm everything works.
2. **During the demo:** Open the Vercel URL. Show creating a task, changing status, filters, and the analytics charts. Use the observability panel to show backend/analytics status and refresh.
3. **If something is down:** Use the Refresh button; if Render free services are sleeping, the first request may take 30–60 seconds. You can briefly show the local setup (`docker compose up -d` + `npm run dev` in client) as a fallback.
4. **Talking points:** Event-driven task history, separate analytics service, D3 for custom charts, env-based config and CORS for deployment.

---

## Interview angle
FlowLens separates transactional task operations from analytical computation. Express handles CRUD and event logging, FastAPI computes metrics and explainability, MongoDB stores current state plus event history, and React + D3 renders interactive visual analytics.
