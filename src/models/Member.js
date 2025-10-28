const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  firstname: { type: String, required: true },
  mail: { type: String, required: true, unique: true },
  password: { type: String },
  resetPasswordToken: { type: String },
  communicationChannels: [{ type: String, enum: ['MAILS', 'PUSH', 'SMS'] }]
}, { discriminatorKey: 'role', collection: 'members', timestamps: true });

const Member = mongoose.model('Member', memberSchema)

module.exports = Member