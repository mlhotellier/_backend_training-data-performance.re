// middleware/authHybrid.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function authHybrid(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Pas de token fourni' });

  const token = authHeader.split(' ')[1];

  // 🔒 Cas 1 : Token interne
  if (token === process.env.INTERNAL_TASK_TOKEN) {
    req.internal = true; // facultatif, utile pour distinguer dans certaines routes
    return next();
  }

  // 🔐 Cas 2 : JWT utilisateur
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ stravaId: decoded.athleteId });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};
