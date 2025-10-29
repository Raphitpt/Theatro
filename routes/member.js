const express = require('express');
const router = express.Router();
const MemberController = require('../src/controller/member')
const ManagerMiddleware = require('../src/middleware/manager')
const AuthMiddleware = require('../src/middleware/auth')

router.get('/members', AuthMiddleware, MemberController.listAllMembers)
router.get('/member/:memberId', ManagerMiddleware, MemberController.listAllParticipations)

module.exports = router