const express = require('express');
const router = express.Router();
const EventController = require('../src/controller/event')
const ManagerMiddleware = require('../src/middleware/manager')
const AuthMiddleware = require('../src/middleware/auth')

router.post('/event/show', ManagerMiddleware, EventController.createShow)
router.post('/event/workshop', ManagerMiddleware, EventController.createWorkshop)
router.get('/event', AuthMiddleware, EventController.getAllEvents)
router.get('/event/:eventType/:eventId/followup', ManagerMiddleware, EventController.sendFollowUp)

module.exports = router