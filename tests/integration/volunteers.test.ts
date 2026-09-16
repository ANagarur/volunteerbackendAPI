import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();
const NONEXISTENT_ID = '507f1f77bcf86cd799439011';

describe('POST /volunteers', () => {
  it('creates a volunteer and returns its id', async () => {
    const res = await request(app).post('/volunteers').send({ name: 'Alex Doe' });

    expect(res.status).toBe(201);
    expect(res.body.volunteerID).toMatch(/^[0-9a-fA-F]{24}$/);
  });

  it('accepts an optional contactInfo field', async () => {
    const res = await request(app)
      .post('/volunteers')
      .send({ name: 'Sam Lee', contactInfo: 'sam@example.com' });

    expect(res.status).toBe(201);
  });

  it('rejects a payload missing name', async () => {
    const res = await request(app).post('/volunteers').send({ contactInfo: 'x@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects an empty name', async () => {
    const res = await request(app).post('/volunteers').send({ name: '' });

    expect(res.status).toBe(400);
  });
});

describe('GET /volunteers/:volunteerID', () => {
  it('returns the created volunteer', async () => {
    const created = await request(app).post('/volunteers').send({ name: 'Jordan' });
    const volunteerID = created.body.volunteerID;

    const res = await request(app).get(`/volunteers/${volunteerID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: volunteerID, name: 'Jordan' });
  });

  it('returns 404 for a well-formed but nonexistent id', async () => {
    const res = await request(app).get(`/volunteers/${NONEXISTENT_ID}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/volunteers/not-an-id');

    expect(res.status).toBe(400);
  });
});
