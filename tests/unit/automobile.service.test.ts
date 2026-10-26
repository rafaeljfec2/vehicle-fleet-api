import { describe, expect, it } from 'vitest';
import type { AppError } from '../../src/shared/errors/app-error.js';
import { createInMemoryAutomobileRepository } from '../../src/modules/automobiles/automobile.repository.js';
import { createAutomobileService } from '../../src/modules/automobiles/automobile.service.js';
import { createInMemoryDriverRepository } from '../../src/modules/drivers/driver.repository.js';
import { createInMemoryUsageRepository } from '../../src/modules/usages/usage.repository.js';
import { createUsageService } from '../../src/modules/usages/usage.service.js';

function createServices() {
  const automobiles = createInMemoryAutomobileRepository();
  const drivers = createInMemoryDriverRepository();
  const usages = createInMemoryUsageRepository();
  return {
    automobiles,
    drivers,
    usages,
    automobileService: createAutomobileService(automobiles, usages),
    usageService: createUsageService(usages, automobiles, drivers),
  };
}

describe('AutomobileService', () => {
  it('creates, lists with filters, updates and deletes', () => {
    const { automobileService } = createServices();
    const created = automobileService.create({
      plate: 'abc1d23',
      color: 'Silver',
      brand: 'Toyota',
    });
    expect(created.plate).toBe('ABC1D23');

    automobileService.create({
      plate: 'XYZ9K88',
      color: 'Black',
      brand: 'Honda',
    });

    expect(automobileService.list({ brand: 'toyota' })).toHaveLength(1);
    expect(automobileService.list({ color: 'black' })).toHaveLength(1);
    expect(
      automobileService.list({ brand: 'Honda', color: 'Black' }),
    ).toHaveLength(1);

    const updated = automobileService.update(created.id, {
      plate: 'ABC1D23',
      color: 'Blue',
      brand: 'Toyota',
    });
    expect(updated.color).toBe('Blue');

    automobileService.delete(created.id);
    expect(() => automobileService.getById(created.id)).toThrowError(
      expect.objectContaining({ code: 'NOT_FOUND' }),
    );
  });

  it('rejects duplicate plates and delete with usage history', () => {
    const { automobileService, drivers, usageService } = createServices();
    const automobile = automobileService.create({
      plate: 'ABC1D23',
      color: 'Silver',
      brand: 'Toyota',
    });
    expect(() =>
      automobileService.create({
        plate: 'abc1d23',
        color: 'Red',
        brand: 'Ford',
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'DUPLICATE_PLATE' } satisfies Partial<AppError>),
    );

    const driver = drivers.create({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Ana',
    });
    usageService.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Visit',
    });

    expect(() => automobileService.delete(automobile.id)).toThrowError(
      expect.objectContaining({
        code: 'AUTOMOBILE_HAS_USAGES',
      } satisfies Partial<AppError>),
    );
  });
});
