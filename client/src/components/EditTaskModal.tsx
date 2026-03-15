import { FormEvent, useEffect, useState } from 'react';
import { Task } from '../types';

type Props = {
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Task>) => Promise<void>;
};

const STATUSES: Task['status'][] = ['Backlog', 'In Progress', 'Blocked', 'Review', 'Done'];
const PRIORITIES: Task['priority'][] = ['Low', 'Medium', 'High', 'Critical'];

export default function EditTaskModal({ task, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('Backlog');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setAssignee(task.assignee ?? '');
    setDueDate(task.dueDate ? task.dueDate.toString().slice(0, 10) : '');
    setBlocked(task.blocked ?? false);
  }, [task]);

  if (!task) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!task) return;
    setSaving(true);
    try {
      await onSave(task._id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee: assignee.trim() || 'Unassigned',
        dueDate: dueDate ? dueDate : null,
        blocked,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit task">
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit task</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <div className="row-two">
            <select value={status} onChange={(e) => setStatus(e.target.value as Task['status'])}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="row-two">
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Assignee"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} />
            <span>Blocked</span>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
