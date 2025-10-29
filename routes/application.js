const express = require('express');
const router = express.Router();
const ApplicationController = require('../src/controller/application');
const ManagerMiddleware = require('../src/middleware/manager');

router.post('/application/:applicationId/process', ManagerMiddleware, ApplicationController.processApplication);

module.exports = router;