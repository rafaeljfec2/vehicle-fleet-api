import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInMemoryAutomobileRepository } from '../../src/modules/automobiles/automobile.repository.js';
import { createInMemoryDriverRepository } from '../../src/modules/drivers/driver.repository.js';
import { createInMemoryUsageRepository } from '../../src/modules/usages/usage.repository.js';
import { createUsageService } from '../../src/modules/usages/usage.service.js';
import { logger } from '../../src/shared/logging/logger.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('business rule logs', () => {
  it('emits structured warn when automobile is already in use', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => undefined);

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
    const driver = drivers.create({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Ana',
    });
    const otherDriver = drivers.create({
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Bruno',
    });

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
    ).toThrowError(expect.objectContaining({ code: 'AUTOMOBILE_IN_USE' }));

    expect(infoSpy).toHaveBeenCalledWith(
      'usage.started',
      expect.objectContaining({
        event: 'usage.started',
        rule: true,
        automobileId: automobile.id,
      }),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'usage.rejected.automobile_in_use',
      expect.objectContaining({
        event: 'usage.rejected.automobile_in_use',
        rule: true,
        automobileId: automobile.id,
      }),
    );
  });
});
