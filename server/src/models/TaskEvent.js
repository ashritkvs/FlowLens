import mongoose from 'mongoose';

const taskEventSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    eventType: { type: String, required: true },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, default: null },
    actor: { type: String, default: 'system' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model('TaskEvent', taskEventSchema);
