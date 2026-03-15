import { FormEvent, useState } from 'react';

type Props = {
  onCreate: (payload: {
    title: string;
    description: string;
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
  }) => Promise<void>;
};

export default function TaskForm({ onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Backlog');
  const [priority, setPriority] = useState('Medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await onCreate({ title, description, status, priority, assignee, dueDate });
    setTitle('');
    setDescription('');
    setStatus('Backlog');
    setPriority('Medium');
    setAssignee('');
    setDueDate('');
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h3>Create Task</h3>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <div className="row-two">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Backlog</option>
          <option>In Progress</option>
          <option>Blocked</option>
          <option>Review</option>
          <option>Done</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </div>
      <div className="row-two">
        <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Assignee" />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <button type="submit">Create Task</button>
    </form>
  );
}
