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

// CORS: allow CLIENT_ORIGIN (single URL), comma-separated list, or * for any (dev)
const corsOrigin = process.env.CLIENT_ORIGIN || '*';
const corsOrigins = corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins }));
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

// Listen on 0.0.0.0 so Render/containers can receive traffic from outside
const host = process.env.HOST || '0.0.0.0';

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedTasksIfEmpty();
    app.listen(port, host, () => console.log(`Server running on ${host}:${port}`));
  })
  .catch((error) => {
    console.error('Mongo connection failed:', error.message);
    process.exit(1);
  });
