import type {
  Automobile,
  AutomobileFilters,
  CreateAutomobileInput,
} from './automobile.types.js';

export interface AutomobileRepository {
  create(input: CreateAutomobileInput & { id: string }): Automobile;
  findById(id: string): Automobile | undefined;
  findByPlate(plate: string): Automobile | undefined;
  list(filters?: AutomobileFilters): Automobile[];
  update(id: string, input: CreateAutomobileInput): Automobile | undefined;
  delete(id: string): boolean;
}

function matchesFilter(value: string, filter: string | undefined): boolean {
  if (filter === undefined) {
    return true;
  }
  return value.toLowerCase() === filter.toLowerCase();
}

function findByPlateInMap(
  byId: Map<string, Automobile>,
  plate: string,
): Automobile | undefined {
  const normalized = plate.toUpperCase();
  for (const item of byId.values()) {
    if (item.plate === normalized) {
      return item;
    }
  }
  return undefined;
}

function listFromMap(
  byId: Map<string, Automobile>,
  filters: AutomobileFilters,
): Automobile[] {
  return [...byId.values()].filter(
    (item) =>
      matchesFilter(item.brand, filters.brand) &&
      matchesFilter(item.color, filters.color),
  );
}

export function createInMemoryAutomobileRepository(): AutomobileRepository {
  const byId = new Map<string, Automobile>();

  return {
    create(input) {
      const automobile: Automobile = { ...input };
      byId.set(automobile.id, automobile);
      return automobile;
    },
    findById: (id) => byId.get(id),
    findByPlate: (plate) => findByPlateInMap(byId, plate),
    list: (filters = {}) => listFromMap(byId, filters),
    update(id, input) {
      if (!byId.has(id)) {
        return undefined;
      }
      const updated: Automobile = { id, ...input };
      byId.set(id, updated);
      return updated;
    },
    delete: (id) => byId.delete(id),
  };
}
