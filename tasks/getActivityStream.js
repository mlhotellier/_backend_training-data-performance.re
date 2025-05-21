const fetchStreams = require('../utils/fetchStreams');

async function getActivityStreams({ activityId, athleteId }) {
  try {
    const streams = await fetchStreams(activityId, athleteId);

    if (!streams || Object.keys(streams).length === 0) {
      return null;
    }

    // ✅ On retourne directement les streams bruts, sans altération
    return { streams };
  } catch (err) {
    console.warn(`⚠️ Erreur fetch streams pour ${activityId}: ${err.message}`);
    return null;
  }
}

module.exports = getActivityStreams;
