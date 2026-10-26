import type { CreateUsageInput, Usage } from './usage.types.js';

export interface UsageRepository {
  create(input: CreateUsageInput & { id: string; endDate: null }): Usage;
  findById(id: string): Usage | undefined;
  list(): Usage[];
  findActiveByAutomobile(automobileId: string): Usage | undefined;
  findActiveByDriver(driverId: string): Usage | undefined;
  existsForAutomobile(automobileId: string): boolean;
  existsForDriver(driverId: string): boolean;
  finish(id: string, endDate: string): Usage | undefined;
}

function findActive(
  byId: Map<string, Usage>,
  field: 'automobileId' | 'driverId',
  value: string,
): Usage | undefined {
  for (const usage of byId.values()) {
    if (usage[field] === value && usage.endDate === null) {
      return usage;
    }
  }
  return undefined;
}

function existsFor(
  byId: Map<string, Usage>,
  field: 'automobileId' | 'driverId',
  value: string,
): boolean {
  for (const usage of byId.values()) {
    if (usage[field] === value) {
      return true;
    }
  }
  return false;
}

export function createInMemoryUsageRepository(): UsageRepository {
  const byId = new Map<string, Usage>();
  const order: string[] = [];

  return {
    create(input) {
      const usage: Usage = {
        id: input.id,
        automobileId: input.automobileId,
        driverId: input.driverId,
        startDate: input.startDate,
        endDate: null,
        reason: input.reason,
      };
      byId.set(usage.id, usage);
      order.push(usage.id);
      return usage;
    },
    findById: (id) => byId.get(id),
    list: () =>
      order
        .map((id) => byId.get(id))
        .filter((item): item is Usage => item !== undefined),
    findActiveByAutomobile: (automobileId) =>
      findActive(byId, 'automobileId', automobileId),
    findActiveByDriver: (driverId) => findActive(byId, 'driverId', driverId),
    existsForAutomobile: (automobileId) =>
      existsFor(byId, 'automobileId', automobileId),
    existsForDriver: (driverId) => existsFor(byId, 'driverId', driverId),
    finish(id, endDate) {
      const current = byId.get(id);
      if (current === undefined) {
        return undefined;
      }
      const updated: Usage = { ...current, endDate };
      byId.set(id, updated);
      return updated;
    },
  };
}
