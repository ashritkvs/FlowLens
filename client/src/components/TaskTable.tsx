import { Task } from '../types';

const STATUSES: Task['status'][] = ['Backlog', 'In Progress', 'Blocked', 'Review', 'Done'];

type Props = {
  tasks: Task[];
  onStatusChange: (task: Task, nextStatus: Task['status']) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => Promise<void>;
  onBlockedToggle: (task: Task) => Promise<void>;
};

export default function TaskTable({ tasks, onStatusChange, onEdit, onDelete, onBlockedToggle }: Props) {
  return (
    <div className="card">
      <h3>Tasks</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Due</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty muted">
                  No tasks match the current filters.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task._id} className={task.blocked ? 'row-blocked' : ''}>
                  <td>
                    <strong>{task.title}</strong>
                    <div className="muted small">{task.description || '—'}</div>
                  </td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task, e.target.value as Task['status'])}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>{task.priority}</td>
                  <td>{task.assignee || 'Unassigned'}</td>
                  <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="td-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => onBlockedToggle(task)}
                      title={task.blocked ? 'Unblock' : 'Mark blocked'}
                    >
                      {task.blocked ? '🔓' : '🔒'}
                    </button>
                    <button type="button" className="btn-icon" onClick={() => onEdit(task)} title="Edit">
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => onDelete(task)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
