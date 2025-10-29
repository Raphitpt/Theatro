const express = require('express');
const router = express.Router();
const ShowController = require('../src/controller/show');
const AuthMiddleware = require('../src/middleware/auth');

router.post('/show/:showId/apply', AuthMiddleware, ShowController.applyToShow);

module.exports = router;