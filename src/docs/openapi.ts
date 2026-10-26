import { openApiPaths } from './openapi.paths.js';
import { openApiSchemas } from './openapi.schemas.js';

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Fleet Management API',
    version: '1.0.0',
    description:
      'REST API for automobiles, drivers and automobile usages. Persistence is in-memory. Active usage means endDate is null. An automobile and a driver may each have at most one active usage at a time.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
  tags: [
    { name: 'Health', description: 'Liveness' },
    { name: 'Automobiles', description: 'Automobile CRUD and filters' },
    { name: 'Drivers', description: 'Driver CRUD and name filter' },
    {
      name: 'Usages',
      description: 'Start, finish and list automobile usages',
    },
  ],
  paths: openApiPaths,
  components: {
    schemas: openApiSchemas,
  },
} as const;
