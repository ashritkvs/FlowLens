import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Backlog', 'In Progress', 'Blocked', 'Review', 'Done'],
      default: 'Backlog'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    assignee: { type: String, default: 'Unassigned' },
    dueDate: { type: Date, default: null },
    tags: { type: [String], default: [] },
    blocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
