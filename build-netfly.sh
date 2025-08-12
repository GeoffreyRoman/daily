#!/bin/bash

set -e

echo "🔨 Construction pour Netlify..."

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[BUILD] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Installation des dépendances root
log "Installation des dépendances principales..."
npm install

# Construction du backend
log "Construction du backend..."
cd backend
npm install
npm run build
cd ..

# Construction du frontend
log "Construction du frontend..."
cd frontend
npm install
npm run build
cd ..

# Préparation des Netlify Functions
log "Préparation des Netlify Functions..."
cd netlify
npm install

# Création du dossier functions si inexistant
mkdir -p functions

# Copie des sources du backend vers les functions
cp -r ../backend/src/* functions/ 2>/dev/null || true
cp -r ../backend/dist/* functions/ 2>/dev/null || true

cd ..

log "✅ Construction Netlify terminée avec succès!"
echo ""
echo "📁 Frontend prêt dans: frontend/dist/frontend/browser"
echo "📁 Functions prêtes dans: netlify/functions"
echo ""
