export type Task = {
  _id: string;
  title: string;
  description: string;
  status: 'Backlog' | 'In Progress' | 'Blocked' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignee: string;
  dueDate: string | null;
  blocked: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TaskFilters = {
  status?: string;
  priority?: string;
  assignee?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type Overview = {
  totalTasks: number;
  doneTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  averageTaskAgeDays: number;
  averageLeadTimeDays?: number;
  averageCycleTimeDays?: number;
};

export type StatusBreakdownItem = {
  status: string;
  count: number;
};

export type ThroughputPoint = {
  date: string;
  count: number;
};

export type AgingTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  blocked: boolean;
  ageDays: number;
};

export type RiskTask = {
  id: string;
  title: string;
  score: number;
  status: string;
  assignee: string;
  reasons: string[];
};

export type BottleneckItem = {
  status: string;
  count: number;
  averageDaysInStatus: number;
  taskCountWithHistory: number;
  isBottleneck: boolean;
};

export type WorkloadItem = {
  assignee: string;
  count: number;
};
