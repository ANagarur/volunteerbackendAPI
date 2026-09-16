import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();
const NONEXISTENT_ID = '507f1f77bcf86cd799439011';

async function createVolunteer(name = 'Manager') {
  const res = await request(app).post('/volunteers').send({ name });
  return res.body.volunteerID as string;
}

async function createOrg(managerID: string, name = 'Org') {
  const res = await request(app).post('/orgs').send({ managerID, name });
  return res.body.orgID as string;
}

describe('POST /events', () => {
  it('creates an event when managerID and orgID both resolve', async () => {
    const managerID = await createVolunteer();
    const orgID = await createOrg(managerID);

    const res = await request(app)
      .post('/events')
      .send({ managerID, orgID, description: 'Beach cleanup' });

    expect(res.status).toBe(201);
    expect(res.body.eventID).toMatch(/^[0-9a-fA-F]{24}$/);
  });

  it('rejects a managerID that does not resolve', async () => {
    const managerID = await createVolunteer();
    const orgID = await createOrg(managerID);

    const res = await request(app)
      .post('/events')
      .send({ managerID: NONEXISTENT_ID, orgID });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/managerID/);
  });

  it('rejects an orgID that does not resolve', async () => {
    const managerID = await createVolunteer();

    const res = await request(app)
      .post('/events')
      .send({ managerID, orgID: NONEXISTENT_ID });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/orgID/);
  });
});

describe('GET /events', () => {
  it('lists all created events', async () => {
    const managerID = await createVolunteer();
    const orgID = await createOrg(managerID);
    const created = await request(app).post('/events').send({ managerID, orgID });

    const res = await request(app).get('/events');

    expect(res.status).toBe(200);
    expect(res.body.map((e: { _id: string }) => e._id)).toContain(created.body.eventID);
  });
});

describe('GET /events/org/:orgID', () => {
  it('returns only events belonging to that org', async () => {
    const managerID = await createVolunteer();
    const orgA = await createOrg(managerID, 'Org A');
    const orgB = await createOrg(managerID, 'Org B');
    const eventA = await request(app).post('/events').send({ managerID, orgID: orgA });
    await request(app).post('/events').send({ managerID, orgID: orgB });

    const res = await request(app).get(`/events/org/${orgA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(eventA.body.eventID);
  });
});

describe('GET /events/:eventID', () => {
  it('returns the full event document', async () => {
    const managerID = await createVolunteer();
    const orgID = await createOrg(managerID);
    const created = await request(app).post('/events').send({ managerID, orgID });

    const res = await request(app).get(`/events/${created.body.eventID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: created.body.eventID, managerID, orgID });
  });

  it('returns 404 for a nonexistent event', async () => {
    const res = await request(app).get(`/events/${NONEXISTENT_ID}`);

    expect(res.status).toBe(404);
  });
});
