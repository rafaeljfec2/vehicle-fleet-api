import { describe, expect, it } from 'vitest';
import type { AppError } from '../../src/shared/errors/app-error.js';
import { createInMemoryAutomobileRepository } from '../../src/modules/automobiles/automobile.repository.js';
import { createInMemoryDriverRepository } from '../../src/modules/drivers/driver.repository.js';
import { createInMemoryUsageRepository } from '../../src/modules/usages/usage.repository.js';
import { createUsageService } from '../../src/modules/usages/usage.service.js';

function setup() {
  const automobiles = createInMemoryAutomobileRepository();
  const drivers = createInMemoryDriverRepository();
  const usages = createInMemoryUsageRepository();
  const service = createUsageService(usages, automobiles, drivers);

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
  it('starts a valid usage as active', () => {
    const { service, automobile, driver } = setup();
    const usage = service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Client visit',
    });
    expect(usage.endDate).toBeNull();
    expect(usage.reason).toBe('Client visit');
  });

  it('blocks an automobile that already has an active usage', () => {
    const { service, automobile, driver, otherDriver } = setup();
    service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'First',
    });
    expect(() =>
      service.start({
        automobileId: automobile.id,
        driverId: otherDriver.id,
        startDate: '2026-10-26T11:00:00.000Z',
        reason: 'Second',
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'AUTOMOBILE_IN_USE' } satisfies Partial<AppError>),
    );
  });

  it('blocks a driver that already has an active usage', () => {
    const { service, automobile, otherAutomobile, driver } = setup();
    service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'First',
    });
    expect(() =>
      service.start({
        automobileId: otherAutomobile.id,
        driverId: driver.id,
        startDate: '2026-10-26T11:00:00.000Z',
        reason: 'Second',
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'DRIVER_IN_USE' } satisfies Partial<AppError>),
    );
  });

  it('reports automobile conflict before driver conflict', () => {
    const { service, automobile, otherAutomobile, driver, otherDriver } =
      setup();
    service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip A',
    });
    service.start({
      automobileId: otherAutomobile.id,
      driverId: otherDriver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip B',
    });
    expect(() =>
      service.start({
        automobileId: automobile.id,
        driverId: otherDriver.id,
        startDate: '2026-10-26T11:00:00.000Z',
        reason: 'Both busy',
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'AUTOMOBILE_IN_USE' } satisfies Partial<AppError>),
    );
  });

  it('finishes an active usage and allows reuse', () => {
    const { service, automobile, driver } = setup();
    const started = service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip',
    });
    const finished = service.finish(started.id, {
      endDate: '2026-10-26T12:00:00.000Z',
    });
    expect(finished.endDate).toBe('2026-10-26T12:00:00.000Z');

    const reused = service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T13:00:00.000Z',
      reason: 'Again',
    });
    expect(reused.endDate).toBeNull();
  });

  it('rejects a second finish', () => {
    const { service, automobile, driver } = setup();
    const started = service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip',
    });
    service.finish(started.id, { endDate: '2026-10-26T12:00:00.000Z' });
    expect(() =>
      service.finish(started.id, { endDate: '2026-10-26T13:00:00.000Z' }),
    ).toThrowError(
      expect.objectContaining({
        code: 'USAGE_ALREADY_FINISHED',
      } satisfies Partial<AppError>),
    );
  });

  it('rejects missing automobile or driver', () => {
    const { service, automobile, driver } = setup();
    expect(() =>
      service.start({
        automobileId: '550e8400-e29b-41d4-a716-446655440000',
        driverId: driver.id,
        startDate: '2026-10-26T10:00:00.000Z',
        reason: 'Missing auto',
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'NOT_FOUND' } satisfies Partial<AppError>),
    );

    expect(() =>
      service.start({
        automobileId: automobile.id,
        driverId: '550e8400-e29b-41d4-a716-446655440001',
        startDate: '2026-10-26T10:00:00.000Z',
        reason: 'Missing driver',
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'NOT_FOUND' } satisfies Partial<AppError>),
    );
  });

  it('lists usages with related driver name and automobile data', () => {
    const { service, automobile, driver } = setup();
    service.start({
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

  it('rejects a second sync start for the same automobile', () => {
    const { service, automobile, driver, otherDriver } = setup();
    service.start({
      automobileId: automobile.id,
      driverId: driver.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'A',
    });
    expect(() =>
      service.start({
        automobileId: automobile.id,
        driverId: otherDriver.id,
        startDate: '2026-10-26T10:00:00.000Z',
        reason: 'B',
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'AUTOMOBILE_IN_USE' } satisfies Partial<AppError>),
    );
  });
});
