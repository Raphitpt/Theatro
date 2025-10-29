const express = require('express');
const router = express.Router();
const ShowController = require('../src/controller/show');
const ApplicationController = require('../src/controller/application')
const ManagerMiddleware = require('../src/middleware/manager')
const AuthMiddleware = require('../src/middleware/auth');

router.post('/show/:showId/apply', AuthMiddleware, ShowController.applyToShow);
router.get('/show/:showId/applications', ManagerMiddleware, ApplicationController.getShowApplications)

module.exports = router;