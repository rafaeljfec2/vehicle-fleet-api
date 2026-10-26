import { describe, expect, it } from 'vitest';
import { AsyncMutex } from '../../src/shared/concurrency/async-mutex.js';
import type { AppError } from '../../src/shared/errors/app-error.js';
import { createInMemoryAutomobileRepository } from '../../src/modules/automobiles/automobile.repository.js';
import { createInMemoryDriverRepository } from '../../src/modules/drivers/driver.repository.js';
import { createDriverService } from '../../src/modules/drivers/driver.service.js';
import { createInMemoryUsageRepository } from '../../src/modules/usages/usage.repository.js';
import { createUsageService } from '../../src/modules/usages/usage.service.js';

function createServices() {
  const automobiles = createInMemoryAutomobileRepository();
  const drivers = createInMemoryDriverRepository();
  const usages = createInMemoryUsageRepository();
  const mutex = new AsyncMutex();
  return {
    automobiles,
    drivers,
    driverService: createDriverService(drivers, usages, mutex),
    usageService: createUsageService(usages, automobiles, drivers, mutex),
  };
}

describe('DriverService', () => {
  it('creates, filters by name, updates and deletes', async () => {
    const { driverService } = createServices();
    const created = driverService.create({ name: ' Ana Silva ' });
    expect(created.name).toBe('Ana Silva');

    driverService.create({ name: 'Bruno Costa' });
    expect(driverService.list({ name: 'ana silva' })).toHaveLength(1);

    const updated = driverService.update(created.id, { name: 'Ana Souza' });
    expect(updated.name).toBe('Ana Souza');

    await driverService.delete(created.id);
    expect(() => driverService.getById(created.id)).toThrowError(
      expect.objectContaining({ code: 'NOT_FOUND' }),
    );
  });

  it('rejects delete when the driver has usages', async () => {
    const { automobiles, driverService, usageService } = createServices();
    const driver = driverService.create({ name: 'Ana' });
    const automobile = automobiles.create({
      id: '11111111-1111-4111-8111-111111111111',
      plate: 'ABC1D23',
      color: 'Silver',
      brand: 'Toyota',
    });
    await usageService.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Visit',
    });

    await expect(driverService.delete(driver.id)).rejects.toMatchObject({
      code: 'DRIVER_HAS_USAGES',
    } satisfies Partial<AppError>);
  });
});
