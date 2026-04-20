import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('app smoke test', () => {
  it('returns 404 json for unknown routes', async () => {
    const app = createApp();
    const response = await request(app).get('/missing-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Not Found',
    });
  });
});
