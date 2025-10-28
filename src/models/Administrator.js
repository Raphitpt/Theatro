const mongoose = require('mongoose');
const Member = require('./Member');

module.exports = Member.discriminator('Administrator', new mongoose.Schema({}));

