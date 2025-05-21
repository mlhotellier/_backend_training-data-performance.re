const axios = require('axios');
require('dotenv').config();

async function fetchWeather(startDate, [lat, lon]) {
  const key = process.env.VISUAL_CROSSING_KEY;
  const date = new Date(startDate).toISOString().split('T')[0];

  if (!key) {
    throw new Error("Clé API météo manquante (VISUAL_CROSSING_API_KEY)");
  }

  try {
    const res = await axios.get(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${date}`,
      {
        params: {
          key,
          unitGroup: 'metric',
          include: 'days',
        },
      }
    );
    return res.data.days?.[0] || null;
  } catch (error) {
    throw new Error(`Erreur météo: ${error.response?.statusText || error.message}`);
  }
}

module.exports = fetchWeather;
