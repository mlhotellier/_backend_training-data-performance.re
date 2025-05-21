const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  metric: {
    type: String,
    required: true,
  },
  objectif: {
    type: Number,
    required: true,
  },
  echeance: {
    type: String,
    required: true,
  },
  stravaId: {
    type: String,
    required: true,
    ref: 'User',
  },
});

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
