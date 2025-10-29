# Theatro API

> README généré à l'aide d'une IA

API REST pour la gestion d'événements théâtraux, de spectacles, d'ateliers et de candidatures.

## Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Base de données](#base-de-données)
- [Initialisation](#initialisation)
- [Démarrage](#démarrage)
- [Documentation API](#documentation-api)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Un compte MongoDB Atlas (ou une instance MongoDB locale)
- Un compte Resend pour l'envoi d'emails

## Installation

1. Cloner le repository :
```bash
git clone <url-du-repo>
cd Theatro
```

2. Installer les dépendances :
```bash
npm install
```

## Configuration

### 1. Créer le fichier .env

Créer un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Configuration du serveur
PORT=3000

# Configuration MongoDB
MONGO_DB_URL=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

# Configuration JWT
JWT_SECRET=votre_secret_jwt_tres_securise_et_long

# Configuration Resend (Service d'envoi d'emails)
RESEND_API_KEY=re_votre_cle_api_resend

# Configuration du compte administrateur initial
ADMIN_NAME=Admin
ADMIN_FIRSTNAME=Super
ADMIN_MAIL=admin@theatro.com
ADMIN_PASSWORD=VotreMotDePasseSecurise123!
```

### 2. Configurer MongoDB Atlas

1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un nouveau cluster (le tier gratuit suffit pour commencer)
3. Configurer l'accès réseau :
   - Aller dans "Network Access"
   - Ajouter votre adresse IP ou autoriser l'accès depuis n'importe où (0.0.0.0/0) pour le développement
4. Créer un utilisateur de base de données :
   - Aller dans "Database Access"
   - Créer un nouvel utilisateur avec les droits de lecture/écriture
5. Obtenir l'URL de connexion :
   - Cliquer sur "Connect" sur votre cluster
   - Choisir "Connect your application"
   - Copier l'URL de connexion
   - Remplacer `<username>`, `<password>` et `<database-name>` dans votre fichier `.env`

### 3. Configurer Resend

1. Créer un compte sur [Resend](https://resend.com)
2. Aller dans "API Keys"
3. Créer une nouvelle clé API
4. Copier la clé et la coller dans `RESEND_API_KEY` dans votre fichier `.env`

## Base de données

### Initialisation du compte administrateur

Avant de démarrer l'application, vous devez créer le compte administrateur initial :

```bash
node src/seeders/create-admin.js
```

Ce script va :
- Se connecter à MongoDB
- Vérifier si un administrateur existe déjà
- Créer un compte administrateur avec les informations du fichier `.env`
- Hacher le mot de passe de manière sécurisée

**Important** : Assurez-vous que votre fichier `.env` est correctement configuré avant d'exécuter cette commande.

## Démarrage

### Mode développement

```bash
npm start
```

Le serveur démarrera sur `http://localhost:3000` (ou le port spécifié dans `.env`)

## Documentation API

### Accès à Swagger

Une fois le serveur démarré, la documentation interactive Swagger est accessible à l'adresse :

```
http://localhost:3000/api-docs
```

La documentation Swagger vous permet de :
- Explorer tous les endpoints disponibles
- Tester les API directement depuis l'interface
- Voir les schémas de données requis
- Comprendre les codes de réponse HTTP

### Générer la documentation OpenAPI

Si vous modifiez les routes et souhaitez mettre à jour la documentation :

```bash
npm run swagger
```

## Structure du projet

```
Theatro/
├── bin/
│   └── www                 # Point d'entrée du serveur
├── docs/
│   └── open-api.yaml      # Spécification OpenAPI/Swagger
├── routes/
│   ├── auth.js            # Routes d'authentification
│   ├── event.js           # Routes pour les événements
│   ├── show.js            # Routes pour les spectacles
│   ├── workshop.js        # Routes pour les ateliers
│   ├── application.js     # Routes pour les candidatures
│   └── member.js          # Routes pour les membres
├── src/
│   ├── models/            # Modèles Mongoose
│   ├── seeders/           # Scripts d'initialisation de la BD
│   │   └── create-admin.js
│   └── middlewares/       # Middlewares Express
├── app.js                 # Configuration Express
├── package.json
└── .env                   # Variables d'environnement (à créer)
```

## Fonctionnalités

### Authentification
- Connexion/Déconnexion
- Gestion des tokens JWT
- Protection des routes par authentification

### Gestion des événements
- Création, lecture, mise à jour et suppression d'événements
- Association avec des spectacles et ateliers

### Gestion des spectacles
- CRUD complet pour les spectacles
- Association avec les événements

### Gestion des ateliers
- CRUD complet pour les ateliers
- Gestion des inscriptions

### Gestion des candidatures
- Soumission de candidatures
- Validation et traitement

### Gestion des membres
- Liste des membres
- CRUD des membres

### Sécurité
- Rate limiting : 100 requêtes par fenêtre de 15 minutes
- Authentification JWT
- Hash des mots de passe avec bcrypt
- Protection CORS

### Envoi d'emails
- Intégration avec Resend pour les notifications par email

## Configuration CORS

Par défaut, le serveur accepte les requêtes du frontend Vite sur `http://localhost:5173`. Pour modifier cette configuration, éditez le fichier `app.js` :

```javascript
app.use(cors({
  origin: 'http://localhost:5173', // Modifier cette URL selon vos besoins
  credentials: true
}));
```

## Scripts disponibles

- `npm start` : Démarre le serveur
- `npm run swagger` : Génère la documentation Swagger
- `node src/seeders/create-admin.js` : Initialise le compte administrateur

## Notes importantes

1. **Ne jamais commiter le fichier .env** : Il contient des informations sensibles
2. **Changer les secrets en production** : Utilisez des valeurs fortes et uniques pour JWT_SECRET et les mots de passe
3. **Configuration MongoDB** : Assurez-vous que votre cluster MongoDB est bien configuré et accessible
4. **Rate limiting** : Ajustez les limites selon vos besoins en production

## Support

Pour toute question ou problème, consultez la documentation Swagger ou contactez l'équipe de développement.