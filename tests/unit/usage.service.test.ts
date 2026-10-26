import { describe, expect, it } from 'vitest';
import { AsyncMutex } from '../../src/shared/concurrency/async-mutex.js';
import type { AppError } from '../../src/shared/errors/app-error.js';
import { createInMemoryAutomobileRepository } from '../../src/modules/automobiles/automobile.repository.js';
import { createInMemoryDriverRepository } from '../../src/modules/drivers/driver.repository.js';
import { createInMemoryUsageRepository } from '../../src/modules/usages/usage.repository.js';
import { createUsageService } from '../../src/modules/usages/usage.service.js';

function setup() {
  const automobiles = createInMemoryAutomobileRepository();
  const drivers = createInMemoryDriverRepository();
  const usages = createInMemoryUsageRepository();
  const mutex = new AsyncMutex();
  const service = createUsageService(usages, automobiles, drivers, mutex);

  const automobile = automobiles.create({
    id: '11111111-1111-4111-8111-111111111111',
    plate: 'ABC1D23',
    color: 'Silver',
    brand: 'Toyota',
  });
  const otherAutomobile = automobiles.create({
    id: '22222222-2222-4222-8222-222222222222',
    plate: 'XYZ9K88',
    color: 'Black',
    brand: 'Honda',
  });
  const driver = drivers.create({
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Ana Silva',
  });
  const otherDriver = drivers.create({
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Bruno Costa',
  });

  return {
    service,
    automobile,
    otherAutomobile,
    driver,
    otherDriver,
  };
}

describe('UsageService', () => {
  it('starts a valid usage as active', async () => {
    const { service, automobile, driver } = setup();
    const usage = await service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Client visit',
    });
    expect(usage.endDate).toBeNull();
    expect(usage.reason).toBe('Client visit');
  });

  it('blocks an automobile that already has an active usage', async () => {
    const { service, automobile, driver, otherDriver } = setup();
    await service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'First',
    });
    await expect(
      service.start({
        automobileId: automobile.id,
        driverId: otherDriver.id,
        startDate: '2026-10-26T11:00:00.000Z',
        reason: 'Second',
      }),
    ).rejects.toMatchObject({ code: 'AUTOMOBILE_IN_USE' } satisfies Partial<AppError>);
  });

  it('blocks a driver that already has an active usage', async () => {
    const { service, automobile, otherAutomobile, driver } = setup();
    await service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'First',
    });
    await expect(
      service.start({
        automobileId: otherAutomobile.id,
        driverId: driver.id,
        startDate: '2026-10-26T11:00:00.000Z',
        reason: 'Second',
      }),
    ).rejects.toMatchObject({ code: 'DRIVER_IN_USE' } satisfies Partial<AppError>);
  });

  it('reports automobile conflict before driver conflict', async () => {
    const { service, automobile, otherAutomobile, driver, otherDriver } =
      setup();
    await service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip A',
    });
    await service.start({
      automobileId: otherAutomobile.id,
      driverId: otherDriver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip B',
    });
    await expect(
      service.start({
        automobileId: automobile.id,
        driverId: otherDriver.id,
        startDate: '2026-10-26T11:00:00.000Z',
        reason: 'Both busy',
      }),
    ).rejects.toMatchObject({ code: 'AUTOMOBILE_IN_USE' } satisfies Partial<AppError>);
  });

  it('finishes an active usage and allows reuse', async () => {
    const { service, automobile, driver } = setup();
    const started = await service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip',
    });
    const finished = await service.finish(started.id, {
      endDate: '2026-10-26T12:00:00.000Z',
    });
    expect(finished.endDate).toBe('2026-10-26T12:00:00.000Z');

    const reused = await service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T13:00:00.000Z',
      reason: 'Again',
    });
    expect(reused.endDate).toBeNull();
  });

  it('rejects a second finish', async () => {
    const { service, automobile, driver } = setup();
    const started = await service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip',
    });
    await service.finish(started.id, { endDate: '2026-10-26T12:00:00.000Z' });
    await expect(
      service.finish(started.id, { endDate: '2026-10-26T13:00:00.000Z' }),
    ).rejects.toMatchObject({
      code: 'USAGE_ALREADY_FINISHED',
    } satisfies Partial<AppError>);
  });

  it('rejects missing automobile or driver', async () => {
    const { service, automobile, driver } = setup();
    await expect(
      service.start({
        automobileId: '550e8400-e29b-41d4-a716-446655440000',
        driverId: driver.id,
        startDate: '2026-10-26T10:00:00.000Z',
        reason: 'Missing auto',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);

    await expect(
      service.start({
        automobileId: automobile.id,
        driverId: '550e8400-e29b-41d4-a716-446655440001',
        startDate: '2026-10-26T10:00:00.000Z',
        reason: 'Missing driver',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
  });

  it('lists usages with related driver name and automobile data', async () => {
    const { service, automobile, driver } = setup();
    await service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Visit',
    });
    const listed = service.list();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.driver.name).toBe('Ana Silva');
    expect(listed[0]?.automobile.plate).toBe('ABC1D23');
  });

  it('allows only one concurrent start for the same automobile', async () => {
    const { service, automobile, driver, otherDriver } = setup();
    const results = await Promise.allSettled([
      service.start({
        automobileId: automobile.id,
        driverId: driver.id,
        startDate: '2026-10-26T10:00:00.000Z',
        reason: 'A',
      }),
      service.start({
        automobileId: automobile.id,
        driverId: otherDriver.id,
        startDate: '2026-10-26T10:00:00.000Z',
        reason: 'B',
      }),
    ]);
    const fulfilled = results.filter((item) => item.status === 'fulfilled');
    const rejected = results.filter((item) => item.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      status: 'rejected',
      reason: expect.objectContaining({ code: 'AUTOMOBILE_IN_USE' }),
    });
  });
});
