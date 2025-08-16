#!/bin/bash

# Script d'installation des dépendances pour Daily Journal

set -e

echo "📦 Installation des dépendances pour Daily Journal..."

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Installer serve globalement si pas déjà installé
if ! command -v serve >/dev/null 2>&1; then
    log "Installation de 'serve' pour servir le frontend en production..."
    npm install -g serve
else
    info "'serve' est déjà installé"
fi

# Installer les dépendances du backend
log "Installation des dépendances du backend..."
cd backend
npm install
cd ..

# Installer les dépendances du frontend
log "Installation des dépendances du frontend..."
cd frontend
npm install
cd ..

log "✅ Toutes les dépendances sont installées!"
echo ""
echo "🚀 Vous pouvez maintenant lancer l'application en production avec:"
echo "   ./start-prod.sh"
echo ""
