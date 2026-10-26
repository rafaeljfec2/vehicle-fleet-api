import type { Request, Response } from 'express';
import {
  readOptionalQueryString,
  readParamId,
} from '../../shared/http/request-data.js';
import type { DriverService } from './driver.service.js';
import type { DriverFilters } from './driver.types.js';

export type DriverController = Readonly<{
  create(req: Request, res: Response): void;
  getById(req: Request, res: Response): void;
  list(req: Request, res: Response): void;
  update(req: Request, res: Response): void;
  delete(req: Request, res: Response): Promise<void>;
}>;

function readDriverFilters(req: Request): DriverFilters {
  const name = readOptionalQueryString(req, 'name');
  if (name === undefined) {
    return {};
  }
  return { name };
}

export function createDriverController(
  service: DriverService,
): DriverController {
  return {
    create(req, res) {
      const created = service.create(req.body);
      res.status(201).location(`/drivers/${created.id}`).json(created);
    },

    getById(req, res) {
      res.status(200).json(service.getById(readParamId(req)));
    },

    list(req, res) {
      res.status(200).json(service.list(readDriverFilters(req)));
    },

    update(req, res) {
      res.status(200).json(service.update(readParamId(req), req.body));
    },

    async delete(req, res) {
      await service.delete(readParamId(req));
      res.status(204).send();
    },
  };
}
