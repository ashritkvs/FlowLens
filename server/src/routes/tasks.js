import { Router } from 'express';
import Task from '../models/Task.js';
import TaskEvent from '../models/TaskEvent.js';

const router = Router();
const ACTOR = 'demo-user';

/** Build filter query from optional query params: status, priority, assignee, search, dateFrom, dateTo */
function buildFilterQuery(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignee) filter.assignee = new RegExp(query.assignee.trim(), 'i');
  if (query.search) {
    filter.title = new RegExp(query.search.trim(), 'i');
  }
  if (query.dateFrom || query.dateTo) {
    filter.dueDate = {};
    if (query.dateFrom) filter.dueDate.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.dueDate.$lte = new Date(query.dateTo);
  }
  return filter;
}

/**
 * GET /api/tasks
 * Query params: status, priority, assignee, search (title), dateFrom, dateTo (ISO date strings for due date range)
 */
router.get('/', async (req, res) => {
  const filter = buildFilterQuery(req.query);
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json(tasks);
});

/**
 * POST /api/tasks — create task and emit task_created
 */
router.post('/', async (req, res) => {
  const task = await Task.create(req.body);
  await TaskEvent.create({
    taskId: task._id,
    eventType: 'task_created',
    toStatus: task.status,
    actor: ACTOR,
    details: { priority: task.priority, assignee: task.assignee }
  });
  res.status(201).json(task);
});

/**
 * Emit a single event; helper to keep PATCH logic readable.
 */
async function emitEvent(payload) {
  await TaskEvent.create({ ...payload, actor: ACTOR });
}

/**
 * PATCH /api/tasks/:id — update any editable field; emit task_updated, task_status_changed,
 * task_completed (when status → Done), task_assigned, task_blocked / task_unblocked as appropriate.
 */
router.patch('/:id', async (req, res) => {
  const existing = await Task.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const previousStatus = existing.status;
  const previousAssignee = existing.assignee;
  const previousBlocked = existing.blocked;

  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  const statusChanged = req.body.status != null && req.body.status !== previousStatus;
  const assigneeChanged = req.body.assignee != null && String(req.body.assignee).trim() !== String(previousAssignee).trim();
  const blockedChanged = typeof req.body.blocked === 'boolean' && req.body.blocked !== previousBlocked;

  // Status transition events
  if (statusChanged) {
    await emitEvent({
      taskId: updated._id,
      eventType: 'task_status_changed',
      fromStatus: previousStatus,
      toStatus: updated.status
    });
    if (updated.status === 'Done') {
      await emitEvent({
        taskId: updated._id,
        eventType: 'task_completed',
        fromStatus: previousStatus,
        toStatus: 'Done'
      });
    }
  }

  if (assigneeChanged) {
    await emitEvent({
      taskId: updated._id,
      eventType: 'task_assigned',
      details: { from: previousAssignee, to: updated.assignee }
    });
  }

  if (blockedChanged) {
    await emitEvent({
      taskId: updated._id,
      eventType: updated.blocked ? 'task_blocked' : 'task_unblocked'
    });
  }

  // Any other field change (title, description, priority, dueDate, tags) → task_updated
  const otherFields = ['title', 'description', 'priority', 'dueDate', 'tags'];
  const hasOtherChange = otherFields.some(
    (field) => req.body[field] !== undefined && JSON.stringify(req.body[field]) !== JSON.stringify(existing[field])
  );
  if (hasOtherChange) {
    await emitEvent({
      taskId: updated._id,
      eventType: 'task_updated',
      details: { updatedFields: otherFields.filter((f) => req.body[f] !== undefined) }
    });
  }

  res.json(updated);
});

/**
 * DELETE /api/tasks/:id — delete task and emit task_deleted (event stored before deleting the task).
 */
router.delete('/:id', async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  await TaskEvent.create({
    taskId: task._id,
    eventType: 'task_deleted',
    fromStatus: task.status,
    actor: ACTOR,
    details: { title: task.title }
  });
  await Task.findByIdAndDelete(req.params.id);
  res.status(200).json({ deleted: true, id: req.params.id });
});

export default router;
