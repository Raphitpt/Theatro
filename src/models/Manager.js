const mongoose = require('mongoose');
const Member = require('./Member');

module.exports = Member.discriminator('Manager', new mongoose.Schema({}));