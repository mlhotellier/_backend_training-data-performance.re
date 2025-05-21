const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Accès non autorisé : token manquant' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // facultatif, au cas où tu veux l'utilisateur plus tard
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

module.exports = authenticate;
