const mongoose = require('mongoose');

const showApplicationSchema = new mongoose.Schema({
  show: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'refused'],
    default: 'pending'
  },
  appliedAt: {
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

// Index pour éviter les doublons (un membre ne peut postuler qu'une fois au même rôle pour un show)
showApplicationSchema.index({ show: 1, member: 1, role: 1 }, { unique: true });

// Index pour les recherches fréquentes
showApplicationSchema.index({ show: 1, status: 1 });
showApplicationSchema.index({ member: 1, status: 1 });

const ShowApplication = mongoose.model('ShowApplication', showApplicationSchema);

module.exports = ShowApplication;