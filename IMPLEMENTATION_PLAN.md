# FlowLens — Implementation Plan

Based on the codebase audit. Work is incremental; existing architecture and naming are preserved.

---

## Phase 1: Backend completion (Express)

| Action | File |
|--------|------|
| Modify | `server/src/routes/tasks.js` — Add DELETE `/api/tasks/:id`; add GET query params (status, priority, assignee, search, dateFrom, dateTo); expand PATCH to support all editable fields; emit `task_updated`, `task_deleted`, `task_assigned`, `task_completed` where appropriate |
| Modify | `server/src/utils/seed.js` — Richer demo data (more tasks, varied statuses/dates); add `task_status_changed` and other events so analytics/charts look realistic |

No new files. Models and index unchanged.

---

## Phase 2: Analytics completion (FastAPI)

| Action | File |
|--------|------|
| Modify | `analytics/app/main.py` — Add CORS middleware; add `GET /analytics/bottlenecks`; add `GET /analytics/workload`; fix throughput fallback (no “created” fallback as throughput); optionally add cycle time / lead time / avg time per status |

No new files unless we split routes (optional later).

---

## Phase 3: Client — filters, search, edit, delete

| Action | File |
|--------|------|
| Modify | `client/src/api/index.ts` — Add `deleteTask`, optional `getEvents`; use `import.meta.env.VITE_*` for base URLs with localhost fallback |
| Modify | `client/src/App.tsx` — Manage filter state; pass filters to `getTasks`; add delete/edit handlers; optional refresh button and last-refresh time |
| Create or modify | `client/src/components/TaskTable.tsx` — Add edit (inline or modal), delete button; optional block toggle |
| Create | `client/src/components/FilterToolbar.tsx` — Status, priority, assignee, search input, date range; clear filters |

Types: extend or reuse existing `Task`; no new types required for filters (query params).

---

## Phase 4: Missing D3 charts + empty states

| Action | File |
|--------|------|
| Create | `client/src/components/BottleneckChart.tsx` — D3 visualization for bottleneck data from `/analytics/bottlenecks` |
| Create | `client/src/components/WorkloadChart.tsx` — D3 assignee workload from `/analytics/workload` |
| Modify | `client/src/components/StatusBarChart.tsx` — Empty state when no data or all zeros |
| Modify | `client/src/components/ThroughputLineChart.tsx` — Empty state when data.length === 0 |
| Modify | `client/src/components/AgingScatterChart.tsx` — Empty state when data.length === 0 |
| Modify | `client/src/api/index.ts` — Add `getBottlenecks`, `getWorkload` |
| Modify | `client/src/types/index.ts` — Add types for bottleneck and workload responses |
| Modify | `client/src/App.tsx` — Render new charts; pass new data from state |

---

## Phase 5: Observability panel

| Action | File |
|--------|------|
| Create | `client/src/components/ObservabilityPanel.tsx` — Backend health, analytics health, last refresh time, event count; optional data-integrity warning |
| Modify | `client/src/App.tsx` — Add panel; call `/api/health` and analytics `/health`; track last refresh; optionally `GET /api/events` for count |

---

## Phase 6: Docker

| Action | File |
|--------|------|
| Create | `server/Dockerfile` — Node image; install deps; run `node src/index.js` |
| Create | `analytics/Dockerfile` — Python image; install deps; run uvicorn |
| Modify | `docker-compose.yml` — Add services: server (depends on mongo), analytics (depends on mongo); env for MONGODB_URI; expose ports 4000, 8000 |

Frontend can remain `npm run dev` locally or add optional client Dockerfile later.

---

## Phase 7: Deployment readiness

| Action | File |
|--------|------|
| Create | `client/.env.example` — `VITE_API_URL`, `VITE_ANALYTICS_URL` |
| Modify | `client/vite.config.ts` — No localhost hardcode; use env in build |
| Modify | `README.md` — Add deployment section: Vercel (client), Render/Railway (server + analytics), MongoDB Atlas; env vars table |

---

## Phase 8: README and interview documentation

| Action | File |
|--------|------|
| Modify | `README.md` — Architecture diagram/section; feature summary; demo flow; screenshots placeholders; interview talking points; setup and run instructions consolidated |

---

## Execution order

1. **Phase 1** (backend) — done in Step 3.
2. Phase 2 (analytics).
3. Phase 3 (client filters/search/edit/delete).
4. Phase 4 (charts + empty states).
5. Phase 5 (observability).
6. Phase 6 (Docker).
7. Phase 7 (deployment).
8. Phase 8 (README).
