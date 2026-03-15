import Task from '../models/Task.js';
import TaskEvent from '../models/TaskEvent.js';

const now = new Date();
const day = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

const sampleTasks = [
  {
    title: 'Design dashboard filters',
    description: 'Add date, assignee, and priority filters to analytics page.',
    status: 'In Progress',
    priority: 'High',
    assignee: 'Ashrit',
    dueDate: day(4),
    tags: ['frontend', 'ux']
  },
  {
    title: 'Fix review stage bottleneck',
    description: 'Investigate why review tasks are taking too long.',
    status: 'Review',
    priority: 'Critical',
    assignee: 'Priya',
    dueDate: day(2),
    tags: ['analytics', 'process']
  },
  {
    title: 'Build risk scoring endpoint',
    description: 'Return at-risk tasks based on age and blocked count.',
    status: 'Blocked',
    priority: 'High',
    assignee: 'Lee',
    dueDate: day(1),
    blocked: true,
    tags: ['backend', 'python']
  },
  {
    title: 'Ship throughput chart',
    description: 'Visualize completed tasks over time with D3.',
    status: 'Done',
    priority: 'Medium',
    assignee: 'Sara',
    dueDate: day(-1),
    tags: ['d3', 'charts']
  },
  {
    title: 'Add observability panel',
    description: 'Show backend/analytics health and last refresh time.',
    status: 'Backlog',
    priority: 'Medium',
    assignee: 'Ashrit',
    dueDate: day(7),
    tags: ['frontend', 'ops']
  },
  {
    title: 'Implement task delete API',
    description: 'DELETE /api/tasks/:id and emit task_deleted event.',
    status: 'Done',
    priority: 'High',
    assignee: 'Lee',
    dueDate: day(-3),
    tags: ['backend']
  },
  {
    title: 'Dockerize Express and FastAPI',
    description: 'Add Dockerfiles and docker-compose services for server and analytics.',
    status: 'In Progress',
    priority: 'Medium',
    assignee: 'Priya',
    dueDate: day(5),
    tags: ['devops', 'docker']
  },
  {
    title: 'Deploy frontend to Vercel',
    description: 'Configure env vars and build for production.',
    status: 'Backlog',
    priority: 'Low',
    assignee: 'Unassigned',
    dueDate: day(14),
    tags: ['deployment']
  },
  {
    title: 'Document API and demo flow',
    description: 'README architecture section and interview talking points.',
    status: 'Review',
    priority: 'Medium',
    assignee: 'Sara',
    dueDate: day(1),
    tags: ['docs']
  }
];

/**
 * Build event doc for TaskEvent.insertMany (no _id; Mongoose will add).
 */
function eventDoc(taskId, eventType, extra = {}) {
  return {
    taskId,
    eventType,
    actor: 'seed-script',
    ...extra
  };
}

export async function seedTasksIfEmpty() {
  const count = await Task.countDocuments();
  if (count > 0) return;

  const tasks = await Task.insertMany(sampleTasks);
  const events = [];

  for (const task of tasks) {
    events.push(
      eventDoc(task._id, 'task_created', { toStatus: task.status, createdAt: task.createdAt, updatedAt: task.updatedAt })
    );
    // For tasks not in Backlog, add a status_changed event so analytics has a richer history
    if (task.status !== 'Backlog') {
      events.push({
        ...eventDoc(task._id, 'task_status_changed', { fromStatus: 'Backlog', toStatus: task.status }),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      });
    }
    // For Done tasks, add task_completed (so throughput/completion analytics show data)
    if (task.status === 'Done') {
      events.push({
        ...eventDoc(task._id, 'task_completed', { fromStatus: 'In Progress', toStatus: 'Done' }),
        createdAt: task.updatedAt ?? task.createdAt,
        updatedAt: task.updatedAt ?? task.createdAt
      });
    }
    // Some tasks get an assignee change event for demo
    if (task.assignee && task.assignee !== 'Unassigned') {
      events.push({
        ...eventDoc(task._id, 'task_assigned', { details: { from: 'Unassigned', to: task.assignee } }),
        createdAt: task.createdAt,
        updatedAt: task.createdAt
      });
    }
  }

  await TaskEvent.insertMany(events);
  console.log(`Seeded ${tasks.length} sample tasks and ${events.length} events`);
}
