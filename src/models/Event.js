const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dateTimeStart: { type: Date, required: true },
  dateTimeEnd: { type: Date, required: true },
  location: {type: String, required: true },
  memberMax: {type: String, required: true},
  hasFollowUp: Boolean
}, { discriminatorKey: 'kind', collection: 'events', timestamps: true });

module.exports = mongoose.model('Event', eventSchema);