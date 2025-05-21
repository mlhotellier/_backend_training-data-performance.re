const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const Activity = require('../models/Activity');
const ActivityDetail = require('../models/ActivityDetails');
const { getValidAccessToken } = require('../utils/tokenController');
const enrichActivitiesBatch = require('../tasks/enrichActivitiesBatch');
const fetchWeather = require('../utils/fetchWeather');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Pas de token fourni' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const stravaId = decoded.athleteId;

    const user = await User.findOne({ stravaId });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const accessToken = await getValidAccessToken(user);
    const activitiesToStore = [];

    if (user.activitiesImported) {
      const lastActivity = await Activity.findOne({ athleteId: stravaId }).sort({ start_date: -1 });
      const lastDate = new Date(lastActivity.start_date).getTime() / 1000;

      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { per_page: 200, page, after: lastDate }
        });

        const newActivities = response.data;
        activitiesToStore.push(...newActivities);
        hasMore = newActivities.length === 200;
        page++;
      }

      if (activitiesToStore.length > 0) {
        await Activity.bulkWrite(activitiesToStore.map((a) => ({
          updateOne: {
            filter: { activityId: a.id },
            update: {
              $set: { ...a, activityId: a.id, athleteId: stravaId },
            },
            upsert: true,
          }
        })));
      }
    } else {
      let page = 1, hasMore = true;

      while (hasMore) {
        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { per_page: 200, page }
        });

        const activities = response.data;
        activitiesToStore.push(...activities);
        hasMore = activities.length === 200;
        page++;
      }

      await Activity.bulkWrite(activitiesToStore.map((a) => ({
        updateOne: {
          filter: { activityId: a.id },
          update: {
            $set: { ...a, activityId: a.id, athleteId: stravaId },
          },
          upsert: true,
        }
      })));

      user.activitiesImported = true;
      await user.save();
    }

    enrichActivitiesBatch(stravaId);

    const allActivities = await Activity.find({ athleteId: stravaId }).sort({ start_date: -1 });
    res.json(allActivities);
  } catch (err) {
    console.error('❌ Erreur récupération activités:', err.message);
    res.status(500).json({ message: 'Erreur lors de la récupération des activités' });
  }
});

router.get('/:id/streams', async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Pas de token fourni' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const stravaId = decoded.athleteId;

    if (!stravaId) {
      return res.status(401).json({ message: 'Token invalide, stravaId manquant' });
    }

    const act = await Activity.findOne({ athleteId: stravaId, activityId: id });
    if (!act || !act.start_latlng) {
      return res.status(404).json({ message: 'Activité introuvable ou coordonnées manquantes' });
    }

    // 🗺 Localisation
    const actLocation = await axios.get(
      `${process.env.API_BASE_URL}/api/externals/location`,
      {
        params: {
          lat: act.start_latlng[0],
          lon: act.start_latlng[1],
        },
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_TASK_TOKEN}`,
        },
      }
    );
    
    // 📦 Vérifie si les streams sont déjà enregistrés
    let detail = await ActivityDetail.findOne({ activityId: id, athleteId: stravaId });

    if (detail && detail.streams && Object.keys(detail.streams).length > 0) {
      if (!detail.location && actLocation?.data) {
        detail.location = actLocation.data;
        await detail.save();
      }

      return res.json({
        streams: detail.streams,
        location: detail.location || actLocation.data,
      });
    }

    const user = await User.findOne({ stravaId });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const accessToken = await getValidAccessToken(user);

    // 🛰 Récupérer les streams depuis Strava
    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${id}/streams?keys=altitude,latlng,heartrate,velocity_smooth,distance,cadence,temp&key_by_type=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des streams Strava');
    }

    const data = await response.json();

    // 🧩 Mettre à jour (ou créer) l’objet ActivityDetail
    if (!detail) {
      detail = new ActivityDetail({
        activityId: id,
        athleteId: stravaId,
        streams: data,
        location: actLocation.data,
      });
    }

    await detail.save();

    res.json({ streams: data, location: actLocation.data });
  } catch (error) {
    console.error('Erreur backend:', error.message);
    res.status(500).json({ message: 'Erreur lors de la récupération et enrichissement des streams.' });
  }
});

router.post('/full-sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Pas de token fourni' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const stravaId = decoded.athleteId;

    const user = await User.findOne({ stravaId });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const accessToken = await getValidAccessToken(user);

    // ⚠️ Supprimer toutes les activités existantes de l'utilisateur
    await Activity.deleteMany({ athleteId: stravaId });

    // 🆕 Réimporter depuis Strava
    const allActivities = [];
    let page = 1;
    let hasMoreActivities = true;

    while (hasMoreActivities) {
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { per_page: 200, page },
      });

      const activities = response.data;
      allActivities.push(...activities);

      if (activities.length < 200) {
        hasMoreActivities = false;
      } else {
        page++;
      }
    }

    const bulkOps = allActivities.map((a) => ({
      updateOne: {
        filter: { activityId: a.id },
        update: {
          $set: {
            ...a,
            activityId: a.id,
            athleteId: stravaId,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Activity.bulkWrite(bulkOps);
    }

    // 👉 Lancer l'enrichissement en arrière-plan
    enrichActivitiesBatch(stravaId);

    // ✅ Mettre à jour le flag
    user.activitiesImported = true;
    await user.save();

    res.json({ message: 'Synchronisation complète réussie', count: allActivities.length });
  } catch (error) {
    console.error('❌ Erreur synchronisation complète :', error.message);
    res.status(500).json({ message: 'Erreur lors de la synchronisation complète' });
  }
});

module.exports = router;
