import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/composition/container.js';

describe('Drivers HTTP', () => {
  it('creates, lists, filters, updates and deletes', async () => {
    const app = createApp({ container: createContainer() });

    const created = await request(app).post('/drivers').send({ name: ' Ana Silva ' });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Ana Silva');
    expect(created.headers.location).toBe(`/drivers/${created.body.id}`);

    await request(app).post('/drivers').send({ name: 'Bruno Costa' });

    const listed = await request(app).get('/drivers');
    expect(listed.body).toHaveLength(2);

    const filtered = await request(app).get('/drivers').query({ name: 'ana silva' });
    expect(filtered.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/drivers/${created.body.id}`)
      .send({ name: 'Ana Souza' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Ana Souza');

    const deleted = await request(app).delete(`/drivers/${created.body.id}`);
    expect(deleted.status).toBe(204);
  });

  it('rejects invalid name and delete with usages', async () => {
    const app = createApp({ container: createContainer() });

    const invalid = await request(app).post('/drivers').send({ name: '' });
    expect(invalid.status).toBe(422);

    const driver = await request(app).post('/drivers').send({ name: 'Ana' });
    const automobile = await request(app).post('/automobiles').send({
      plate: 'ABC1D23',
      color: 'Silver',
      brand: 'Toyota',
    });
    await request(app).post('/usages').send({
      automobileId: automobile.body.id,
      driverId: driver.body.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Visit',
    });

    const deleted = await request(app).delete(`/drivers/${driver.body.id}`);
    expect(deleted.status).toBe(409);
    expect(deleted.body.error.code).toBe('DRIVER_HAS_USAGES');
  });
});
