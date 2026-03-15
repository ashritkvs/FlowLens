"""
FlowLens Analytics Service — workflow metrics from tasks and task events.
All metrics are derived from MongoDB (tasks + taskevents); logic is kept
interview-friendly and modular.
"""
import os
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient

load_dotenv()

app = FastAPI(title="FlowLens Analytics")

# CORS: set CORS_ORIGINS to comma-separated list (e.g. https://app.vercel.app) or leave unset for "*"
_cors_origins = os.getenv("CORS_ORIGINS", "*").strip()
_origins_list = [o.strip() for o in _cors_origins.split(",") if o.strip()] if _cors_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
db = client[os.getenv("DB_NAME", "flowlens")]

STATUSES = ["Backlog", "In Progress", "Blocked", "Review", "Done"]


# ---------------------------------------------------------------------------
# Data loading (single place for DB access)
# ---------------------------------------------------------------------------

def load_tasks() -> list[dict[str, Any]]:
    return list(db.tasks.find())


def load_events() -> list[dict[str, Any]]:
    return list(db.taskevents.find())


def _ensure_datetime(d: Any) -> datetime:
    """Mongo may return datetime; ensure we have one for arithmetic."""
    if d is None:
        return datetime.utcnow()
    if hasattr(d, "total_seconds"):
        return d
    return d


# ---------------------------------------------------------------------------
# Helpers for event-based metrics (cycle time, lead time, time-in-status)
# ---------------------------------------------------------------------------

def _events_by_task(events: list[dict]) -> dict[str, list[dict]]:
    """Group events by taskId (as str) and sort by createdAt ascending."""
    by_task: dict[str, list[dict]] = defaultdict(list)
    for e in events:
        tid = str(e["taskId"]) if e.get("taskId") else None
        if tid:
            by_task[tid].append(e)
    for key in by_task:
        by_task[key].sort(key=lambda x: x.get("createdAt") or datetime.min)
    return dict(by_task)


def _completed_task_times(events_by_task: dict[str, list[dict]]) -> tuple[list[float], list[float]]:
    """
    For each task that reached Done, compute lead time (created -> done) and
    cycle time (first In Progress -> done). Returns (lead_days_list, cycle_days_list).
    """
    lead_days: list[float] = []
    cycle_days: list[float] = []
    now = datetime.utcnow()

    for _task_id, evs in events_by_task.items():
        if not evs:
            continue
        created_at: datetime | None = None
        done_at: datetime | None = None
        in_progress_at: datetime | None = None

        for e in evs:
            ts = _ensure_datetime(e.get("createdAt"))
            et = e.get("eventType") or ""
            to_s = e.get("toStatus")
            from_s = e.get("fromStatus")

            if et == "task_created":
                created_at = ts
                if to_s == "In Progress":
                    in_progress_at = in_progress_at or ts
            elif to_s == "Done" and done_at is None:
                done_at = ts
            elif to_s == "In Progress":
                in_progress_at = in_progress_at or ts

        if done_at is None:
            continue
        if created_at is None:
            created_at = evs[0].get("createdAt") or now
        lead_days.append((done_at - created_at).total_seconds() / 86400)

        start = in_progress_at or created_at
        cycle_days.append((done_at - start).total_seconds() / 86400)

    return lead_days, cycle_days


