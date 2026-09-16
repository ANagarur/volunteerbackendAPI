// End-to-end happy-path test that exercises the full domain workflow across
// all 4 resources/DBs in one pass: volunteer -> org -> event -> shift ->
// assign volunteer -> unassign volunteer.
import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('full volunteer workflow', () => {
  it('creates a volunteer, org, event, and shift, then assigns and unassigns a volunteer', async () => {
    // 1. Create the manager volunteer.
    const managerRes = await request(app).post('/volunteers').send({ name: 'Manager Mo' });
    expect(managerRes.status).toBe(201);
    const managerID = managerRes.body.volunteerID;

    // 2. Create an org managed by that volunteer.
    const orgRes = await request(app)
      .post('/orgs')
      .send({ managerID, name: 'Community Helpers', description: 'Local volunteer org' });
    expect(orgRes.status).toBe(201);
    const orgID = orgRes.body.orgID;

    // 3. Create an event under that org.
    const eventRes = await request(app)
      .post('/events')
      .send({ managerID, orgID, description: 'Park cleanup' });
    expect(eventRes.status).toBe(201);
    const eventID = eventRes.body.eventID;

    // 4. Create a shift for the event.
    const shiftRes = await request(app)
      .post('/shifts')
      .send({
        eventID,
        description: 'Morning shift',
        timing: { start: '2026-02-01T08:00:00.000Z', end: '2026-02-01T12:00:00.000Z' },
        numberNeeded: 1,
        maxPeople: 1,
      });
    expect(shiftRes.status).toBe(201);
    const shiftID = shiftRes.body.shiftID;

    // 5. Create a separate volunteer to work the shift.
    const workerRes = await request(app).post('/volunteers').send({ name: 'Worker Wes' });
    expect(workerRes.status).toBe(201);
    const workerID = workerRes.body.volunteerID;

    // 6. Assign the worker to the shift.
    const assignRes = await request(app)
      .patch(`/shifts/${shiftID}/volunteers`)
      .send({ volunteerID: workerID });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.volunteers).toEqual([workerID]);

    // 7. Shift is now at capacity — a second volunteer cannot join.
    const otherRes = await request(app).post('/volunteers').send({ name: 'Overflow Olive' });
    const overflowRes = await request(app)
      .patch(`/shifts/${shiftID}/volunteers`)
      .send({ volunteerID: otherRes.body.volunteerID });
    expect(overflowRes.status).toBe(409);

    // 8. Verify the full chain is queryable end to end.
    expect((await request(app).get(`/volunteers/${managerID}`)).body.name).toBe('Manager Mo');
    expect((await request(app).get(`/orgs/${orgID}`)).body.name).toBe('Community Helpers');
    expect((await request(app).get(`/events/${eventID}`)).body.orgID).toBe(orgID);
    expect((await request(app).get(`/events/org/${orgID}`)).body).toHaveLength(1);
    expect((await request(app).get(`/shifts/event/${eventID}`)).body).toEqual([shiftID]);

    // 9. Unassign the worker and confirm the shift has room again.
    const removeRes = await request(app)
      .patch(`/shifts/${shiftID}/volunteers/remove`)
      .send({ volunteerID: workerID });
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.volunteers).toEqual([]);

    const rejoinRes = await request(app)
      .patch(`/shifts/${shiftID}/volunteers`)
      .send({ volunteerID: otherRes.body.volunteerID });
    expect(rejoinRes.status).toBe(200);
    expect(rejoinRes.body.volunteers).toEqual([otherRes.body.volunteerID]);
  });
});
