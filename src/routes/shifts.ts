import { Router } from 'express';
import { Shift } from '../models/Shift';
import { Event } from '../models/Event';
import { Volunteer } from '../models/Volunteer';
import {
  CreateShiftSchema,
  ShiftIdParamSchema,
  AddVolunteerSchema,
} from '../validation/shift.schema';
import { EventIdParamSchema } from '../validation/event.schema';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = CreateShiftSchema.parse(req.body);

    const event = await Event.findById(data.eventID);
    if (!event) throw new AppError(404, 'eventID does not reference an existing event');

    const shift = await Shift.create({ ...data, volunteers: [] });
    res.status(201).json({ shiftID: shift._id });
  })
);

router.get(
  '/:shiftID',
  asyncHandler(async (req, res) => {
    const { shiftID } = ShiftIdParamSchema.parse(req.params);
    const shift = await Shift.findById(shiftID);
    if (!shift) throw new AppError(404, 'Shift not found');
    res.json(shift);
  })
);

router.get(
  '/event/:eventID',
  asyncHandler(async (req, res) => {
    const { eventID } = EventIdParamSchema.parse(req.params);
    const shifts = await Shift.find({ eventID }, '_id');
    res.json(shifts.map((s) => s._id));
  })
);

router.patch(
  '/:shiftID/volunteers',
  asyncHandler(async (req, res) => {
    const { shiftID } = ShiftIdParamSchema.parse(req.params);
    const { volunteerID } = AddVolunteerSchema.parse(req.body);

    const volunteer = await Volunteer.findById(volunteerID);
    if (!volunteer) throw new AppError(404, 'volunteerID does not reference an existing volunteer');

    const shift = await Shift.findById(shiftID);
    if (!shift) throw new AppError(404, 'Shift not found');

    const alreadyOn = shift.volunteers.some((v) => v.toString() === volunteerID);
    if (alreadyOn) throw new AppError(409, 'Volunteer is already on this shift');

    if (shift.volunteers.length >= shift.maxPeople) {
      throw new AppError(409, 'Shift is at maximum capacity');
    }

    shift.volunteers.push(volunteer._id as any);
    await shift.save();
    res.json(shift);
  })
);

router.patch(
  '/:shiftID/volunteers/remove',
  asyncHandler(async (req, res) => {
    const { shiftID } = ShiftIdParamSchema.parse(req.params);
    const { volunteerID } = AddVolunteerSchema.parse(req.body);

    const shift = await Shift.findById(shiftID);
    if (!shift) throw new AppError(404, 'Shift not found');

    const index = shift.volunteers.findIndex((v) => v.toString() === volunteerID);
    if (index === -1) throw new AppError(404, 'Volunteer is not on this shift');

    shift.volunteers.splice(index, 1);
    await shift.save();
    res.json(shift);
  })
);

export default router;