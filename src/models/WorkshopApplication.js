const mongoose = require('mongoose');

const workshopApplicationSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  availability: {
    type: String,
    enum: ['available', 'unavailable'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'refused'],
    default: 'pending'
  },
  respondedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Index pour éviter les doublons (un membre ne peut répondre qu'une fois par workshop)
workshopApplicationSchema.index({ workshop: 1, member: 1 }, { unique: true });

// Index pour les recherches fréquentes
workshopApplicationSchema.index({ workshop: 1, status: 1 });
workshopApplicationSchema.index({ workshop: 1, availability: 1 });
workshopApplicationSchema.index({ member: 1, status: 1 });

const WorkshopApplication = mongoose.model('WorkshopApplication', workshopApplicationSchema);

module.exports = WorkshopApplication;