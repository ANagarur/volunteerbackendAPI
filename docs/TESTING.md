# Test Suite Documentation

This describes every automated test in the project: what it exercises, and what a pass/fail actually means. See [API_SCHEMA.md](API_SCHEMA.md) for the endpoint contracts these tests verify.

## How to run

```bash
docker start local-mongo   # ensure local MongoDB is running
npm test                   # jest --runInBand
```

Run a single file: `npx jest tests/integration/shifts.test.ts`
Run by name pattern: `npx jest --testPathPatterns=orgs`

## Test architecture

- **Framework:** Jest + `ts-jest` (TypeScript, type-checked). HTTP-level tests use `supertest` against `createApp()` directly — no real server/port is bound.
- **Database:** all tests hit a real local MongoDB (`mongodb://127.0.0.1:27017`), using 4 dedicated `*_test` databases (`volunteerdb_test`, `orgdb_test`, `eventdb_test`, `shiftdb_test`) so tests never touch dev data. Set in [tests/env.setup.ts](../tests/env.setup.ts).
- **Isolation:** [tests/setup.ts](../tests/setup.ts) waits for all 4 connections before each test file runs, wipes every collection after each test (`afterEach`), and closes all connections when the file finishes (`afterAll`). Each test therefore starts from an empty database.
- **No mocking:** the HTTP-level tests are real integration tests — real Express app, real Mongoose models, real MongoDB. The only thing not real is the network port (supertest talks to the app in-process). The `errorHandler` unit tests are the one place mocks are used (mocked Express `req`/`res`), since they test the middleware in isolation.

---

## `tests/unit/validation.test.ts` — Zod schema unit tests

No database, no HTTP — pure input-validation logic in isolation.

**`objectIdSchema`**
- accepts a valid 24-char hex id
- rejects invalid ids (`too-short`, a 23-char hex string, a number, an empty string)

**`CreateVolunteerSchema`**
- accepts a name-only payload
- accepts an optional `contactInfo`
- rejects a missing `name`
- rejects an empty `name`

**`CreateOrgSchema`**
- accepts a valid payload
- rejects an invalid `managerID` (format)
- rejects a missing `name`
- rejects a missing `managerID`

**`CreateEventSchema`**
- accepts a valid payload
- rejects a missing `orgID`
- rejects a missing `managerID`
- rejects a malformed `managerID`
- rejects a malformed `orgID`

**`CreateShiftSchema`**
- accepts a valid payload
- rejects `timing.end` before `timing.start`
- rejects `numberNeeded` greater than `maxPeople`
- rejects a negative `numberNeeded`
- rejects `maxPeople` of `0`

---

## `tests/unit/errorHandler.test.ts` — error-handling middleware unit tests

Calls `errorHandler` directly with mocked `req`/`res`/`next` — no app, no DB.

- responds `400` with `{ error: "Validation failed", details }` for a `ZodError`
- responds with the `AppError`'s own status code and message (e.g. `404`)
- responds `500` with `{ error: "Internal server error" }` for an unrecognized thrown `Error`, and logs it via `console.error`
- responds `500` for a non-`Error` thrown value (e.g. a plain string), confirming the fallback branch isn't relying on `Error`-specific behavior

---

## `tests/integration/health.test.ts` — `GET /`

- returns `200` with the plain-text body `"API is running"`

---

## `tests/integration/volunteers.test.ts` — `/volunteers`

**`POST /volunteers`**
- creates a volunteer and returns a 24-char hex `volunteerID`
- accepts the optional `contactInfo` field
- rejects a payload missing `name` → `400`
- rejects an empty `name` → `400`

**`GET /volunteers/:volunteerID`**
- returns the created volunteer's full document
- returns `404` for a well-formed but nonexistent id
- returns `400` for a malformed id

---

## `tests/integration/orgs.test.ts` — `/orgs`

