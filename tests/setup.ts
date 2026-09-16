// Runs after the test framework is installed (Jest `setupFilesAfterEnv`),
// once per test file. Waits for the 4 Mongoose connections to be ready,
// wipes all collections between tests so each test starts from a clean
// database, and closes connections when the file's tests finish.
import {
  volunteerConnection,
  orgConnection,
  eventConnection,
  shiftConnection,
  closeAllConnections,
} from '../src/config/db';
import { Connection } from 'mongoose';

const connections: Connection[] = [
  volunteerConnection,
  orgConnection,
  eventConnection,
  shiftConnection,
];

function waitForConnection(conn: Connection): Promise<void> {
  if (conn.readyState === 1) return Promise.resolve();
  return new Promise((resolve, reject) => {
    conn.once('connected', () => resolve());
    conn.once('error', reject);
  });
}

beforeAll(async () => {
  await Promise.all(connections.map(waitForConnection));
});

afterEach(async () => {
  await Promise.all(
    connections.map((conn) =>
      Promise.all(Object.values(conn.collections).map((col) => col.deleteMany({})))
    )
  );
});

afterAll(async () => {
  await closeAllConnections();
});
