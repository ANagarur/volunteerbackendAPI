# Volunteer Backend API Schema

## Base

`http://localhost:3000` · `Content-Type: application/json` for all bodies · errors return `{ error: string }` (or `{ error: "Validation failed", details }` for input validation failures via Zod).

## `GET /`

Health check — returns plain text `"API is running"`.

---

## Volunteers — `/volunteers`

| Method | Path | Body / Params | Response |
|---|---|---|---|
| POST | `/volunteers` | `{ name: string (required), contactInfo?: string }` | `201 { volunteerID }` |
| GET | `/volunteers/:volunteerID` | — | `200` full volunteer doc, `404` if not found |

**Volunteer document:** `{ _id, name, contactInfo?, createdAt }`

---

## Organizations — `/orgs`

| Method | Path | Body / Params | Response |
|---|---|---|---|
| POST | `/orgs` | `{ managerID: ObjectId (required, must be an existing Volunteer), name: string (required), description?: string }` | `201 { orgID }`, `404` if `managerID` doesn't resolve |
| GET | `/orgs` | — | `200` array of org `_id`s only |
| GET | `/orgs/:orgID` | — | `200` full org doc, `404` if not found |

**Organization document:** `{ _id, managerID, name, description?, createdAt }`

---

## Events — `/events`

| Method | Path | Body / Params | Response |
|---|---|---|---|
| POST | `/events` | `{ managerID: ObjectId (required, existing Volunteer), orgID: ObjectId (required, existing Organization), description?: string }` | `201 { eventID }`, `404` if `managerID` or `orgID` don't resolve |
| GET | `/events` | — | `200` array of full event docs |
| GET | `/events/org/:orgID` | — | `200` array of full event docs for that org |
| GET | `/events/:eventID` | — | `200` full event doc, `404` if not found |

**Event document:** `{ _id, managerID, orgID, description?, createdAt }`

---

## Shifts — `/shifts`

| Method | Path | Body / Params | Response |
|---|---|---|---|
| POST | `/shifts` | `{ eventID: ObjectId (required, existing Event), description?: string, timing: { start: date, end: date } (end must be after start), numberNeeded: int ≥0, maxPeople: int ≥1 (numberNeeded ≤ maxPeople) }` | `201 { shiftID }`, `404` if `eventID` doesn't resolve, `400` on validation failure |
| GET | `/shifts/:shiftID` | — | `200` full shift doc, `404` if not found |
| GET | `/shifts/event/:eventID` | — | `200` array of shift `_id`s for that event |
| PATCH | `/shifts/:shiftID/volunteers` | `{ volunteerID: ObjectId }` | Adds volunteer to shift. `200` updated shift; `404` if volunteer/shift not found; `409` if already on shift or shift at `maxPeople` capacity |
| PATCH | `/shifts/:shiftID/volunteers/remove` | `{ volunteerID: ObjectId }` | Removes volunteer from shift. `200` updated shift; `404` if shift not found or volunteer not on shift |

**Shift document:** `{ _id, eventID, description?, timing: { start, end }, numberNeeded, maxPeople, volunteers: ObjectId[] }`

---

## Notes on validation

- All `ObjectId` fields/params are validated as 24-char hex strings (`/^[0-9a-fA-F]{24}$/`) via Zod; anything else → `400 { error: "Validation failed", details }`.
- Referential checks (e.g. `managerID`, `orgID`, `eventID`, `volunteerID` pointing to real documents) are done manually in each route handler, not enforced at the DB level — each lives in its own separate MongoDB connection/database (volunteers, orgs, events, shifts are 4 independent Mongoose connections, no native cross-DB refs or joins).
