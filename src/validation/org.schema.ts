import { z } from 'zod';
import { objectIdSchema } from './volunteer.schema';

export const CreateOrgSchema = z.object({
  managerID: objectIdSchema,
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const OrgIdParamSchema = z.object({
  orgID: objectIdSchema,
});

export type CreateOrgInput = z.infer<typeof CreateOrgSchema>;