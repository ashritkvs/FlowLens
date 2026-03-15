import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import taskRoutes from './routes/tasks.js';
import eventRoutes from './routes/events.js';
import { seedTasksIfEmpty } from './utils/seed.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowlens';

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'flowlens-server' });
});

app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedTasksIfEmpty();
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('Mongo connection failed:', error.message);
    process.exit(1);
  });
