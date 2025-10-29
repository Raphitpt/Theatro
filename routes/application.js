const express = require('express');
const router = express.Router();
const ApplicationController = require('../src/controller/show');
const ManagerMiddleware = require('../src/middleware/auth');

router.post('/show/:showId/apply', ManagerMiddleware, ApplicationController.applyToShow);

module.exports = router;