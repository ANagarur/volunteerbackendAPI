import { Schema, Document, Types } from 'mongoose';
import { eventConnection } from '../config/db';

export interface IEvent extends Document {
  managerID: Types.ObjectId;
  orgID: Types.ObjectId;
  description?: string;
  createdAt: Date;
}

const eventSchema = new Schema<IEvent>({
  managerID: { type: Schema.Types.ObjectId, required: true },
  orgID: { type: Schema.Types.ObjectId, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Event = eventConnection.model<IEvent>('Event', eventSchema);