import {
  AgingTask,
  Overview,
  RiskTask,
  StatusBreakdownItem,
  Task,
  ThroughputPoint,
  BottleneckItem,
  WorkloadItem,
  TaskFilters,
} from '../types';

// In production (Vercel), set VITE_API_URL and VITE_ANALYTICS_URL. No hardcoded localhost in build.
const SERVER_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '');
const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function buildTasksQuery(filters?: TaskFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.assignee) params.set('assignee', filters.assignee);
  if (filters.search) params.set('search', filters.search);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const api = {
  getTasks: (filters?: TaskFilters) =>
    request<Task[]>(`${SERVER_URL}/api/tasks${buildTasksQuery(filters)}`),
  createTask: (payload: Partial<Task>) =>
    request<Task>(`${SERVER_URL}/api/tasks`, { method: 'POST', body: JSON.stringify(payload) }),
  updateTask: (id: string, payload: Partial<Task>) =>
    request<Task>(`${SERVER_URL}/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTask: (id: string) =>
    request<{ deleted: boolean; id: string }>(`${SERVER_URL}/api/tasks/${id}`, { method: 'DELETE' }),
  getEvents: (taskId?: string) => {
    const q = taskId ? `?taskId=${encodeURIComponent(taskId)}` : '';
    return request<{ _id: string; taskId: string; eventType: string; createdAt: string }[]>(
      `${SERVER_URL}/api/events${q}`
    );
  },

  getOverview: () => request<Overview>(`${ANALYTICS_URL}/analytics/overview`),
  getStatusBreakdown: () =>
    request<StatusBreakdownItem[]>(`${ANALYTICS_URL}/analytics/status-breakdown`),
  getThroughput: () => request<ThroughputPoint[]>(`${ANALYTICS_URL}/analytics/throughput`),
  getAging: () => request<AgingTask[]>(`${ANALYTICS_URL}/analytics/aging`),
  getRisk: () => request<RiskTask[]>(`${ANALYTICS_URL}/analytics/risk`),
  getBottlenecks: () => request<BottleneckItem[]>(`${ANALYTICS_URL}/analytics/bottlenecks`),
  getWorkload: () => request<WorkloadItem[]>(`${ANALYTICS_URL}/analytics/workload`),

  getBackendHealth: () => request<{ ok: boolean }>(`${SERVER_URL}/api/health`),
  getAnalyticsHealth: () => request<{ ok: boolean }>(`${ANALYTICS_URL}/health`),
};
