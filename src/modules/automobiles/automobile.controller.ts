import type { Request, Response } from 'express';
import {
  readOptionalQueryString,
  readParamId,
} from '../../shared/http/request-data.js';
import type { AutomobileService } from './automobile.service.js';
import type { AutomobileFilters } from './automobile.types.js';

export type AutomobileController = Readonly<{
  create(req: Request, res: Response): void;
  getById(req: Request, res: Response): void;
  list(req: Request, res: Response): void;
  update(req: Request, res: Response): void;
  delete(req: Request, res: Response): void;
}>;

function readAutomobileFilters(req: Request): AutomobileFilters {
  const brand = readOptionalQueryString(req, 'brand');
  const color = readOptionalQueryString(req, 'color');
  const filters: {
    brand?: string;
    color?: string;
  } = {};
  if (brand !== undefined) {
    filters.brand = brand;
  }
  if (color !== undefined) {
    filters.color = color;
  }
  return filters;
}

export function createAutomobileController(
  service: AutomobileService,
): AutomobileController {
  return {
    create(req, res) {
      const created = service.create(req.body);
      res.status(201).location(`/automobiles/${created.id}`).json(created);
    },

    getById(req, res) {
      res.status(200).json(service.getById(readParamId(req)));
    },

    list(req, res) {
      res.status(200).json(service.list(readAutomobileFilters(req)));
    },

    update(req, res) {
      res.status(200).json(service.update(readParamId(req), req.body));
    },

    delete(req, res) {
      service.delete(readParamId(req));
      res.status(204).send();
    },
  };
}
