import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();
const NONEXISTENT_ID = '507f1f77bcf86cd799439011';

async function createVolunteer(name = 'Volunteer') {
  const res = await request(app).post('/volunteers').send({ name });
  return res.body.volunteerID as string;
}

async function createOrg(managerID: string) {
  const res = await request(app).post('/orgs').send({ managerID, name: 'Org' });
  return res.body.orgID as string;
}

async function createEvent(managerID: string, orgID: string) {
  const res = await request(app).post('/events').send({ managerID, orgID });
  return res.body.eventID as string;
}

async function createShift(eventID: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/shifts')
    .send({
      eventID,
      timing: { start: '2026-01-01T09:00:00.000Z', end: '2026-01-01T17:00:00.000Z' },
      numberNeeded: 1,
      maxPeople: 1,
      ...overrides,
    });
  return res;
}

async function setupEvent() {
  const managerID = await createVolunteer('Manager');
  const orgID = await createOrg(managerID);
  const eventID = await createEvent(managerID, orgID);
  return eventID;
}

describe('POST /shifts', () => {
  it('creates a shift when eventID resolves', async () => {
    const eventID = await setupEvent();

    const res = await createShift(eventID);

    expect(res.status).toBe(201);
    expect(res.body.shiftID).toMatch(/^[0-9a-fA-F]{24}$/);
  });

  it('rejects an eventID that does not resolve', async () => {
    const res = await createShift(NONEXISTENT_ID);

    expect(res.status).toBe(404);
  });

  it('rejects end before start', async () => {
    const eventID = await setupEvent();

    const res = await createShift(eventID, {
      timing: { start: '2026-01-01T17:00:00.000Z', end: '2026-01-01T09:00:00.000Z' },
    });

    expect(res.status).toBe(400);
  });

  it('rejects numberNeeded greater than maxPeople', async () => {
    const eventID = await setupEvent();

    const res = await createShift(eventID, { numberNeeded: 5, maxPeople: 2 });

    expect(res.status).toBe(400);
  });

  it('rejects a negative numberNeeded', async () => {
    const eventID = await setupEvent();

    const res = await createShift(eventID, { numberNeeded: -1 });

    expect(res.status).toBe(400);
  });

  it('rejects maxPeople of 0', async () => {
    const eventID = await setupEvent();

    const res = await createShift(eventID, { numberNeeded: 0, maxPeople: 0 });

    expect(res.status).toBe(400);
  });
});

