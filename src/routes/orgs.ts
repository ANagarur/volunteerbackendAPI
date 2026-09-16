import { Router } from 'express';
import { Organization } from '../models/Organization';
import { Volunteer } from '../models/Volunteer';
import { CreateOrgSchema, OrgIdParamSchema } from '../validation/org.schema';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = CreateOrgSchema.parse(req.body);

    const manager = await Volunteer.findById(data.managerID);
    if (!manager) throw new AppError(404, 'managerID does not reference an existing volunteer');

    const org = await Organization.create(data);
    res.status(201).json({ orgID: org._id });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const orgs = await Organization.find({}, '_id');
    res.json(orgs.map((o) => o._id));
  })
);

router.get(
  '/:orgID',
  asyncHandler(async (req, res) => {
    const { orgID } = OrgIdParamSchema.parse(req.params);
    const org = await Organization.findById(orgID);
    if (!org) throw new AppError(404, 'Organization not found');
    res.json(org);
  })
);

export default router;