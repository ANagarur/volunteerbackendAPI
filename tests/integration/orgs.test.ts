import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();
const NONEXISTENT_ID = '507f1f77bcf86cd799439011';

async function createVolunteer(name = 'Manager') {
  const res = await request(app).post('/volunteers').send({ name });
  return res.body.volunteerID as string;
}

describe('POST /orgs', () => {
  it('creates an org when managerID references a real volunteer', async () => {
    const managerID = await createVolunteer();

    const res = await request(app).post('/orgs').send({ managerID, name: 'Red Cross' });

    expect(res.status).toBe(201);
    expect(res.body.orgID).toMatch(/^[0-9a-fA-F]{24}$/);
  });

  it('rejects a managerID that does not reference an existing volunteer', async () => {
    const res = await request(app)
      .post('/orgs')
      .send({ managerID: NONEXISTENT_ID, name: 'Red Cross' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/managerID/);
  });

  it('rejects a missing name', async () => {
    const managerID = await createVolunteer();

    const res = await request(app).post('/orgs').send({ managerID });

    expect(res.status).toBe(400);
  });

  it('rejects a malformed managerID', async () => {
    const res = await request(app).post('/orgs').send({ managerID: 'bad-id', name: 'Red Cross' });

    expect(res.status).toBe(400);
  });

  it('rejects a missing managerID', async () => {
    const res = await request(app).post('/orgs').send({ name: 'Red Cross' });

    expect(res.status).toBe(400);
  });
});

describe('GET /orgs', () => {
  it('lists the ids of all created orgs', async () => {
    const managerID = await createVolunteer();
    const created = await request(app).post('/orgs').send({ managerID, name: 'Food Bank' });

    const res = await request(app).get('/orgs');

    expect(res.status).toBe(200);
    expect(res.body).toContain(created.body.orgID);
  });
});

describe('GET /orgs/:orgID', () => {
  it('returns the full org document', async () => {
    const managerID = await createVolunteer();
    const created = await request(app)
      .post('/orgs')
      .send({ managerID, name: 'Food Bank', description: 'Local food bank' });

    const res = await request(app).get(`/orgs/${created.body.orgID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      _id: created.body.orgID,
      managerID,
      name: 'Food Bank',
      description: 'Local food bank',
    });
  });

  it('returns 404 for a nonexistent org', async () => {
    const res = await request(app).get(`/orgs/${NONEXISTENT_ID}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed orgID', async () => {
    const res = await request(app).get('/orgs/not-an-id');

    expect(res.status).toBe(400);
  });
});
