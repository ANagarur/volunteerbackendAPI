// Runs before any test module is imported (Jest `setupFiles`), so it can
// point the app at dedicated test databases before src/config/db.ts reads
// process.env. Uses the same local MongoDB instance as `npm run dev`, but
// separate database names, so tests never touch dev data.
process.env.VOLUNTEER_DB_URI = 'mongodb://127.0.0.1:27017/volunteerdb_test';
process.env.ORG_DB_URI = 'mongodb://127.0.0.1:27017/orgdb_test';
process.env.EVENT_DB_URI = 'mongodb://127.0.0.1:27017/eventdb_test';
process.env.SHIFT_DB_URI = 'mongodb://127.0.0.1:27017/shiftdb_test';
process.env.PORT = '0';
