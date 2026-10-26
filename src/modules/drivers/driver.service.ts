import { randomUUID } from 'node:crypto';
import { conflict, notFound } from '../../shared/errors/app-error.js';
import { logBusinessRule } from '../../shared/logging/business-log.js';
import type { UsageRepository } from '../usages/usage.repository.js';
import type { DriverRepository } from './driver.repository.js';
import type {
  CreateDriverInput,
  Driver,
  DriverFilters,
  UpdateDriverInput,
} from './driver.types.js';

export type DriverService = Readonly<{
  create(input: CreateDriverInput): Driver;
  getById(id: string): Driver;
  list(filters?: DriverFilters): Driver[];
  update(id: string, input: UpdateDriverInput): Driver;
  delete(id: string): void;
}>;

function getDriver(repository: DriverRepository, id: string): Driver {
  const found = repository.findById(id);
  if (found === undefined) {
    throw notFound('Driver not found');
  }
  return found;
}

function updateDriver(
  repository: DriverRepository,
  id: string,
  input: UpdateDriverInput,
): Driver {
  const updated = repository.update(id, input);
  if (updated === undefined) {
    throw notFound('Driver not found');
  }
  return updated;
}

function deleteDriver(
  repository: DriverRepository,
  usageRepository: UsageRepository,
  id: string,
): void {
  getDriver(repository, id);
  if (usageRepository.existsForDriver(id)) {
    logBusinessRule('driver.rejected.has_usages', { driverId: id });
    throw conflict(
      'DRIVER_HAS_USAGES',
      'Cannot delete driver referenced by usages',
    );
  }
  repository.delete(id);
}

export function createDriverService(
  repository: DriverRepository,
  usageRepository: UsageRepository,
): DriverService {
  return {
    create: (input) =>
      repository.create({ id: randomUUID(), name: input.name.trim() }),
    getById: (id) => getDriver(repository, id),
    list: (filters) => repository.list(filters),
    update: (id, input) =>
      updateDriver(repository, id, { name: input.name.trim() }),
    delete: (id) => deleteDriver(repository, usageRepository, id),
  };
}
