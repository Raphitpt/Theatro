const express = require('express');
const router = express.Router();
const AuthController = require('../src/controller/auth');
const AdminMiddleware = require('../src/middleware/admin');

router.post('/login', AuthController.login);
router.post('/register', AdminMiddleware, AuthController.register);
router.patch('/choose-password', AuthController.choosePassword);


module.exports = router;