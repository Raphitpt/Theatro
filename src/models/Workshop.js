const mongoose = require('mongoose')
const Event = require('./Event')

module.exports = Event.discriminator('Workshop', new mongoose.Schema({}))