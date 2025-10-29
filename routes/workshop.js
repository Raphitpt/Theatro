const express = require('express');
const router = express.Router();
const WorkshopController = require('../src/controller/workshop');
const ApplicationController = require('../src/controller/application');
const AuthMiddleware = require('../src/middleware/auth');
const ManagerMiddleware = require('../src/middleware/manager');

router.post('/workshop/:workshopId/apply', AuthMiddleware, WorkshopController.applyToWorkshop);
router.get('/workshop/:workshopId/applications', ManagerMiddleware, WorkshopController.getWorkshopApplications);
router.get('/workshop/:workshopId', ManagerMiddleware, WorkshopController.getWorkshop);

module.exports = router;