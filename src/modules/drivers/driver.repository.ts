import type {
  CreateDriverInput,
  Driver,
  DriverFilters,
} from './driver.types.js';

export interface DriverRepository {
  create(input: CreateDriverInput & { id: string }): Driver;
  findById(id: string): Driver | undefined;
  list(filters?: DriverFilters): Driver[];
  update(id: string, input: CreateDriverInput): Driver | undefined;
  delete(id: string): boolean;
}

export function createInMemoryDriverRepository(): DriverRepository {
  const byId = new Map<string, Driver>();

  return {
    create(input) {
      const driver: Driver = { id: input.id, name: input.name };
      byId.set(driver.id, driver);
      return driver;
    },

    findById(id) {
      return byId.get(id);
    },

    list(filters = {}) {
      const items = [...byId.values()];
      if (filters.name === undefined) {
        return items;
      }
      const expected = filters.name.toLowerCase();
      return items.filter((item) => item.name.toLowerCase() === expected);
    },

    update(id, input) {
      if (!byId.has(id)) {
        return undefined;
      }
      const updated: Driver = { id, name: input.name };
      byId.set(id, updated);
      return updated;
    },

    delete(id) {
      return byId.delete(id);
    },
  };
}
