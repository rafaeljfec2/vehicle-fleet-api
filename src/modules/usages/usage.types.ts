import type { Automobile } from '../automobiles/automobile.types.js';
import type { Driver } from '../drivers/driver.types.js';

export type Usage = Readonly<{
  id: string;
  automobileId: string;
  driverId: string;
  startDate: string;
  endDate: string | null;
  reason: string;
}>;

export type CreateUsageInput = Readonly<{
  automobileId: string;
  driverId: string;
  startDate: string;
  reason: string;
}>;

export type FinishUsageInput = Readonly<{
  endDate: string;
}>;

export type UsageWithRelations = Usage &
  Readonly<{
    driver: Pick<Driver, 'id' | 'name'>;
    automobile: Pick<Automobile, 'id' | 'plate' | 'color' | 'brand'>;
  }>;