def _time_per_status(events_by_task: dict[str, list[dict]], tasks: list[dict]) -> dict[str, list[float]]:
    """
    For each status, list of days each task spent in that status (from events + current state).
    Returns dict status -> [day1, day2, ...] for tasks that ever entered that status.
    """
    # Build current status per task from tasks collection
    current_status: dict[str, str] = {str(t["_id"]): t["status"] for t in tasks}
    # Per-status list of durations in days
    status_durations: dict[str, list[float]] = defaultdict(list)
    now = datetime.utcnow()

    for task_id, evs in events_by_task.items():
        if not evs:
            continue
        # Timeline: (from_status, to_status, at_time)
        timeline: list[tuple[str | None, str, datetime]] = []
        for e in evs:
            ts = _ensure_datetime(e.get("createdAt"))
            to_s = e.get("toStatus")
            from_s = e.get("fromStatus")
            if to_s:
                timeline.append((from_s, to_s, ts))
        # Close the last segment: task "leaves" its current status at now
        cur = current_status.get(task_id)
        if cur:
            timeline.append((cur, "_end", now))

        # Sort by time
        timeline.sort(key=lambda x: x[2])
        # Compute time in each status: when we have (from, to, t), from left at t, to entered at t
        # So we need: for each segment where status S is "active", from entry to exit
        # Entry: event where toStatus == S at t1. Exit: next event where fromStatus == S at t2, or now.
        i = 0
        while i < len(timeline):
            from_s, to_s, t_entry = timeline[i]
            # to_s is the status we're entering at t_entry
            # Find exit: next event where fromStatus == to_s, or end
            t_exit = now
            for j in range(i + 1, len(timeline)):
                f, _to, t = timeline[j]
                if f == to_s:
                    t_exit = t
                    break
            dur_days = (t_exit - t_entry).total_seconds() / 86400
            if dur_days > 0 and to_s != "_end":
                status_durations[to_s].append(dur_days)
            i += 1

    return dict(status_durations)


# ---------------------------------------------------------------------------
# Overview & existing endpoints
# ---------------------------------------------------------------------------

def serialize_task(task: dict[str, Any]) -> dict[str, Any]:
    created = task.get("createdAt")
    age_sec = (datetime.utcnow() - _ensure_datetime(created)).total_seconds()
    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "status": task["status"],
        "priority": task["priority"],
        "assignee": task.get("assignee", "Unassigned"),
        "blocked": task.get("blocked", False),
        "ageDays": round(age_sec / 86400, 1),
        "dueDate": task.get("dueDate"),
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "flowlens-analytics"}


@app.get("/analytics/overview")
def overview() -> dict[str, Any]:
    tasks = load_tasks()
    total = len(tasks)
    done = sum(1 for t in tasks if t["status"] == "Done")
    blocked = sum(1 for t in tasks if t.get("blocked") or t["status"] == "Blocked")
    overdue = sum(
        1
        for t in tasks
        if t.get("dueDate") and t["dueDate"] < datetime.utcnow() and t["status"] != "Done"
    )
    avg_age = (
        round(
            sum(
                (datetime.utcnow() - _ensure_datetime(t.get("createdAt"))).total_seconds() / 86400
                for t in tasks
            )
            / total,
            1,
        )
        if total
        else 0
    )

    # Cycle time & lead time from events (average over completed tasks)
    events = load_events()
    by_task = _events_by_task(events)
    lead_days, cycle_days = _completed_task_times(by_task)
    avg_lead = round(sum(lead_days) / len(lead_days), 1) if lead_days else 0
    avg_cycle = round(sum(cycle_days) / len(cycle_days), 1) if cycle_days else 0

    return {
        "totalTasks": total,
        "doneTasks": done,
        "blockedTasks": blocked,
        "overdueTasks": overdue,
        "averageTaskAgeDays": avg_age,
        "averageLeadTimeDays": avg_lead,
        "averageCycleTimeDays": avg_cycle,
    }


@app.get("/analytics/status-breakdown")
def status_breakdown() -> list[dict[str, Any]]:
    tasks = load_tasks()
    counts = Counter(t["status"] for t in tasks)
    return [{"status": s, "count": counts.get(s, 0)} for s in STATUSES]


@app.get("/analytics/throughput")
def throughput() -> list[dict[str, Any]]:
    """
    Completions per day only. Uses task_completed and task_status_changed (toStatus=Done).
    No fallback to task creation — if there are no completions, returns an empty list.
    """
    events = load_events()
    bucket: dict[str, int] = defaultdict(int)
    for e in events:
        if e.get("eventType") == "task_completed":
            ts = e.get("createdAt")
            if ts:
                key = _ensure_datetime(ts).strftime("%Y-%m-%d")
                bucket[key] += 1
        elif e.get("eventType") == "task_status_changed" and e.get("toStatus") == "Done":
            ts = e.get("createdAt")
            if ts:
                key = _ensure_datetime(ts).strftime("%Y-%m-%d")
                bucket[key] += 1
    return [{"date": date, "count": bucket[date]} for date in sorted(bucket.keys())]


