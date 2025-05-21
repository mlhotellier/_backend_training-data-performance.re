const express = require('express');
const jwt = require('jsonwebtoken');
const Goal = require('../models/Goal');
const User = require('../models/User');
const router = express.Router();

// Route GET avec récupération et vérification du token directement dedans
router.get('/', async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).send('Accès refusé. Token manquant.');
  }

  try {
    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Utiliser l'ID utilisateur pour récupérer ses objectifs
    const goals = await Goal.find({ user: decoded.id });

    // 4. Répondre avec les objectifs
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(400).send('Token invalide ou erreur lors de la récupération des objectifs.');
  }
});

// POST - Créer un objectif
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token invalide' });
    }    

    // Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);    

    if (!decoded.athleteId) {
      return res.status(400).json({ message: 'stravaId manquant dans le token' });
    }

    const stravaId = decoded.athleteId;  // Récupérer le stravaId du payload du JWT
    
    // Récupérer les données de l'objectif depuis la requête
    const { type, metric, objectif, echeance } = req.body;  

    // Validation des données
    if (!type || !metric || !objectif || !echeance) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Vérifier si un token existe pour ce stravaId
    const userToken = await User.findOne({ stravaId });
    if (!userToken) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Création de l'objectif
    const newGoal = new Goal({
      type,
      metric,
      objectif,
      echeance,
      stravaId,  // Lier l'objectif à l'utilisateur via stravaId
    });

    // Sauvegarde dans la base de données
    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'objectif:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de l\'objectif' });
  }
});

// PUT - Modifier un objectif
router.put('/:id', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const stravaId = decoded.athleteId;
    const { id } = req.params;
    const { type, metric, objectif, echeance } = req.body;

    // Vérifier que l'objectif appartient bien à l'utilisateur
    const goal = await Goal.findOne({ _id: id, stravaId });
    if (!goal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }

    // Mettre à jour l'objectif
    goal.type = type || goal.type;
    goal.metric = metric || goal.metric;
    goal.objectif = objectif || goal.objectif;
    goal.echeance = echeance || goal.echeance;

    await goal.save();
    res.status(200).json(goal);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'objectif:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'objectif' });
  }
});

// DELETE - Supprimer un objectif
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const stravaId = decoded.athleteId;
    const { id } = req.params;

    // Vérifier que l'objectif appartient bien à l'utilisateur
    const goal = await Goal.findOne({ _id: id, stravaId });
    if (!goal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }

    // Supprimer l'objectif
    await Goal.deleteOne({ _id: id });
    res.status(200).json({ message: 'Objectif supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'objectif:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'objectif' });
  }
});

module.exports = router;