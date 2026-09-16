import { z } from 'zod';
import { objectIdSchema } from './volunteer.schema';

export const CreateShiftSchema = z
  .object({
    eventID: objectIdSchema,
    description: z.string().optional(),
    timing: z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    }),
    numberNeeded: z.number().int().min(0),
    maxPeople: z.number().int().min(1),
  })
  .refine((data) => data.timing.end > data.timing.start, {
    message: 'end must be after start',
    path: ['timing', 'end'],
  })
  .refine((data) => data.numberNeeded <= data.maxPeople, {
    message: 'numberNeeded cannot exceed maxPeople',
    path: ['numberNeeded'],
  });

export const ShiftIdParamSchema = z.object({
  shiftID: objectIdSchema,
});

export const AddVolunteerSchema = z.object({
  volunteerID: objectIdSchema,
});

export type CreateShiftInput = z.infer<typeof CreateShiftSchema>;