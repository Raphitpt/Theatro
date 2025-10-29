const express = require('express');
const router = express.Router();
const MemberController = require('../src/controller/member')
const ManagerMiddleware = require('../src/middleware/manager')

router.get('/member/:memberId', ManagerMiddleware, MemberController.listAllParticipations)

module.exports = router