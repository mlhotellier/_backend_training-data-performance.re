const fs = require('fs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

const generateJwtToken = (athleteId) => {
  const payload = { athleteId };
  const secret = process.env.JWT_SECRET;  // Stocker cette clé secrète dans un fichier .env
  const options = { expiresIn: '6h' };  // Le token expire après 6 heures
  return jwt.sign(payload, secret, options);
};

const saveToken = async (stravaId, username, accessToken, refreshToken, expiresAt ) => {
  const existingToken = await User.findOne({ stravaId });

  if (existingToken) {
    // 🔄 Mise à jour
    existingToken.accessToken = accessToken;
    existingToken.refreshToken = refreshToken;
    existingToken.expiresAt = expiresAt;
    await existingToken.save();
  } else {
    // 🆕 Création
    const newToken = new User({
      stravaId,
      username,
      accessToken,
      refreshToken,
      expiresAt
    });
    await newToken.save();
  }
};

function isTokenExpired(expiresAt) {
  const now = new Date();
  return now >= expiresAt;
};

async function refreshAccessToken(user) {
  const response = await axios.post('https://www.strava.com/oauth/token', null, {
    params: {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
    },
  });

  user.accessToken = response.data.access_token;
  user.refreshToken = response.data.refresh_token;
  user.expiresAt = new Date(response.data.expires_at * 1000);
  await user.save();

  return user.accessToken;
};

async function getValidAccessToken(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  if (isTokenExpired(user.expiresAt)) {
    return await refreshAccessToken(user);
  }

  return user.accessToken;
};

// Exporter les fonctions pour pouvoir les utiliser dans d'autres fichiers
module.exports = {
  generateJwtToken,
  saveToken,   
  isTokenExpired,
  refreshAccessToken,
  getValidAccessToken,
};
