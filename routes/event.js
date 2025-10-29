const express = require('express');
const router = express.Router();
const EventController = require('../src/controller/event')
const ManagerMiddleware = require('../src/middleware/manager')

router.post('/event/show', ManagerMiddleware, EventController.createShow)

module.exports = router