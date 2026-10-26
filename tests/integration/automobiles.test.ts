import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/composition/container.js';

async function createAutomobile(
  app: ReturnType<typeof createApp>,
  body: Readonly<{ plate: string; color: string; brand: string }>,
) {
  return request(app).post('/automobiles').send(body);
}

describe('Automobiles HTTP', () => {
  it('creates, gets, lists, filters, updates and deletes', async () => {
    const app = createApp({ container: createContainer() });

    const created = await createAutomobile(app, {
      plate: 'abc1d23',
      color: 'Silver',
      brand: 'Toyota',
    });
    expect(created.status).toBe(201);
    expect(created.headers.location).toBe(`/automobiles/${created.body.id}`);
    expect(created.body.plate).toBe('ABC1D23');

    await createAutomobile(app, {
      plate: 'XYZ9K88',
      color: 'Black',
      brand: 'Honda',
    });

    const byId = await request(app).get(`/automobiles/${created.body.id}`);
    expect(byId.status).toBe(200);
    expect(byId.body.id).toBe(created.body.id);

    const listed = await request(app).get('/automobiles');
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(2);

    const byBrand = await request(app).get('/automobiles').query({ brand: 'toyota' });
    expect(byBrand.body).toHaveLength(1);
    expect(byBrand.body[0].plate).toBe('ABC1D23');

    const byColor = await request(app).get('/automobiles').query({ color: 'black' });
    expect(byColor.body).toHaveLength(1);
    expect(byColor.body[0].plate).toBe('XYZ9K88');

    const byBoth = await request(app)
      .get('/automobiles')
      .query({ brand: 'Honda', color: 'Black' });
    expect(byBoth.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/automobiles/${created.body.id}`)
      .send({ plate: 'ABC1D23', color: 'Blue', brand: 'Toyota' });
    expect(updated.status).toBe(200);
    expect(updated.body.color).toBe('Blue');

    const deleted = await request(app).delete(`/automobiles/${created.body.id}`);
    expect(deleted.status).toBe(204);
  });

  it('rejects duplicate plates and invalid payloads', async () => {
    const app = createApp({ container: createContainer() });
    await createAutomobile(app, {
      plate: 'ABC1D23',
      color: 'Silver',
      brand: 'Toyota',
    });

    const duplicate = await createAutomobile(app, {
      plate: 'abc1d23',
      color: 'Red',
      brand: 'Ford',
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_PLATE');

    const invalid = await createAutomobile(app, {
      plate: '',
      color: 'Silver',
      brand: 'Toyota',
    });
    expect(invalid.status).toBe(422);
  });

  it('returns 404/422 for missing or malformed ids', async () => {
    const app = createApp({ container: createContainer() });
    const missing = await request(app).get(
      '/automobiles/550e8400-e29b-41d4-a716-446655440000',
    );
    expect(missing.status).toBe(404);

    const malformed = await request(app).get('/automobiles/not-a-uuid');
    expect(malformed.status).toBe(422);
  });

  it('blocks delete when usages exist', async () => {
    const app = createApp({ container: createContainer() });
    const automobile = await createAutomobile(app, {
      plate: 'ABC1D23',
      color: 'Silver',
      brand: 'Toyota',
    });
    const driver = await request(app).post('/drivers').send({ name: 'Ana' });
    await request(app).post('/usages').send({
      automobileId: automobile.body.id,
      driverId: driver.body.id,
      startDate: '2026-10-26T10:00:00.000Z',
      reason: 'Visit',
    });

    const deleted = await request(app).delete(
      `/automobiles/${automobile.body.id}`,
    );
    expect(deleted.status).toBe(409);
    expect(deleted.body.error.code).toBe('AUTOMOBILE_HAS_USAGES');
  });
});
