import { Schema, Document } from 'mongoose';
import { volunteerConnection } from '../config/db';

export interface IVolunteer extends Document {
  name: string;
  contactInfo?: string;
  createdAt: Date;
}

const volunteerSchema = new Schema<IVolunteer>({
  name: { type: String, required: true },
  contactInfo: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Volunteer = volunteerConnection.model<IVolunteer>('Volunteer', volunteerSchema);