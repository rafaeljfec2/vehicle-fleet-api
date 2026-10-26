import { randomUUID } from 'node:crypto';
import type { AsyncMutex } from '../../shared/concurrency/async-mutex.js';
import {
  conflict,
  notFound,
  validationError,
} from '../../shared/errors/app-error.js';
import { logBusinessRule } from '../../shared/logging/business-log.js';
import type { AutomobileRepository } from '../automobiles/automobile.repository.js';
import type { DriverRepository } from '../drivers/driver.repository.js';
import type { UsageRepository } from './usage.repository.js';
import type {
  CreateUsageInput,
  FinishUsageInput,
  Usage,
  UsageWithRelations,
} from './usage.types.js';

export type UsageService = Readonly<{
  start(input: CreateUsageInput): Promise<Usage>;
  finish(id: string, input: FinishUsageInput): Promise<Usage>;
  list(): UsageWithRelations[];
}>;

type UsageDeps = Readonly<{
  usages: UsageRepository;
  automobiles: AutomobileRepository;
  drivers: DriverRepository;
}>;

function toUtcIso(value: string): string {
  return new Date(value).toISOString();
}

function assertEndNotBeforeStart(startDate: string, endDate: string): void {
  if (Date.parse(endDate) < Date.parse(startDate)) {
    logBusinessRule('usage.rejected.end_before_start', {
      startDate,
      endDate,
    });
    throw validationError('Request validation failed', [
      {
        field: 'endDate',
        message: 'endDate must be greater than or equal to startDate',
      },
    ]);
  }
}

function assertCanStart(deps: UsageDeps, input: CreateUsageInput): void {
  if (deps.usages.findActiveByAutomobile(input.automobileId) !== undefined) {
    logBusinessRule('usage.rejected.automobile_in_use', {
      automobileId: input.automobileId,
      driverId: input.driverId,
    });
    throw conflict('AUTOMOBILE_IN_USE', 'Automobile already has an active usage');
  }
  if (deps.usages.findActiveByDriver(input.driverId) !== undefined) {
    logBusinessRule('usage.rejected.driver_in_use', {
      automobileId: input.automobileId,
      driverId: input.driverId,
    });
    throw conflict('DRIVER_IN_USE', 'Driver already has an active usage');
  }
}

function startUsage(deps: UsageDeps, input: CreateUsageInput): Usage {
  if (deps.automobiles.findById(input.automobileId) === undefined) {
    throw notFound('Automobile not found');
  }
  if (deps.drivers.findById(input.driverId) === undefined) {
    throw notFound('Driver not found');
  }
  assertCanStart(deps, input);
  const created = deps.usages.create({
    ...input,
    id: randomUUID(),
    startDate: toUtcIso(input.startDate),
    endDate: null,
  });
  logBusinessRule('usage.started', {
    usageId: created.id,
    automobileId: created.automobileId,
    driverId: created.driverId,
    startDate: created.startDate,
  });
  return created;
}

function finishUsage(
  deps: UsageDeps,
  id: string,
  input: FinishUsageInput,
): Usage {
  const current = deps.usages.findById(id);
  if (current === undefined) {
    throw notFound('Usage not found');
  }
  if (current.endDate !== null) {
    logBusinessRule('usage.rejected.already_finished', {
      usageId: id,
      endDate: current.endDate,
    });
    throw conflict('USAGE_ALREADY_FINISHED', 'Usage is already finished');
  }
  assertEndNotBeforeStart(current.startDate, input.endDate);
  const finished = deps.usages.finish(id, toUtcIso(input.endDate));
  if (finished === undefined) {
    throw notFound('Usage not found');
  }
  logBusinessRule('usage.finished', {
    usageId: finished.id,
    automobileId: finished.automobileId,
    driverId: finished.driverId,
    startDate: finished.startDate,
    endDate: finished.endDate ?? '',
  });
  return finished;
}

function toUsageWithRelations(
  deps: UsageDeps,
  usage: Usage,
): UsageWithRelations {
  const driver = deps.drivers.findById(usage.driverId);
  const automobile = deps.automobiles.findById(usage.automobileId);
  if (driver === undefined || automobile === undefined) {
    throw notFound('Related resource missing for usage');
  }
  return {
    ...usage,
    driver: { id: driver.id, name: driver.name },
    automobile: {
      id: automobile.id,
      plate: automobile.plate,
      color: automobile.color,
      brand: automobile.brand,
    },
  };
}

export function createUsageService(
  usageRepository: UsageRepository,
  automobileRepository: AutomobileRepository,
  driverRepository: DriverRepository,
  mutex: AsyncMutex,
): UsageService {
  const deps: UsageDeps = {
    usages: usageRepository,
    automobiles: automobileRepository,
    drivers: driverRepository,
  };

  return {
    start: async (input) =>
      mutex.runExclusive(() => startUsage(deps, input)),
    finish: async (id, input) =>
      mutex.runExclusive(() => finishUsage(deps, id, input)),
    list: () =>
      deps.usages.list().map((usage) => toUsageWithRelations(deps, usage)),
  };
}
