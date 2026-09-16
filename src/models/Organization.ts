import { Schema, Document, Types } from 'mongoose';
import { orgConnection } from '../config/db';

export interface IOrganization extends Document {
  managerID: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
}

const organizationSchema = new Schema<IOrganization>({
  managerID: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Organization = orgConnection.model<IOrganization>('Organization', organizationSchema);