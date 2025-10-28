const mongoose = require('mongoose');
const Event = require('./Event');

module.exports = Event.discriminator('Show', new mongoose.Schema({
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
}));