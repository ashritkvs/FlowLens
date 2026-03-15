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

## Free deployment ideas
- Frontend: Vercel or Netlify free tier
- Express API: Render free tier
- FastAPI: Render free tier
- Database: MongoDB Atlas free tier

## Interview angle
FlowLens separates transactional task operations from analytical computation. Express handles CRUD and event logging, FastAPI computes metrics and explainability, MongoDB stores current state plus event history, and React + D3 renders interactive visual analytics.
