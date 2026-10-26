import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

describe('Swagger docs', () => {
  it('serves OpenAPI JSON', async () => {
    const response = await request(createApp()).get('/docs.json');
    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.info.title).toBe('Fleet Management API');
    expect(response.body.paths['/usages']).toBeDefined();
  });

  it('serves Swagger UI', async () => {
    const response = await request(createApp()).get('/docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('id="swagger-ui"');
    expect(response.text).toContain('Fleet Management API Docs');
  });
});
