# 🚀 Guide de Démarrage Rapide - Production

Ce guide vous permet de lancer Daily Journal en production rapidement.

## ⚡ Démarrage Ultra-Rapide

```bash
# 1. Installer les dépendances
./install-deps.sh

# 2. Lancer en production (build + start automatique)
./start-prod.sh
```

## 📋 Prérequis

- Node.js 18+
- PostgreSQL en fonctionnement
- Clé API Mistral (optionnel)

## 🔧 Configuration Minimale

1. **Base de données** : Créez la base `daily_journal` avec le fichier `backend/database.sql`
2. **Variables d'environnement** : Le script créera automatiquement un fichier `.env` que vous devrez configurer

## 🌐 Accès à l'application

Une fois lancé, l'application sera disponible sur :
- **Frontend** : http://localhost:4200
- **Backend** : http://localhost:3000

## 🛠 Options de démarrage

### Option 1 : Tout automatique
```bash
./start-prod.sh
```
- Installe les dépendances manquantes
- Construit les applications
- Lance les serveurs
- Affiche les logs en temps réel

### Option 2 : Étapes séparées
```bash
./install-deps.sh  # Une seule fois
./build.sh         # Construction
./prod.sh          # Lancement
```

### Option 3 : Avec npm
```bash
npm run start      # Équivalent à ./start-prod.sh
npm run build      # Construction uniquement
npm run prod       # Lancement uniquement
```

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Backend** : `curl http://localhost:3000/api/health`
2. **Frontend** : Ouvrir http://localhost:4200
3. **Logs** : Consultez `logs/backend-prod.log` et `logs/frontend-prod.log`

## 🛑 Arrêt des services

Appuyez sur `Ctrl+C` dans le terminal où les scripts sont lancés.

## 📚 Documentation complète

Consultez le [README.md](README.md) pour plus de détails sur l'installation et la configuration.
