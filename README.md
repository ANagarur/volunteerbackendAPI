# Volunteer Backend API

A small Express + TypeScript API for managing volunteers, organizations, events, and shifts, backed by MongoDB (via Mongoose). Each resource type lives in its own database/connection (volunteers, orgs, events, shifts), with referential checks (e.g. "does this `managerID` point to a real volunteer?") enforced in the route handlers rather than the database.

Full endpoint reference: [docs/API_SCHEMA.md](docs/API_SCHEMA.md)
Test suite reference: [docs/TESTING.md](docs/TESTING.md)

## Prerequisites

- Node.js
- Docker (for running MongoDB locally)

## Setup

```bash
npm install
```

Copy/create a `.env` file in the project root (already present in this repo for local dev):

```
VOLUNTEER_DB_URI=mongodb://127.0.0.1:27017/volunteerdb
ORG_DB_URI=mongodb://127.0.0.1:27017/orgdb
EVENT_DB_URI=mongodb://127.0.0.1:27017/eventdb
SHIFT_DB_URI=mongodb://127.0.0.1:27017/shiftdb
PORT=3000
```

## Starting the API

**First time only** — create the MongoDB container (data persists in the `local-mongo-data` volume across restarts):
```bash
docker run -d --name local-mongo -p 27017:27017 -v local-mongo-data:/data/db mongo:7
```

**1. Start Docker Desktop** (if it isn't already running):
```bash
open -a Docker
```

**2. Start the API in dev mode** (auto-restarts on file changes):
```bash
npm run dev
```
This one command also starts the `local-mongo` container for you first (via a `predev` npm script that runs `docker start local-mongo`), so you don't need a separate Docker command every time — just make sure Docker Desktop itself is running.

You should see:
```
Server running on http://localhost:3000
[volunteers] connected
[orgs] connected
[events] connected
[shifts] connected
```

The API is now live at `http://localhost:3000`.

### Running a production build instead

```bash
npm run build   # compiles src/ -> dist/
npm start       # runs node dist/index.js
```

## Stopping the API

- Stop the dev server: `Ctrl+C` in the terminal it's running in.
- Stop MongoDB (optional — safe to leave running): `docker stop local-mongo`

## Making API calls

All requests/responses are JSON (`Content-Type: application/json`). Here's a full example workflow with `curl` — create a volunteer, an org, an event, and a shift, then assign a volunteer to it.

```bash
# 1. Create a volunteer (who will manage the org)
curl -X POST http://localhost:3000/volunteers \
  -H "Content-Type: application/json" \
  -d '{"name": "Alex Doe", "contactInfo": "alex@example.com"}'
# -> { "volunteerID": "..." }

# 2. Create an org managed by that volunteer
curl -X POST http://localhost:3000/orgs \
  -H "Content-Type: application/json" \
  -d '{"managerID": "<volunteerID>", "name": "Community Helpers"}'
# -> { "orgID": "..." }

# 3. Create an event under that org
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"managerID": "<volunteerID>", "orgID": "<orgID>", "description": "Park cleanup"}'
# -> { "eventID": "..." }

# 4. Create a shift for that event
curl -X POST http://localhost:3000/shifts \
  -H "Content-Type: application/json" \
  -d '{
        "eventID": "<eventID>",
        "timing": { "start": "2026-02-01T08:00:00.000Z", "end": "2026-02-01T12:00:00.000Z" },
        "numberNeeded": 1,
        "maxPeople": 2
      }'
# -> { "shiftID": "..." }

# 5. Create a second volunteer to work the shift, then assign them
curl -X POST http://localhost:3000/volunteers -H "Content-Type: application/json" -d '{"name": "Worker Wes"}'
curl -X PATCH http://localhost:3000/shifts/<shiftID>/volunteers \
  -H "Content-Type: application/json" \
  -d '{"volunteerID": "<workerID>"}'

# 6. Look things up
curl http://localhost:3000/volunteers/<volunteerID>
curl http://localhost:3000/orgs
curl http://localhost:3000/events/org/<orgID>
curl http://localhost:3000/shifts/event/<eventID>

# 7. Remove the volunteer from the shift
curl -X PATCH http://localhost:3000/shifts/<shiftID>/volunteers/remove \
  -H "Content-Type: application/json" \
  -d '{"volunteerID": "<workerID>"}'
```

Errors come back as `{ "error": "<message>" }`, or `{ "error": "Validation failed", "details": {...} }` for bad input. See [docs/API_SCHEMA.md](docs/API_SCHEMA.md) for the complete list of endpoints, request bodies, and possible responses (including 404/409/400 cases).

## Running tests

```bash
npm test
```
Like `npm run dev`, this also auto-starts `local-mongo` first (via a `pretest` script) — just make sure Docker Desktop is running.

Tests run against dedicated `*_test` databases on the same local MongoDB instance, so they never touch your dev data. See [docs/TESTING.md](docs/TESTING.md) for exactly what's covered.

## Project structure

```
src/
  app.ts              # Express app + route mounting
  index.ts            # entry point — starts the HTTP server
  config/db.ts        # 4 separate Mongoose connections (volunteers/orgs/events/shifts)
  models/             # Mongoose schemas
  routes/             # Express route handlers
  validation/         # Zod request-validation schemas
  middleware/
    errorHandler.ts   # centralized error -> HTTP response mapping
tests/
  unit/               # schema + middleware unit tests (no DB)
  integration/        # full HTTP + DB integration tests (supertest)
docs/
  API_SCHEMA.md        # full endpoint reference
  TESTING.md           # full test-coverage reference
```

## Notes

- Each resource (volunteers, orgs, events, shifts) has its **own MongoDB database and Mongoose connection** — there are no native cross-database references or joins. Referential integrity (e.g. an event's `orgID` pointing to a real org) is checked manually in the route handlers.
- `.env` and `node_modules/` are gitignored — never commit real database credentials.
