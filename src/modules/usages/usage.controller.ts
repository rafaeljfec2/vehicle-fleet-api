import type { Request, Response } from 'express';
import { readParamId } from '../../shared/http/request-data.js';
import type { UsageService } from './usage.service.js';

export type UsageController = Readonly<{
  start(req: Request, res: Response): void;
  finish(req: Request, res: Response): void;
  list(req: Request, res: Response): void;
}>;

export function createUsageController(service: UsageService): UsageController {
  return {
    start(req, res) {
      const created = service.start(req.body);
      res.status(201).location(`/usages/${created.id}`).json(created);
    },

    finish(req, res) {
      const finished = service.finish(readParamId(req), req.body);
      res.status(200).json(finished);
    },

    list(_req, res) {
      res.status(200).json(service.list());
    },
  };
}
