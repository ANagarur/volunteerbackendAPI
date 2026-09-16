import express from 'express';
import volunteersRouter from './routes/volunteers';
import orgsRouter from './routes/orgs';
import eventsRouter from './routes/events';
import shiftsRouter from './routes/shifts';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => res.send('API is running'));
  app.use('/volunteers', volunteersRouter);
  app.use('/orgs', orgsRouter);
  app.use('/events', eventsRouter);
  app.use('/shifts', shiftsRouter);

  app.use(errorHandler);
  return app;
}