const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  activityId: { type: Number, required: true, unique: true },
  athleteId: { type: String, required: true, ref: 'User' },
  name: String,
  distance: Number,
  moving_time: Number,
  elapsed_time: Number,
  total_elevation_gain: Number,
  type: String,
  sport_type: String,
  start_date: Date,
  start_date_local: Date,
  timezone: String,
  utc_offset: Number,
  average_speed: Number,
  max_speed: Number,
  has_heartrate: Boolean,
  average_heartrate: Number,
  max_heartrate: Number,
  elev_high: Number,
  elev_low: Number,
  location_city: String,
  location_state: String,
  location_country: String,
  start_latlng: [Number],
  end_latlng: [Number],
  kudos_count: Number,
  comment_count: Number,
  achievement_count: Number,
  athlete_count: Number,
  map: {
    id: String,
    summary_polyline: String,
    resource_state: Number,
  },
  trainer: Boolean,
  commute: Boolean,
  manual: Boolean,
  private: Boolean,
  visibility: String,
  flagged: Boolean,
  gear_id: String,
  upload_id: Number,
  upload_id_str: String,
  external_id: String,
  from_accepted_tag: Boolean,
  pr_count: Number,
  total_photo_count: Number,
  has_kudoed: Boolean,
}, { timestamps: true });

activitySchema.index({ athleteId: 1 });
activitySchema.index({ sport_type: 1 });
activitySchema.index({ start_date: -1 });

module.exports = mongoose.model('Activity', activitySchema);