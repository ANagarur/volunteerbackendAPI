// Pure unit tests for the Zod validation schemas — no DB, no HTTP.
import { CreateVolunteerSchema, objectIdSchema } from '../../src/validation/volunteer.schema';
import { CreateOrgSchema } from '../../src/validation/org.schema';
import { CreateEventSchema } from '../../src/validation/event.schema';
import { CreateShiftSchema } from '../../src/validation/shift.schema';

const VALID_ID = '507f1f77bcf86cd799439011';

describe('objectIdSchema', () => {
  it('accepts a valid 24-char hex id', () => {
    expect(objectIdSchema.safeParse(VALID_ID).success).toBe(true);
  });

  it.each(['too-short', '507f1f77bcf86cd79943901', 12345, ''])(
    'rejects invalid id %p',
    (value) => {
      expect(objectIdSchema.safeParse(value).success).toBe(false);
    }
  );
});

describe('CreateVolunteerSchema', () => {
  it('accepts a name-only payload', () => {
    const result = CreateVolunteerSchema.safeParse({ name: 'Alex' });
    expect(result.success).toBe(true);
  });

  it('accepts an optional contactInfo', () => {
    const result = CreateVolunteerSchema.safeParse({ name: 'Alex', contactInfo: 'a@b.com' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing name', () => {
    expect(CreateVolunteerSchema.safeParse({}).success).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(CreateVolunteerSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('CreateOrgSchema', () => {
  it('accepts a valid payload', () => {
    const result = CreateOrgSchema.safeParse({ managerID: VALID_ID, name: 'Red Cross' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid managerID', () => {
    const result = CreateOrgSchema.safeParse({ managerID: 'not-an-id', name: 'Red Cross' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing name', () => {
    const result = CreateOrgSchema.safeParse({ managerID: VALID_ID });
    expect(result.success).toBe(false);
  });
});

describe('CreateEventSchema', () => {
  it('accepts a valid payload', () => {
    const result = CreateEventSchema.safeParse({ managerID: VALID_ID, orgID: VALID_ID });
    expect(result.success).toBe(true);
  });

  it('rejects a missing orgID', () => {
    const result = CreateEventSchema.safeParse({ managerID: VALID_ID });
    expect(result.success).toBe(false);
  });
});

describe('CreateShiftSchema', () => {
  const base = {
    eventID: VALID_ID,
    timing: { start: '2026-01-01T09:00:00.000Z', end: '2026-01-01T17:00:00.000Z' },
    numberNeeded: 2,
    maxPeople: 5,
  };

  it('accepts a valid payload', () => {
    expect(CreateShiftSchema.safeParse(base).success).toBe(true);
  });

  it('rejects end before start', () => {
    const result = CreateShiftSchema.safeParse({
      ...base,
      timing: { start: base.timing.end, end: base.timing.start },
    });
    expect(result.success).toBe(false);
  });

  it('rejects numberNeeded greater than maxPeople', () => {
    const result = CreateShiftSchema.safeParse({ ...base, numberNeeded: 10, maxPeople: 5 });
    expect(result.success).toBe(false);
  });

  it('rejects a negative numberNeeded', () => {
    const result = CreateShiftSchema.safeParse({ ...base, numberNeeded: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects maxPeople of 0', () => {
    const result = CreateShiftSchema.safeParse({ ...base, maxPeople: 0 });
    expect(result.success).toBe(false);
  });
});
