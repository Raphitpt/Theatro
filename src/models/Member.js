const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, require: true },
  firstname: { type: String, require: true },
  mail: { type: String, require: true },
  password: { type: String },
  resetPasswordToken: { type: String },
  communicationChannels: [{ type: String, enum: ['MAILS', 'PUSH', 'SMS'] }]
}, { discriminatorKey: 'role', collection: 'members', timestamps: true });

module.exports = mongoose.model('Member', memberSchema)