import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import taskRoutes from './routes/tasks.js';
import eventRoutes from './routes/events.js';
import { seedTasksIfEmpty } from './utils/seed.js';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

const app = express();
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowlens';

console.log('Starting FlowLens server...');
console.log('PORT:', port);
console.log('CLIENT_ORIGIN:', process.env.CLIENT_ORIGIN || '(not set)');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

const corsOrigin = process.env.CLIENT_ORIGIN || '*';
const corsOrigins =
  corsOrigin === '*'
    ? '*'
    : corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({ origin: corsOrigins }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'flowlens-server' });
});

app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);

app.use((err, _req, res, _next) => {
  console.error('EXPRESS ERROR:', err);
  res.status(500).json({ message: 'Internal server error' });
});

async function start() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('Connected to MongoDB');
    await seedTasksIfEmpty();
    console.log('Seed completed');

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('STARTUP ERROR:', error);
    process.exit(1);
  }
}

start();