const mongoose = require('mongoose');

const activityDetailSchema = new mongoose.Schema({
  activityId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  athleteId: {
    type: String,
    required: true,
    ref: 'User',
  },
  location: {
    type: String,
    default: '',
  },
  weather: {
    description: { type: String, default: '' },
    temperature: { type: Number, default: 0 },
  },
  streams: {
    altitude: [{}],          // ou [mongoose.Schema.Types.Mixed]
    latlng: [{}],
    heartrate: [{}],
    velocity_smooth: [{}],
    distance: [{}],
    time: [{}],
  },
}, { timestamps: true });

activityDetailSchema.index({ athleteId: 1 });

module.exports = mongoose.model('ActivityDetail', activityDetailSchema);