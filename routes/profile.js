const express = require('express');
const jwt = require('jsonwebtoken'); // pour décoder le token
const axios = require('axios');
const User = require('../models/User');
const { getValidAccessToken } = require('../utils/tokenController');

const router = express.Router();

// 👤 Route pour récupérer les infos du profil
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Pas de token fourni' });
    }
    const token = authHeader.split(' ')[1]; // Format : "Bearer ton_token"


    const decoded = jwt.verify(token, process.env.JWT_SECRET); // vérifie et décode
    const stravaId = decoded.athleteId; // récupère le stravaId du token

    if (!stravaId) {
      return res.status(401).json({ message: 'Token invalide, stravaId manquant' });
    }

    const tokenData = await User.findOne({ stravaId });

    if (!tokenData) {
      return res.status(404).json({ message: 'Token Strava non trouvé' });
    }

    const accessToken = await getValidAccessToken(tokenData);
    const response = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json(response.data);

  } catch (error) {
    console.error('❌ Erreur récupération profil:', error.response?.data || error.message);
    res.status(500).send('Erreur récupération du profil');
  }
});

module.exports = router;
