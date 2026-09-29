import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config, prisma } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientUrl.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '7d' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ success: true, data: { status: 'ok' } }); }
  catch { res.status(503).json({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'We are temporarily unable to access the database. Please try again later.' } }); }
});
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
export default app;
