import express, { type Express } from 'express';
import {
  createContainer,
  type AppContainer,
} from './composition/container.js';
import { mountSwagger } from './docs/swagger.js';
import { createAutomobileRoutes } from './modules/automobiles/automobile.routes.js';
import { createDriverRoutes } from './modules/drivers/driver.routes.js';
import { createUsageRoutes } from './modules/usages/usage.routes.js';
import {
  errorHandler,
  notFoundHandler,
} from './shared/http/error-handler.js';

export type CreateAppOptions = Readonly<{
  container?: AppContainer;
}>;

export function createApp(options: CreateAppOptions = {}): Express {
  const container = options.container ?? createContainer();
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  mountSwagger(app);

  app.use('/automobiles', createAutomobileRoutes(container.automobileController));
  app.use('/drivers', createDriverRoutes(container.driverController));
  app.use('/usages', createUsageRoutes(container.usageController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
