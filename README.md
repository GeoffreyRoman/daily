# Journal Quotidien - Application Web

Une application web moderne pour tenir un journal quotidien avec intégration de l'IA, cartes interactives et recherche avancée.

## 🚀 Fonctionnalités

- **Journal quotidien** : Écrivez vos pensées et expériences quotidiennes
- **IA Intégrée** : Utilisez Gemini pour générer du contenu à partir de prompts
- **Calendrier interactif** : Naviguez facilement entre les dates
- **Géolocalisation** : Ajoutez des lieux à vos entrées avec cartes OpenStreetMap
- **Recherche avancée** : Recherche par mots-clés, dates, ou zones géographiques
- **Interface moderne** : Design responsive avec TailwindCSS

## 🛠 Technologies

### Frontend
- **Angular 20** avec architecture zoneless
- **TailwindCSS** pour le styling
- **Leaflet** pour les cartes interactives
- **TypeScript** pour le typage statique

### Backend
- **Node.js** avec Express
- **TypeScript** pour le backend
- **PostgreSQL** pour la base de données
- **Gemini** pour la génération de contenu
- **JWT** pour l'authentification

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 12+
- Clé API Gemini

## 🔧 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd daily-journal
```

### 2. Installation rapide des dépendances

```bash
# Installation automatique de toutes les dépendances
./install-deps.sh
```

### 3. Configuration Backend

```bash
cd backend
npm install
```

Créez un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Modifiez les variables d'environnement dans `.env` :
- `DB_*` : Paramètres PostgreSQL
- `JWT_SECRET` : Clé secrète pour JWT
- `GEMINI_API_KEY` : Votre clé API Gemini
- `GEMINI_MODEL` : Modèle utilisé (par défaut `gemini-3.5-flash-lite`)

### 3. Configuration Base de Données

Créez la base de données PostgreSQL :

```sql
CREATE DATABASE daily_journal;
```

Exécutez le script de création des tables :

```bash
psql -U postgres -d daily_journal -f database.sql
```

### 4. Configuration Frontend

```bash
cd ../frontend
npm install
```

## 🚀 Démarrage

### Générer l'APK Android

Depuis PowerShell :

```powershell
cd frontend
npm run android:sync
cd android
.\gradlew.bat assembleDebug
```

L'APK debug sera disponible dans `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

### Développement (recommandé)

```bash
# Démarrer le backend et frontend en mode développement
./start.sh
```

### Production

#### Option 1 : Build et lancement automatique
```bash
# Construction et lancement complet en production
./start-prod.sh
```

#### Option 2 : Build séparé puis lancement
```bash
# 1. Construire pour la production
./build.sh

# 2. Lancer en production
./prod.sh
```

### Démarrage manuel

#### Backend
```bash
cd backend
npm run dev  # développement
# ou
npm run build && npm start  # production
```

#### Frontend
```bash
cd frontend
ng serve  # développement
# ou
ng build && serve -s dist/frontend  # production
```

## 🌐 URLs d'accès

- **Frontend** : http://localhost:4200
- **Backend API** : http://localhost:3000
- **Documentation API** : http://localhost:3000/api/docs (si configurée)

## 📁 Structure du Projet

```
daily-journal/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration DB
│   │   ├── middleware/      # Middlewares Express
│   │   ├── models/          # Types TypeScript
│   │   ├── routes/          # Routes API
│   │   └── index.ts         # Point d'entrée
│   ├── database.sql         # Schema PostgreSQL
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Composants Angular
│   │   │   ├── services/    # Services Angular
│   │   │   └── ...
│   │   └── styles.scss      # Styles globaux
│   └── package.json
└── README.md
```

## 🔗 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Journal
- `GET /api/journal` - Liste des entrées
- `POST /api/journal` - Créer une entrée
- `GET /api/journal/date/:date` - Entrée par date
- `PUT /api/journal/:id` - Modifier une entrée
- `DELETE /api/journal/:id` - Supprimer une entrée
- `POST /api/journal/search` - Recherche

### IA
- `POST /api/gemini/generate` - Générer du contenu avec Gemini

## 📜 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `./install-deps.sh` | Installe toutes les dépendances (backend + frontend + serve) |
| `./start.sh` | Lance l'application en mode développement |
| `./build.sh` | Construit l'application pour la production |
| `./prod.sh` | Lance l'application en mode production (simple) |
| `./start-prod.sh` | Build et lance l'application en production (complet) |

### Commandes npm individuelles

#### Backend
```bash
npm run dev     # Développement avec nodemon
npm run build   # Compilation TypeScript
npm start       # Production (nécessite build au préalable)
```

#### Frontend
```bash
ng serve        # Développement
ng build        # Construction pour production
```

## 🗺 Utilisation des Cartes

L'application utilise OpenStreetMap via Leaflet pour :
- Sélectionner une localisation manuellement
- Se géolocaliser automatiquement
- Afficher les lieux des entrées existantes
- Rechercher par zone géographique

## 🔍 Recherche

Plusieurs types de recherche sont disponibles :
- **Mots-clés** : Dans le contenu ou les noms de lieux
- **Dates** : Entre deux dates spécifiques
- **Géographique** : Dans un rayon autour d'un point

## 🔐 Sécurité

- Authentification JWT
- Hachage des mots de passe avec bcrypt
- Rate limiting sur les API
- Validation des entrées avec Joi
- Headers de sécurité avec Helmet

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🐛 Problèmes Connus

- Assurez-vous que PostgreSQL est démarré avant de lancer le backend
- La clé API Gemini est requise pour les fonctionnalités IA
- L'application nécessite une connexion internet pour les cartes

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.
