# FlowLens — Deployment & Docker Guide

## Local Docker (recommended for full stack)

### Backend only (mongo + server + analytics)

```bash
# From project root
docker compose up -d

# Services:
# - MongoDB     http://localhost:27017
# - Express API  http://localhost:4000  (health: GET /api/health)
# - Analytics   http://localhost:8000  (health: GET /health)
```

Run the frontend on your machine so it can use `http://localhost:4000` and `http://localhost:8000`:

```bash
cd client
cp .env.example .env
npm install && npm run dev
# Open http://localhost:5173
```

Set in `client/.env`: `VITE_API_URL=http://localhost:4000`, `VITE_ANALYTICS_URL=http://localhost:8000` (these are the defaults).

### Full stack including frontend in Docker

```bash
docker compose --profile with-frontend up -d
```

- Frontend (built at image build time) is served at **http://localhost:3000**.
- The built app is configured to call `http://localhost:4000` (server) and `http://localhost:8000` (analytics).

To use different API URLs for the built frontend, set before building:

```bash
export VITE_API_URL=http://localhost:4000
export VITE_ANALYTICS_URL=http://localhost:8000
docker compose --profile with-frontend up -d --build
```

### Stop and clean

```bash
docker compose --profile with-frontend down
docker compose down -v   # also remove mongo volume
```

---

## Production deployment (free tier)

### 1. Database — MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow access from anywhere (or add Render/Railway IPs if you restrict later).
3. Get the connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/`).
4. Create a database named `flowlens` (or set `DB_NAME` to your name).

**Connection string format:**  
- For **Express**: use the full URI including database, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/flowlens?retryWrites=true&w=majority`.  
- For **Analytics**: use the same base URI **without** the path (Atlas puts DB in the path); set `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/` and `DB_NAME=flowlens`.

### 2. Frontend — Vercel

1. Push the repo to GitHub and import the project in [vercel.com](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Build command: `npm run build`. Output directory: `dist`.
4. **Environment variables** (Vercel → Project → Settings → Environment Variables):

   | Name               | Value                          |
   |--------------------|--------------------------------|
   | `VITE_API_URL`     | `https://your-api.onrender.com` (or your Railway URL) |
   | `VITE_ANALYTICS_URL` | `https://your-analytics.onrender.com` (or your Railway URL) |

5. Deploy. Your app URL will be like `https://flowlens-xxx.vercel.app`.

### 3. Backend (Express) — Render or Railway

**Render**

1. New → Web Service; connect the repo.
2. Root directory: `server` (or build from root with context `server`).
3. Build: `npm ci` (or no build if you use a pre-built image).
4. Start: `node src/index.js` (or use the server Dockerfile and start command).
5. Add environment variables:

   | Name           | Value |
   |----------------|--------|
   | `PORT`         | `4000` (Render often assigns PORT; use it) |
   | `MONGODB_URI`  | Atlas URI **with** database name, e.g. `mongodb+srv://...mongodb.net/flowlens?retryWrites=true&w=majority` |
   | `CLIENT_ORIGIN`| Your Vercel URL, e.g. `https://flowlens-xxx.vercel.app` |

6. Deploy. Note the URL (e.g. `https://flowlens-api.onrender.com`).

**Railway**

1. New Project → Deploy from GitHub; select repo.
2. Add service from `server` directory (or use Dockerfile).
3. Set env: `PORT` (Railway sets it), `MONGODB_URI` (with DB name), `CLIENT_ORIGIN` (Vercel URL).
4. Deploy and copy the public URL.

**CORS:** Setting `CLIENT_ORIGIN` to the exact Vercel URL (no trailing slash) ensures the browser can call your API. Do not use `*` in production for the Express server if you care about restricting origins.

### 4. Analytics (FastAPI) — Render or Railway

**Render**

1. New → Web Service; connect same repo.
2. Root directory: `analytics`.
3. Build: `pip install -r requirements.txt` (or use the analytics Dockerfile).
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (Render sets `PORT`).
5. Environment variables:

   | Name          | Value |
   |---------------|--------|
   | `MONGODB_URI` | Atlas URI **without** database path, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/` |
   | `DB_NAME`     | `flowlens` |
   | `CORS_ORIGINS`| Your Vercel URL, e.g. `https://flowlens-xxx.vercel.app` (or `*` for open; not recommended in production) |

**Railway**

1. Add another service from `analytics` (or Dockerfile).
2. Set `MONGODB_URI`, `DB_NAME`, `CORS_ORIGINS` (Vercel URL).
3. Deploy and note the URL.

**CORS:** For production, set `CORS_ORIGINS` to your frontend origin (e.g. the Vercel URL). Multiple origins: comma-separated, no spaces (e.g. `https://app.vercel.app,https://www.app.vercel.app`).

### 5. Wire everything together

1. **Vercel:** Set `VITE_API_URL` and `VITE_ANALYTICS_URL` to the deployed Express and Analytics URLs. Redeploy so the build picks them up.
2. **Express:** Set `CLIENT_ORIGIN` to your Vercel URL (e.g. `https://flowlens-xxx.vercel.app`).
3. **Analytics:** Set `CORS_ORIGINS` to that same Vercel URL (or list of origins).

No localhost: all production traffic uses the public URLs above.

---

## Environment variable reference

| Service   | Variable        | Local (Docker)              | Production |
|----------|-----------------|-----------------------------|------------|
| Client   | `VITE_API_URL`  | `http://localhost:4000`     | Backend URL (e.g. Render) |
| Client   | `VITE_ANALYTICS_URL` | `http://localhost:8000` | Analytics URL (e.g. Render) |
| Server   | `PORT`          | `4000`                     | Set by host or `4000` |
| Server   | `MONGODB_URI`   | `mongodb://mongo:27017/flowlens` | Atlas URI **with** DB name |
| Server   | `CLIENT_ORIGIN` | `http://localhost:5173`     | Vercel URL |
| Analytics | `MONGODB_URI`  | `mongodb://mongo:27017/`    | Atlas URI **no** DB path |
| Analytics | `DB_NAME`      | `flowlens`                 | `flowlens` |
| Analytics | `CORS_ORIGINS` | `*`                         | Vercel URL (or list) |

---

## Checklist

- [ ] MongoDB Atlas cluster created and connection string copied.
- [ ] Express deployed; `MONGODB_URI` (with DB) and `CLIENT_ORIGIN` (Vercel) set.
- [ ] Analytics deployed; `MONGODB_URI`, `DB_NAME`, `CORS_ORIGINS` (Vercel) set.
- [ ] Vercel project has `VITE_API_URL` and `VITE_ANALYTICS_URL` set to backend and analytics URLs.
- [ ] One redeploy of the Vercel app after setting env vars so the build uses them.
- [ ] No hardcoded localhost in production config; all URLs from env.
