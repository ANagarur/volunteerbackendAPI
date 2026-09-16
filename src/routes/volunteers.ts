import { Router } from 'express';
import { Volunteer } from '../models/Volunteer';
import { CreateVolunteerSchema, VolunteerIdParamSchema } from '../validation/volunteer.schema';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = CreateVolunteerSchema.parse(req.body);
    const volunteer = await Volunteer.create(data);
    res.status(201).json({ volunteerID: volunteer._id });
  })
);

router.get(
  '/:volunteerID',
  asyncHandler(async (req, res) => {
    const { volunteerID } = VolunteerIdParamSchema.parse(req.params);
    const volunteer = await Volunteer.findById(volunteerID);
    if (!volunteer) throw new AppError(404, 'Volunteer not found');
    res.json(volunteer);
  })
);

export default router;