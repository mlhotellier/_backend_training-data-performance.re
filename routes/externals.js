const express = require('express');
const router = express.Router();
const axios = require('axios');
const authHybrid = require('../middleware/authHybrid');
const ActivityDetail = require('../models/ActivityDetails');

// GET location name
router.get('/location', authHybrid, async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).send('Latitude et longitude requises');

    try {
        const existing = await ActivityDetail.findOne({
            "location": { $ne: "" },
        });

        if (existing && existing.location) {            
            return res.json(existing.location);
        }

        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
            params: {
                lat,
                lon,
                format: 'json'
            }
        });

        const data = response.data;
        const city = data.address?.city || data.address?.town || data.address?.village || "Lieu inconnu";
        res.json(city);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la récupération du lieu');
    }
});

// GET weather data
router.get('/weather', authHybrid, async (req, res) => {
    const { lat, lon, date, hour, minute } = req.query;
    
    if (!lat || !lon || !date || hour == null || minute == null) {
        return res.status(400).send('Paramètres requis : lat, lon, date, hour, minute');
    }

    try {
        const existing = await ActivityDetail.findOne({
            "weather.description": { $ne: "" },
        });

        if (existing && existing.weather) {            
            return res.json(existing.weather);
        }
        
        const key = process.env.VISUAL_CROSSING_KEY;
        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${date}`;

        const response = await axios.get(url, {
            params: {
                key,
                include: 'hours',
                unitGroup: 'metric'
            }
        });

        const data = response.data;
        const hours = data?.days?.[0]?.hours ?? [];

        let closestHour = hours.reduce((prev, curr) => {
            const currTime = new Date(`${date}T${curr.datetime}`);
            const currHour = currTime.getUTCHours() + 4;
            const currMinute = currTime.getUTCMinutes();
            const diff = Math.abs(currHour - hour) + Math.abs(currMinute - minute) / 60;

            const prevTime = new Date(`${date}T${prev.datetime}`);
            const prevHour = prevTime.getUTCHours() + 4;
            const prevMinute = prevTime.getUTCMinutes();
            const prevDiff = Math.abs(prevHour - hour) + Math.abs(prevMinute - minute) / 60;

            return diff < prevDiff ? curr : prev;
        }, hours[0]);

        res.json({
            description: closestHour?.conditions ?? "",
            temperature: closestHour?.temp ?? 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la récupération météo');
    }
});

module.exports = router;
