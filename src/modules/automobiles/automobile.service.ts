import { randomUUID } from 'node:crypto';
import { conflict, notFound } from '../../shared/errors/app-error.js';
import { logBusinessRule } from '../../shared/logging/business-log.js';
import type { UsageRepository } from '../usages/usage.repository.js';
import type { AutomobileRepository } from './automobile.repository.js';
import type {
  Automobile,
  AutomobileFilters,
  CreateAutomobileInput,
  UpdateAutomobileInput,
} from './automobile.types.js';

export type AutomobileService = Readonly<{
  create(input: CreateAutomobileInput): Automobile;
  getById(id: string): Automobile;
  list(filters?: AutomobileFilters): Automobile[];
  update(id: string, input: UpdateAutomobileInput): Automobile;
  delete(id: string): void;
}>;

function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase();
}

function createAutomobile(
  repository: AutomobileRepository,
  input: CreateAutomobileInput,
): Automobile {
  const plate = normalizePlate(input.plate);
  if (repository.findByPlate(plate) !== undefined) {
    logBusinessRule('automobile.rejected.duplicate_plate', { plate });
    throw conflict('DUPLICATE_PLATE', 'Automobile plate already exists');
  }
  return repository.create({
    id: randomUUID(),
    plate,
    color: input.color.trim(),
    brand: input.brand.trim(),
  });
}

function getAutomobile(
  repository: AutomobileRepository,
  id: string,
): Automobile {
  const found = repository.findById(id);
  if (found === undefined) {
    throw notFound('Automobile not found');
  }
  return found;
}

function updateAutomobile(
  repository: AutomobileRepository,
  id: string,
  input: UpdateAutomobileInput,
): Automobile {
  getAutomobile(repository, id);
  const plate = normalizePlate(input.plate);
  const duplicate = repository.findByPlate(plate);
  if (duplicate !== undefined && duplicate.id !== id) {
    logBusinessRule('automobile.rejected.duplicate_plate', {
      plate,
      automobileId: id,
    });
    throw conflict('DUPLICATE_PLATE', 'Automobile plate already exists');
  }
  const updated = repository.update(id, {
    plate,
    color: input.color.trim(),
    brand: input.brand.trim(),
  });
  if (updated === undefined) {
    throw notFound('Automobile not found');
  }
  return updated;
}

function deleteAutomobile(
  repository: AutomobileRepository,
  usageRepository: UsageRepository,
  id: string,
): void {
  getAutomobile(repository, id);
  if (usageRepository.existsForAutomobile(id)) {
    logBusinessRule('automobile.rejected.has_usages', { automobileId: id });
    throw conflict(
      'AUTOMOBILE_HAS_USAGES',
      'Cannot delete automobile referenced by usages',
    );
  }
  repository.delete(id);
}

export function createAutomobileService(
  repository: AutomobileRepository,
  usageRepository: UsageRepository,
): AutomobileService {
  return {
    create: (input) => createAutomobile(repository, input),
    getById: (id) => getAutomobile(repository, id),
    list: (filters) => repository.list(filters),
    update: (id, input) => updateAutomobile(repository, id, input),
    delete: (id) => deleteAutomobile(repository, usageRepository, id),
  };
}
