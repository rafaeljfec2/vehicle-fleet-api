import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/composition/container.js';

async function seedPair(app: ReturnType<typeof createApp>) {
  const automobile = await request(app).post('/automobiles').send({
    plate: 'ABC1D23',
    color: 'Silver',
    brand: 'Toyota',
  });
  const otherAutomobile = await request(app).post('/automobiles').send({
    plate: 'XYZ9K88',
    color: 'Black',
    brand: 'Honda',
  });
  const driver = await request(app).post('/drivers').send({ name: 'Ana Silva' });
  const otherDriver = await request(app)
    .post('/drivers')
    .send({ name: 'Bruno Costa' });
  return {
    automobileId: automobile.body.id as string,
    otherAutomobileId: otherAutomobile.body.id as string,
    driverId: driver.body.id as string,
    otherDriverId: otherDriver.body.id as string,
  };
}

describe('Usages HTTP', () => {
  it('starts, finishes, lists history and allows reuse', async () => {
    const app = createApp({ container: createContainer() });
    const ids = await seedPair(app);

    const started = await request(app).post('/usages').send({
      automobileId: ids.automobileId,
      driverId: ids.driverId,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Client visit',
    });
    expect(started.status).toBe(201);
    expect(started.body.endDate).toBeNull();

    const finished = await request(app)
      .post(`/usages/${started.body.id}/finish`)
      .send({ endDate: '2026-10-26T12:00:00.000Z' });
    expect(finished.status).toBe(200);
    expect(finished.body.endDate).toBe('2026-10-26T12:00:00.000Z');

    const listed = await request(app).get('/usages');
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].driver.name).toBe('Ana Silva');
    expect(listed.body[0].automobile.plate).toBe('ABC1D23');

    const reused = await request(app).post('/usages').send({
      automobileId: ids.automobileId,
      driverId: ids.driverId,
      startDate: '2026-10-26T13:00:00.000Z',
      reason: 'Second trip',
    });
    expect(reused.status).toBe(201);
  });

  it('blocks automobile and driver conflicts and second finish', async () => {
    const app = createApp({ container: createContainer() });
    const ids = await seedPair(app);

    const first = await request(app).post('/usages').send({
      automobileId: ids.automobileId,
      driverId: ids.driverId,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip',
    });
    expect(first.status).toBe(201);

    const autoBusy = await request(app).post('/usages').send({
      automobileId: ids.automobileId,
      driverId: ids.otherDriverId,
      startDate: '2026-10-26T11:00:00.000Z',
      reason: 'Auto busy',
    });
    expect(autoBusy.status).toBe(409);
    expect(autoBusy.body.error.code).toBe('AUTOMOBILE_IN_USE');

    const driverBusy = await request(app).post('/usages').send({
      automobileId: ids.otherAutomobileId,
      driverId: ids.driverId,
      startDate: '2026-10-26T11:00:00.000Z',
      reason: 'Driver busy',
    });
    expect(driverBusy.status).toBe(409);
    expect(driverBusy.body.error.code).toBe('DRIVER_IN_USE');

    await request(app)
      .post(`/usages/${first.body.id}/finish`)
      .send({ endDate: '2026-10-26T12:00:00.000Z' });

    const secondFinish = await request(app)
      .post(`/usages/${first.body.id}/finish`)
      .send({ endDate: '2026-10-26T13:00:00.000Z' });
    expect(secondFinish.status).toBe(409);
    expect(secondFinish.body.error.code).toBe('USAGE_ALREADY_FINISHED');
  });

  it('rejects missing ids, bad dates and date-only values', async () => {
    const app = createApp({ container: createContainer() });
    const ids = await seedPair(app);

    const missingAuto = await request(app).post('/usages').send({
      automobileId: '550e8400-e29b-41d4-a716-446655440000',
      driverId: ids.driverId,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Missing auto',
    });
    expect(missingAuto.status).toBe(404);

    const dateOnly = await request(app).post('/usages').send({
      automobileId: ids.automobileId,
      driverId: ids.driverId,
      startDate: '2026-10-26',
      reason: 'Bad date',
    });
    expect(dateOnly.status).toBe(422);

    const started = await request(app).post('/usages').send({
      automobileId: ids.automobileId,
      driverId: ids.driverId,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Trip',
    });
    const earlyEnd = await request(app)
      .post(`/usages/${started.body.id}/finish`)
      .send({ endDate: '2026-10-26T09:00:00.000Z' });
    expect(earlyEnd.status).toBe(422);
  });

  it('allows only one concurrent start for the same automobile', async () => {
    const app = createApp({ container: createContainer() });
    const ids = await seedPair(app);

    const payload = {
      automobileId: ids.automobileId,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Concurrent',
    };

    const [first, second] = await Promise.all([
      request(app)
        .post('/usages')
        .send({ ...payload, driverId: ids.driverId }),
      request(app)
        .post('/usages')
        .send({ ...payload, driverId: ids.otherDriverId }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
    const conflict = first.status === 409 ? first : second;
    expect(conflict.body.error.code).toBe('AUTOMOBILE_IN_USE');
  });
});
