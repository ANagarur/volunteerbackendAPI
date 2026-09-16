import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const CreateVolunteerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactInfo: z.string().optional(),
});

export const VolunteerIdParamSchema = z.object({
  volunteerID: objectIdSchema,
});

export type CreateVolunteerInput = z.infer<typeof CreateVolunteerSchema>;