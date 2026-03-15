import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import AgingScatterChart from './components/AgingScatterChart';
import BottleneckChart from './components/BottleneckChart';
import FilterToolbar from './components/FilterToolbar';
import KpiCards from './components/KpiCards';
import ObservabilityPanel from './components/ObservabilityPanel';
import StatusBarChart from './components/StatusBarChart';
import TaskForm from './components/TaskForm';
import TaskTable from './components/TaskTable';
import ThroughputLineChart from './components/ThroughputLineChart';
import WorkloadChart from './components/WorkloadChart';
import EditTaskModal from './components/EditTaskModal';
import {
  AgingTask,
  BottleneckItem,
  Overview,
  RiskTask,
  StatusBreakdownItem,
  Task,
  TaskFilters,
  ThroughputPoint,
  WorkloadItem,
} from './types';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [statusData, setStatusData] = useState<StatusBreakdownItem[]>([]);
  const [throughput, setThroughput] = useState<ThroughputPoint[]>([]);
  const [aging, setAging] = useState<AgingTask[]>([]);
  const [risk, setRisk] = useState<RiskTask[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckItem[]>([]);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [analyticsOk, setAnalyticsOk] = useState<boolean | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [
        taskList,
        overviewData,
        statusBreakdown,
        throughputData,
        agingData,
        riskData,
        bottlenecksData,
        workloadData,
        eventsData,
      ] = await Promise.all([
        api.getTasks(filters),
        api.getOverview(),
        api.getStatusBreakdown(),
        api.getThroughput(),
        api.getAging(),
        api.getRisk(),
        api.getBottlenecks(),
        api.getWorkload(),
        api.getEvents().catch(() => []),
      ]);
      setTasks(taskList);
      setOverview(overviewData);
      setStatusData(statusBreakdown);
      setThroughput(throughputData);
      setAging(agingData);
      setRisk(riskData);
      setBottlenecks(bottlenecksData);
      setWorkload(workloadData);
      setEventCount(Array.isArray(eventsData) ? eventsData.length : null);
      setLastRefresh(new Date());
      setBackendOk(true);
      setAnalyticsOk(true);
    } catch (err) {
      console.error(err);
      setError('Could not load FlowLens. Ensure backend and analytics services are running.');
      setBackendOk(false);
      setAnalyticsOk(false);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const t = setInterval(() => {
      api.getBackendHealth().then(() => setBackendOk(true)).catch(() => setBackendOk(false));
      api.getAnalyticsHealth().then(() => setAnalyticsOk(true)).catch(() => setAnalyticsOk(false));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  async function handleCreateTask(payload: {
    title: string;
    description: string;
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
  }) {
    await api.createTask({
      ...payload,
      status: payload.status as Task['status'],
      priority: payload.priority as Task['priority'],
      dueDate: payload.dueDate || null,
      blocked: payload.status === 'Blocked',
      tags: [],
    });
    await loadDashboard();
  }

  async function handleStatusChange(task: Task, nextStatus: Task['status']) {
    await api.updateTask(task._id, { status: nextStatus, blocked: nextStatus === 'Blocked' });
    await loadDashboard();
  }

  async function handleEditSave(id: string, payload: Partial<Task>) {
    await api.updateTask(id, payload);
    setEditingTask(null);
    await loadDashboard();
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await api.deleteTask(task._id);
    await loadDashboard();
  }

  async function handleBlockedToggle(task: Task) {
    await api.updateTask(task._id, { blocked: !task.blocked });
    await loadDashboard();
  }

  return (
    <div className="page">
      <header className="hero card">
        <div>
          <div className="eyebrow">Workflow analytics platform</div>
          <h1>FlowLens</h1>
          <p className="muted hero-sub">
            Track tasks, events, throughput, and bottlenecks. React, D3, Express, FastAPI, MongoDB.
          </p>
        </div>
      </header>

      <ObservabilityPanel
        backendOk={backendOk}
        analyticsOk={analyticsOk}
        lastRefresh={lastRefresh}
        eventCount={eventCount}
        onRefresh={loadDashboard}
        refreshing={loading}
      />

      {error && <div className="error-banner">{error}</div>}
      {loading && !lastRefresh ? (
        <div className="card loading-card">Loading dashboard…</div>
      ) : (
        <KpiCards overview={overview} />
      )}

      <FilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        onClear={() => setFilters({})}
      />

      <section className="layout-grid">
        <TaskForm onCreate={handleCreateTask} />
        <TaskTable
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onEdit={setEditingTask}
          onDelete={handleDelete}
          onBlockedToggle={handleBlockedToggle}
        />
      </section>

      <section className="chart-grid">
        <div className="card chart-card">
          <h3>Status Breakdown</h3>
          <StatusBarChart data={statusData} loading={loading} error={!!error} />
        </div>
        <div className="card chart-card">
          <h3>Throughput Over Time</h3>
          <ThroughputLineChart data={throughput} loading={loading} error={!!error} />
        </div>
        <div className="card chart-card">
          <h3>Bottleneck</h3>
          <BottleneckChart data={bottlenecks} loading={loading} error={!!error} />
        </div>
        <div className="card chart-card">
          <h3>Assignee Workload</h3>
          <WorkloadChart data={workload} loading={loading} error={!!error} />
        </div>
        <div className="card chart-card wide-card">
          <h3>Task Aging vs Priority</h3>
          <AgingScatterChart data={aging} loading={loading} error={!!error} />
        </div>
        <div className="card chart-card wide-card">
          <h3>At-Risk Tasks</h3>
          <div className="risk-list">
            {loading ? (
              <div className="muted">Loading…</div>
            ) : risk.length === 0 ? (
              <div className="muted">No risky tasks right now.</div>
            ) : (
              risk.map((item) => (
                <div key={item.id} className="risk-item">
                  <div>
                    <strong>{item.title}</strong>
                    <div className="muted small">
                      {item.assignee} • {item.status} • score {item.score}
                    </div>
                  </div>
                  <ul>
                    {item.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleEditSave}
      />
    </div>
  );
}
