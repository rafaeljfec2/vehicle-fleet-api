import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { validate } from '../../shared/http/validate.js';
import { uuidParamSchema } from '../../shared/schemas/common.js';
import type { AutomobileController } from './automobile.controller.js';
import {
  createAutomobileSchema,
  listAutomobilesQuerySchema,
  updateAutomobileSchema,
} from './automobile.schema.js';

function mountCollectionRoutes(
  router: Router,
  controller: AutomobileController,
): void {
  router.post(
    '/',
    validate('body', createAutomobileSchema),
    asyncHandler(async (req, res) => {
      controller.create(req, res);
    }),
  );
  router.get(
    '/',
    validate('query', listAutomobilesQuerySchema),
    asyncHandler(async (req, res) => {
      controller.list(req, res);
    }),
  );
}

function mountItemRoutes(
  router: Router,
  controller: AutomobileController,
): void {
  router.get(
    '/:id',
    validate('params', uuidParamSchema),
    asyncHandler(async (req, res) => {
      controller.getById(req, res);
    }),
  );
  router.put(
    '/:id',
    validate('params', uuidParamSchema),
    validate('body', updateAutomobileSchema),
    asyncHandler(async (req, res) => {
      controller.update(req, res);
    }),
  );
  router.delete(
    '/:id',
    validate('params', uuidParamSchema),
    asyncHandler(async (req, res) => {
      await controller.delete(req, res);
    }),
  );
}

export function createAutomobileRoutes(
  controller: AutomobileController,
): Router {
  const router = Router();
  mountCollectionRoutes(router, controller);
  mountItemRoutes(router, controller);
  return router;
}
