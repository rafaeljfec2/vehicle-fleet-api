import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { validate } from '../../shared/http/validate.js';
import { uuidParamSchema } from '../../shared/schemas/common.js';
import type { DriverController } from './driver.controller.js';
import {
  createDriverSchema,
  listDriversQuerySchema,
  updateDriverSchema,
} from './driver.schema.js';

export function createDriverRoutes(controller: DriverController): Router {
  const router = Router();

  router.post(
    '/',
    validate('body', createDriverSchema),
    asyncHandler(async (req, res) => {
      controller.create(req, res);
    }),
  );

  router.get(
    '/',
    validate('query', listDriversQuerySchema),
    asyncHandler(async (req, res) => {
      controller.list(req, res);
    }),
  );

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
    validate('body', updateDriverSchema),
    asyncHandler(async (req, res) => {
      controller.update(req, res);
    }),
  );

  router.delete(
    '/:id',
    validate('params', uuidParamSchema),
    asyncHandler(async (req, res) => {
      controller.delete(req, res);
    }),
  );

  return router;
}
