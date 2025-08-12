#!/bin/bash

# Script de construction pour la production

set -e

echo "🔨 Construction de Daily Journal pour la production..."

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

# Construction du backend
log "Construction du backend..."
cd backend

if [ ! -d "node_modules" ]; then
    info "Installation des dépendances du backend..."
    npm install
fi

info "Compilation TypeScript..."
npm run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ Échec de la compilation du backend"
    exit 1
fi

log "✅ Backend construit avec succès"
cd ..

# Construction du frontend
log "Construction du frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    info "Installation des dépendances du frontend..."
    npm install
fi

info "Construction Angular..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Échec de la construction du frontend"
    exit 1
fi

log "✅ Frontend construit avec succès"
cd ..

echo ""
echo "🎉 Construction terminée avec succès!"
echo "📁 Backend compilé dans: backend/dist/"
echo "📁 Frontend construit dans: frontend/dist/"
echo ""
echo "🚀 Lancez la production avec: ./prod.sh"
echo "📚 Ou utilisez le script complet: ./start-prod.sh"
echo ""
