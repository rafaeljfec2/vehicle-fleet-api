import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { validate } from '../../shared/http/validate.js';
import { uuidParamSchema } from '../../shared/schemas/common.js';
import type { UsageController } from './usage.controller.js';
import { createUsageSchema, finishUsageSchema } from './usage.schema.js';

export function createUsageRoutes(controller: UsageController): Router {
  const router = Router();

  router.post(
    '/',
    validate('body', createUsageSchema),
    asyncHandler(async (req, res) => {
      controller.start(req, res);
    }),
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      controller.list(req, res);
    }),
  );

  router.post(
    '/:id/finish',
    validate('params', uuidParamSchema),
    validate('body', finishUsageSchema),
    asyncHandler(async (req, res) => {
      controller.finish(req, res);
    }),
  );

  return router;
}