describe('GET /shifts/:shiftID', () => {
  it('returns the full shift document', async () => {
    const eventID = await setupEvent();
    const created = await createShift(eventID);

    const res = await request(app).get(`/shifts/${created.body.shiftID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: created.body.shiftID, eventID, volunteers: [] });
  });

  it('returns 404 for a nonexistent shift', async () => {
    const res = await request(app).get(`/shifts/${NONEXISTENT_ID}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed shiftID', async () => {
    const res = await request(app).get('/shifts/not-an-id');

    expect(res.status).toBe(400);
  });
});

describe('GET /shifts/event/:eventID', () => {
  it('returns shift ids for that event', async () => {
    const eventID = await setupEvent();
    const created = await createShift(eventID);

    const res = await request(app).get(`/shifts/event/${eventID}`);

    expect(res.status).toBe(200);
    expect(res.body).toContain(created.body.shiftID);
  });

  it('returns 400 for a malformed eventID', async () => {
    const res = await request(app).get('/shifts/event/not-an-id');

    expect(res.status).toBe(400);
  });
});

describe('PATCH /shifts/:shiftID/volunteers', () => {
  it('adds a volunteer to the shift', async () => {
    const eventID = await setupEvent();
    const shift = await createShift(eventID, { maxPeople: 2 });
    const volunteerID = await createVolunteer();

    const res = await request(app)
      .patch(`/shifts/${shift.body.shiftID}/volunteers`)
      .send({ volunteerID });

    expect(res.status).toBe(200);
    expect(res.body.volunteers).toContain(volunteerID);
  });

  it('rejects adding a volunteer id that does not resolve', async () => {
    const eventID = await setupEvent();
    const shift = await createShift(eventID);

    const res = await request(app)
      .patch(`/shifts/${shift.body.shiftID}/volunteers`)
      .send({ volunteerID: NONEXISTENT_ID });

    expect(res.status).toBe(404);
  });

  it('rejects adding the same volunteer twice', async () => {
    const eventID = await setupEvent();
    const shift = await createShift(eventID, { maxPeople: 2 });
    const volunteerID = await createVolunteer();
    await request(app).patch(`/shifts/${shift.body.shiftID}/volunteers`).send({ volunteerID });

    const res = await request(app)
      .patch(`/shifts/${shift.body.shiftID}/volunteers`)
      .send({ volunteerID });

    expect(res.status).toBe(409);
  });

  it('rejects adding a volunteer beyond maxPeople capacity', async () => {
    const eventID = await setupEvent();
    const shift = await createShift(eventID, { maxPeople: 1 });
    const first = await createVolunteer('First');
    const second = await createVolunteer('Second');
    await request(app)
      .patch(`/shifts/${shift.body.shiftID}/volunteers`)
      .send({ volunteerID: first });

    const res = await request(app)
      .patch(`/shifts/${shift.body.shiftID}/volunteers`)
      .send({ volunteerID: second });

    expect(res.status).toBe(409);
  });

  it('returns 404 when the shift does not exist', async () => {
    const volunteerID = await createVolunteer();

    const res = await request(app)
      .patch(`/shifts/${NONEXISTENT_ID}/volunteers`)
      .send({ volunteerID });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Shift not found');
  });

  it('returns 400 for a malformed shiftID', async () => {
    const volunteerID = await createVolunteer();

    const res = await request(app)
      .patch('/shifts/not-an-id/volunteers')
      .send({ volunteerID });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a malformed volunteerID', async () => {
    const eventID = await setupEvent();
    const shift = await createShift(eventID);

    const res = await request(app)
      .patch(`/shifts/${shift.body.shiftID}/volunteers`)
      .send({ volunteerID: 'not-an-id' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /shifts/:shiftID/volunteers/remove', () => {
  it('removes a volunteer from the shift', async () => {
    const eventID = await setupEvent();
    const shift = await createShift(eventID, { maxPeople: 1 });
    const volunteerID = await createVolunteer();
    await request(app).patch(`/shifts/${shift.body.shiftID}/volunteers`).send({ volunteerID });

    const res = await request(app)
      .patch(`/shifts/${shift.body.shiftID}/volunteers/remove`)
      .send({ volunteerID });

    expect(res.status).toBe(200);
    expect(res.body.volunteers).not.toContain(volunteerID);
  });

  it('returns 404 when the volunteer is not on the shift', async () => {
    const eventID = await setupEvent();
    const shift = await createShift(eventID);
    const volunteerID = await createVolunteer();

    const res = await request(app)
      .patch(`/shifts/${shift.body.shiftID}/volunteers/remove`)
      .send({ volunteerID });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Volunteer is not on this shift');
  });

  it('returns 404 when the shift does not exist', async () => {
    const volunteerID = await createVolunteer();

    const res = await request(app)
      .patch(`/shifts/${NONEXISTENT_ID}/volunteers/remove`)
      .send({ volunteerID });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Shift not found');
  });

  it('returns 400 for a malformed shiftID', async () => {
    const volunteerID = await createVolunteer();

    const res = await request(app)
      .patch('/shifts/not-an-id/volunteers/remove')
      .send({ volunteerID });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a malformed volunteerID', async () => {
    const eventID = await setupEvent();
    const shift = await createShift(eventID);

    const res = await request(app)
      .patch(`/shifts/${shift.body.shiftID}/volunteers/remove`)
      .send({ volunteerID: 'not-an-id' });

    expect(res.status).toBe(400);
  });
});
