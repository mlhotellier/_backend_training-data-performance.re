const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  stravaId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  activitiesImported: { 
    type: Boolean, 
    default: false 
  }
});

module.exports = mongoose.model('User', userSchema);