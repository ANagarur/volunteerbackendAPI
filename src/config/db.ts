import 'dotenv/config';
import mongoose, { Connection } from 'mongoose';

function createConnection(uri: string, label: string): Connection {
  const conn = mongoose.createConnection(uri);

  conn.on('connected', () => console.log(`[${label}] connected`));
  conn.on('error', (err) => console.error(`[${label}] connection error:`, err));
  conn.on('disconnected', () => console.warn(`[${label}] disconnected`));

  return conn;
}

export const volunteerConnection = createConnection(process.env.VOLUNTEER_DB_URI!, 'volunteers');
export const orgConnection = createConnection(process.env.ORG_DB_URI!, 'orgs');
export const eventConnection = createConnection(process.env.EVENT_DB_URI!, 'events');
export const shiftConnection = createConnection(process.env.SHIFT_DB_URI!, 'shifts');

export async function closeAllConnections(): Promise<void> {
  await Promise.all([
    volunteerConnection.close(),
    orgConnection.close(),
    eventConnection.close(),
    shiftConnection.close(),
  ]);
}