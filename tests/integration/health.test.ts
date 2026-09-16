import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('GET /', () => {
  it('returns the health check message', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toBe('API is running');
  });
});
