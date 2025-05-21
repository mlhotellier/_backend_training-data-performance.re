const axios = require('axios');
const User = require('../models/User'); // Assure-toi que le chemin est correct
const { getValidAccessToken } = require('./tokenController');

async function fetchStreams(activityId, athleteId) {  
  const user = await User.findOne({ stravaId: athleteId });
  if (!user) throw new Error(`Utilisateur avec stravaId ${athleteId} introuvable`);

  const accessToken = await getValidAccessToken(user);

  try {
    const res = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=altitude,latlng,heartrate,velocity_smooth,distance&key_by_type=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    return res.data;
  } catch (error) {
    throw new Error(`Erreur API Strava: ${error.response?.statusText || error.message}`);
  }
}

module.exports = fetchStreams;
