import { Schema, Document, Types } from 'mongoose';
import { shiftConnection } from '../config/db';

export interface IShift extends Document {
  eventID: Types.ObjectId;
  description?: string;
  timing: { start: Date; end: Date };
  numberNeeded: number;
  maxPeople: number;
  volunteers: Types.ObjectId[];
}

const shiftSchema = new Schema<IShift>({
  eventID: { type: Schema.Types.ObjectId, required: true },
  description: { type: String },
  timing: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  numberNeeded: { type: Number, required: true, min: 0 },
  maxPeople: { type: Number, required: true, min: 1 },
  volunteers: { type: [Schema.Types.ObjectId], default: [] },
});

export const Shift = shiftConnection.model<IShift>('Shift', shiftSchema);