import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi.js';

export function mountSwagger(app: Express): void {
  app.get('/docs.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: 'Fleet Management API Docs',
      swaggerOptions: {
        persistAuthorization: false,
        displayRequestDuration: true,
      },
    }),
  );
}
