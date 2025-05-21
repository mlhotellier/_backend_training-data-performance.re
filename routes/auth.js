const express = require('express');
const axios = require('axios');
const { generateJwtToken, saveToken } = require('../utils/tokenController');
const router = express.Router();

// 📌 Route GET /auth/strava (Initialisation de la connexion avec Strava)
router.get('/', (req, res) => {
    const redirectUri = process.env.STRAVA_REDIRECT_URI;
    const clientId = process.env.STRAVA_CLIENT_ID;

    // URL de redirection vers Strava pour obtenir le code
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=auto&scope=read,activity:read_all`;
    // Redirige l'utilisateur vers Strava pour autoriser l'accès
    res.redirect(authUrl);
});

// 📌 Route GET /auth/strava/callback (Callback après que Strava ait renvoyé le code)
router.get('/strava/callback', async (req, res) => {
    const { code } = req.query;  // Récupère le code envoyé par Strava dans l'URL

    if (!code) {
        return res.status(400).json({ message: 'Code manquant dans la requête.' });
    }

    try {
        // ⚙️ Échange du code contre un access_token
        const response = await axios.post('https://www.strava.com/oauth/token', {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code'
        });

        const { access_token, refresh_token, expires_at, athlete } = response.data;

        // 🧠 Stocker les tokens et autres informations utiles dans MongoDB
        await saveToken(
            athlete.id,
            athlete.username,
            access_token,
            refresh_token,
            expires_at
        );

        const jwtToken = generateJwtToken(athlete.id);

        // Réponse réussie
        res.redirect(`${process.env.APP_URL}/?token=${jwtToken}`);

    } catch (error) {
        console.error("❌ Erreur durant le callback Strava :", error.message);
        res.status(500).json({ message: 'Erreur lors de l’authentification avec Strava.' });
    }
});

module.exports = router;
