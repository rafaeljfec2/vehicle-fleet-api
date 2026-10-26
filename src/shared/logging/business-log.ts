import { logger } from './logger.js';

export type BusinessEvent =
  | 'usage.started'
  | 'usage.finished'
  | 'usage.rejected.automobile_in_use'
  | 'usage.rejected.driver_in_use'
  | 'usage.rejected.already_finished'
  | 'usage.rejected.end_before_start'
  | 'automobile.rejected.duplicate_plate'
  | 'automobile.rejected.has_usages'
  | 'driver.rejected.has_usages';

type BusinessPayload = Readonly<Record<string, string | number | boolean | null>>;

export function logBusinessRule(
  event: BusinessEvent,
  payload: BusinessPayload,
): void {
  const isRejection = event.includes('.rejected.');
  const meta = { event, rule: true, ...payload };
  if (isRejection) {
    logger.warn(event, meta);
    return;
  }
  logger.info(event, meta);
}
