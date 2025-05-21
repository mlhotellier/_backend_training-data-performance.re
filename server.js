const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const profileRoute = require('./routes/profile');
const activitiesRoute = require('./routes/activities');
const goalsRoute = require('./routes/goals');
const externalsRoute = require('./routes/externals');

const cors = require('cors');
require('dotenv').config();

// Connexion à MongoDB
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Utiliser les routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoute);
app.use('/api/activities', activitiesRoute);
app.use('/api/goals', goalsRoute);
app.use('/api/externals', externalsRoute);

// 🚀 Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