@app.get("/analytics/aging")
def aging() -> list[dict[str, Any]]:
    tasks = load_tasks()
    return [serialize_task(t) for t in tasks]


@app.get("/analytics/risk")
def risk() -> list[dict[str, Any]]:
    tasks = load_tasks()
    risky = []
    now = datetime.utcnow()

    for task in tasks:
        created = task.get("createdAt")
        age_days = (now - _ensure_datetime(created)).total_seconds() / 86400 if created else 0
        score = 0
        reasons = []

        if age_days > 5:
            score += 3
            reasons.append("Task is aging")
        if task["status"] in ["Blocked", "Review"]:
            score += 2
            reasons.append(f"Task is currently in {task['status']}")
        if task.get("priority") in ["High", "Critical"]:
            score += 1
            reasons.append("High priority task")
        due_date = task.get("dueDate")
        if due_date and due_date < now and task["status"] != "Done":
            score += 3
            reasons.append("Due date has passed")

        if score >= 3:
            risky.append(
                {
                    "id": str(task["_id"]),
                    "title": task["title"],
                    "score": score,
                    "status": task["status"],
                    "assignee": task.get("assignee", "Unassigned"),
                    "reasons": reasons,
                }
            )

    risky.sort(key=lambda item: item["score"], reverse=True)
    return risky


# ---------------------------------------------------------------------------
# New endpoints: time-in-status, bottlenecks, workload
# ---------------------------------------------------------------------------

@app.get("/analytics/time-in-status")
def time_in_status() -> list[dict[str, Any]]:
    """
    Average number of days tasks spent in each status (from event history).
    Useful for identifying where work sits longest.
    """
    tasks = load_tasks()
    events = load_events()
    by_task = _events_by_task(events)
    status_durations = _time_per_status(by_task, tasks)

    result = []
    for status in STATUSES:
        days_list = status_durations.get(status, [])
        avg = round(sum(days_list) / len(days_list), 1) if days_list else 0
        result.append({"status": status, "averageDays": avg, "taskCount": len(days_list)})
    return result


@app.get("/analytics/bottlenecks")
def bottlenecks() -> list[dict[str, Any]]:
    """
    Per-status counts and average time spent. The "bottleneck" is the stage
    with the highest current count; optionally also flag longest avg time.
    """
    tasks = load_tasks()
    events = load_events()
    by_task = _events_by_task(events)
    status_durations = _time_per_status(by_task, tasks)
    counts = Counter(t["status"] for t in tasks)

    rows = []
    for status in STATUSES:
        days_list = status_durations.get(status, [])
        avg_days = round(sum(days_list) / len(days_list), 1) if days_list else 0
        count = counts.get(status, 0)
        rows.append({
            "status": status,
            "count": count,
            "averageDaysInStatus": avg_days,
            "taskCountWithHistory": len(days_list),
        })

    # Single bottleneck: status with highest count; if tie, highest averageDaysInStatus
    if rows:
        max_count = max(r["count"] for r in rows)
        candidates = [r for r in rows if r["count"] == max_count and max_count > 0]
        bottleneck_status = (
            max(candidates, key=lambda x: (x["averageDaysInStatus"], STATUSES.index(x["status"])))
            if candidates
            else None
        )
        for r in rows:
            r["isBottleneck"] = bottleneck_status and r["status"] == bottleneck_status["status"]

    return rows


@app.get("/analytics/workload")
def workload() -> list[dict[str, Any]]:
    """Task count per assignee (current state)."""
    tasks = load_tasks()
    counts: dict[str, int] = defaultdict(int)
    for t in tasks:
        assignee = (t.get("assignee") or "Unassigned").strip() or "Unassigned"
        counts[assignee] += 1
    return [{"assignee": a, "count": c} for a, c in sorted(counts.items(), key=lambda x: -x[1])]