**`POST /orgs`**
- creates an org when `managerID` references a real volunteer
- rejects a `managerID` that doesn't resolve to an existing volunteer → `404`
- rejects a missing `name` → `400`
- rejects a malformed `managerID` → `400`
- rejects a missing `managerID` → `400`

**`GET /orgs`**
- lists the ids of all created orgs

**`GET /orgs/:orgID`**
- returns the full org document, including `description`
- returns `404` for a nonexistent org
- returns `400` for a malformed orgID

---

## `tests/integration/events.test.ts` — `/events`

**`POST /events`**
- creates an event when both `managerID` and `orgID` resolve
- rejects a `managerID` that doesn't resolve → `404`
- rejects an `orgID` that doesn't resolve → `404`
- rejects a malformed `managerID` → `400`
- rejects a malformed `orgID` → `400`
- rejects a missing `managerID` → `400`

**`GET /events`**
- lists all created events

**`GET /events/org/:orgID`**
- returns only the events belonging to that org (verified against a second org's event to confirm filtering, not just presence)
- returns `400` for a malformed orgID

**`GET /events/:eventID`**
- returns the full event document
- returns `404` for a nonexistent event
- returns `400` for a malformed eventID

---

## `tests/integration/shifts.test.ts` — `/shifts`

**`POST /shifts`**
- creates a shift when `eventID` resolves
- rejects an `eventID` that doesn't resolve → `404`
- rejects `timing.end` before `timing.start` → `400`
- rejects `numberNeeded` greater than `maxPeople` → `400`
- rejects a negative `numberNeeded` → `400`
- rejects `maxPeople` of `0` → `400`

**`GET /shifts/:shiftID`**
- returns the full shift document (with an empty `volunteers` array on creation)
- returns `404` for a nonexistent shift
- returns `400` for a malformed shiftID

**`GET /shifts/event/:eventID`**
- returns shift ids belonging to that event
- returns `400` for a malformed eventID

**`PATCH /shifts/:shiftID/volunteers`** (assign)
- adds a volunteer to the shift
- rejects a `volunteerID` that doesn't resolve → `404`
- rejects adding the same volunteer twice → `409`
- rejects adding a volunteer once the shift is at `maxPeople` capacity → `409`
- returns `404` when the shift itself doesn't exist (distinct code path from the volunteer-not-found case)
- returns `400` for a malformed shiftID
- returns `400` for a malformed volunteerID

**`PATCH /shifts/:shiftID/volunteers/remove`** (unassign)
- removes a volunteer from the shift
- returns `404` when the volunteer isn't on the shift
- returns `404` when the shift itself doesn't exist (distinct code path from the volunteer-not-on-shift case)
- returns `400` for a malformed shiftID
- returns `400` for a malformed volunteerID

---

## `tests/integration/workflow.test.ts` — full end-to-end workflow

One test that chains all 4 resources together in a single realistic scenario, exercising the whole domain in sequence:

1. Create a manager volunteer.
2. Create an org managed by that volunteer.
3. Create an event under that org.
4. Create a 1-person-capacity shift for that event.
5. Create a second volunteer ("the worker") and assign them to the shift.
6. Confirm the shift is now full — a second volunteer attempting to join gets `409`.
7. Cross-check the full chain is queryable end-to-end: `GET` each resource by id, `GET /events/org/:orgID`, `GET /shifts/event/:eventID`.
8. Unassign the worker and confirm the shift is empty again.
9. Confirm the previously-rejected overflow volunteer can now join the freed-up slot.

This test is the one most likely to catch a regression that breaks the *interaction* between resources (e.g. a referential check silently no-op'ing) even if each resource's own unit/integration tests still pass individually.

---

## What's intentionally **not** covered

- **Load/performance testing** — none of these tests measure throughput or concurrency behavior.
- **Mongoose schema-level constraints** enforced only at the DB layer and not surfaced through a route (these are exercised indirectly wherever a route happens to trigger them, but there's no dedicated model-level test file).
- **Auth/authorization** — the API has no auth layer currently, so there's nothing to test here.
