import { Router } from 'express';
import TaskEvent from '../models/TaskEvent.js';

const router = Router();

router.get('/', async (req, res) => {
  const query = req.query.taskId ? { taskId: req.query.taskId } : {};
  const events = await TaskEvent.find(query).sort({ createdAt: -1 }).limit(100);
  res.json(events);
});

export default router;
