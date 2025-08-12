# Guide de Démarrage Rapide

## 🚀 Lancement de l'application

### Option 1 : Script automatique
```bash
./start.sh
```

### Option 2 : Démarrage manuel

#### 1. Backend
```bash
cd backend
npm run dev
```

#### 2. Frontend (dans un nouveau terminal)
```bash
cd frontend  
ng serve
```

## 📋 Prérequis

### 1. Base de données PostgreSQL
Créez une base de données nommée `daily_journal` :
```sql
CREATE DATABASE daily_journal;
```

Exécutez le script de création des tables :
```bash
psql -U postgres -d daily_journal -f backend/database.sql
```

### 2. Variables d'environnement
Créez un fichier `.env` dans le dossier `backend` avec :
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=daily_journal
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=votre_cle_secrete_jwt_tres_longue_et_securisee

MISTRAL_API_KEY=votre_cle_api_mistral
NODE_ENV=development
PORT=3000
```

### 3. Obtenir une clé API Mistral
1. Allez sur https://console.mistral.ai/
2. Créez un compte gratuit
3. Générez une clé API
4. Ajoutez-la dans votre fichier `.env`

## 🔗 URLs de l'application

- **Frontend** : http://localhost:4200
- **Backend API** : http://localhost:3000
- **Health Check** : http://localhost:3000/health

## 🎯 Première utilisation

1. Ouvrez http://localhost:4200
2. Créez un compte avec votre email
3. Commencez à écrire votre journal !

## 🆘 Problèmes courants

### Backend ne démarre pas
- Vérifiez que PostgreSQL est démarré
- Vérifiez les variables d'environnement dans `.env`
- Vérifiez que le port 3000 n'est pas déjà utilisé

### Frontend ne se charge pas
- Vérifiez que Node.js 18+ est installé
- Vérifiez que le port 4200 n'est pas déjà utilisé
- Exécutez `npm install` dans le dossier frontend

### Problèmes de base de données
- Vérifiez que PostgreSQL est installé et démarré
- Vérifiez les paramètres de connexion dans `.env`
- Vérifiez que la base `daily_journal` existe

## 🔄 Redémarrage rapide

Pour redémarrer complètement :
```bash
# Arrêter les serveurs (Ctrl+C)
# Puis relancer
./start.sh
```
