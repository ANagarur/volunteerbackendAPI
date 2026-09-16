import { z } from 'zod';
import { objectIdSchema } from './volunteer.schema';

export const CreateEventSchema = z.object({
  managerID: objectIdSchema,
  orgID: objectIdSchema,
  description: z.string().optional(),
});

export const EventIdParamSchema = z.object({
  eventID: objectIdSchema,
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;