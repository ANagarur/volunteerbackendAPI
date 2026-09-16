import { Router } from 'express';
import { Event } from '../models/Event';
import { Organization } from '../models/Organization';
import { Volunteer } from '../models/Volunteer';
import { CreateEventSchema, EventIdParamSchema } from '../validation/event.schema';
import { OrgIdParamSchema } from '../validation/org.schema';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = CreateEventSchema.parse(req.body);

    const manager = await Volunteer.findById(data.managerID);
    if (!manager) throw new AppError(404, 'managerID does not reference an existing volunteer');

    const org = await Organization.findById(data.orgID);
    if (!org) throw new AppError(404, 'orgID does not reference an existing organization');

    const event = await Event.create(data);
    res.status(201).json({ eventID: event._id });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const events = await Event.find();
    res.json(events);
  })
);

router.get(
  '/org/:orgID',
  asyncHandler(async (req, res) => {
    const { orgID } = OrgIdParamSchema.parse(req.params);
    const events = await Event.find({ orgID });
    res.json(events);
  })
);

router.get(
  '/:eventID',
  asyncHandler(async (req, res) => {
    const { eventID } = EventIdParamSchema.parse(req.params);
    const event = await Event.findById(eventID);
    if (!event) throw new AppError(404, 'Event not found');
    res.json(event);
  })
);

export default router;