
# Backend - Training Data Performance

Bienvenue dans le backend de l'application **Training Data Performance** !  
Ce serveur Express gere les routes pour récupérer automatiquement les activités Strava avec des données de localisation, de météo et de streams via des appels à des APIs externes, ainsi que les objectifs personnels.

## Table des matières
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage du projet](#démarrage-du-projet)
- [Structure des fichiers](#structure-des-fichiers)
- [Technologies utilisées](#technologies-utilisées)
- [Contributions](#contributions)
- [License](#license)
- [Contact](#contact)

---

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/mlhotellier/strava-activity-enhancer-backend.git
   ```

2. Accédez au dossier du projet :
   ```bash
   cd backend
   ```

3. Installez les dépendances :
   ```bash
   npm install
   ```

## Configuration

Créez un fichier `.env` à la racine du projet avec les variables nécessaires :

```bash
PORT=5000
API_BASE_URL=http://localhost:5000
APP_URL=http://localhost:5173
STRAVA_CLIENT_ID=<your-strava-client-id>
STRAVA_CLIENT_SECRET=<your-strava-client-secret>
STRAVA_REDIRECT_URI=http://localhost:5000/api/auth/strava/callback
MONGO_URI=mongodb+srv://<your-db-user>:<your-db-password>@cluster0.xbscunr.mongodb.net/training_data_performance?retryWrites=true&w=majority&appName=Cluster0
DB_USER=<your-db-user>
DB_PWD=<your-db-password>
VISUAL_CROSSING_KEY=<your-api-visual-crossing-key>
JWT_SECRET=<votre_secret_jwt>
INTERNAL_TASK_TOKEN=<your-internal-task-token>
```

✅ Assurez-vous que ce fichier soit bien listé dans `.gitignore`.

## Démarrage du projet

Lancez le serveur en mode développement avec :

```bash
npm run dev
```
ou 
```bash
nodemon
```

Le backend sera accessible sur : `http://localhost:5000`

## Structure des fichiers

```bash
/backend
  ├── /config
  ├── /middleware            # Middlewares (auth, etc.)
  ├── /models                # Schémas Mongoose
  ├── /node_modules            
  ├── /routes                # Définition des routes API (auth, activities, externals, etc.)
  ├── /tasks                 # Tâches de fond pour enrichissement
  ├── /utils   
  ├── .env                   # Variables d’environnement
  ├── .gitignore                   
  ├── package.json           # Scripts & dépendances
  ├── server.js              # Fichier principal Express
  ├── README.md  
```

## Technologies utilisées

- **Node.js** avec **Express** pour le serveur web
- **Mongoose** pour interagir avec MongoDB
- **JWT** pour l'authentification
- **Axios** pour les appels API externes (Strava, OpenStreetMap, Visual Crossing)

## Contributions

Les contributions sont les bienvenues !  

## License

Ce projet est sous licence MIT.

## Contact

Pour toute question ou suggestion, vous pouvez contacter :  
📧 mathislhotellier@gmail.com
