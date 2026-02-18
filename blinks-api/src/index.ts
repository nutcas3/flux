import express from 'express';
import cors from 'cors';
import { rentGPURouter } from './routes/rent-gpu';
import { listGPURouter } from './routes/list-gpu';
import { stakeRouter } from './routes/stake';
import { actionsJson } from './routes/actions-json';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.get('/actions.json', actionsJson);

app.use('/api/actions/rent-gpu', rentGPURouter);
app.use('/api/actions/list-gpu', listGPURouter);
app.use('/api/actions/stake', stakeRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Flux Blinks API running on port ${PORT}`);
  console.log(`📍 Actions endpoint: http://localhost:${PORT}/api/actions`);
});
