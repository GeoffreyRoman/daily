#!/bin/bash

# Script de vérification de l'environnement

echo "🔍 Vérification de l'environnement Daily Journal..."

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    check_ok "Node.js installé : $NODE_VERSION"
    
    # Vérifier la version
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        check_ok "Version Node.js compatible (>= 18)"
    else
        check_warn "Version Node.js < 18, mise à jour recommandée"
    fi
else
    check_error "Node.js non installé"
fi

# Vérifier npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    check_ok "npm installé : v$NPM_VERSION"
else
    check_error "npm non installé"
fi

# Vérifier PostgreSQL
if command -v psql >/dev/null 2>&1; then
    check_ok "PostgreSQL CLI disponible"
else
    check_warn "PostgreSQL CLI non trouvé, vérifiez l'installation"
fi

# Vérifier serve
if command -v serve >/dev/null 2>&1; then
    check_ok "serve installé (pour la production)"
else
    check_warn "serve non installé, exécutez: npm install -g serve"
fi

# Vérifier la structure du projet
echo ""
echo "📁 Structure du projet:"

if [ -f "package.json" ]; then
    check_ok "package.json racine trouvé"
else
    check_warn "package.json racine manquant"
fi

if [ -d "backend" ] && [ -f "backend/package.json" ]; then
    check_ok "Backend configuré"
else
    check_error "Dossier backend ou package.json manquant"
fi

if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    check_ok "Frontend configuré"
else
    check_error "Dossier frontend ou package.json manquant"
fi

# Vérifier les scripts
echo ""
echo "🔧 Scripts disponibles:"

scripts=("install-deps.sh" "build.sh" "prod.sh" "start-prod.sh" "start.sh")
for script in "${scripts[@]}"; do
    if [ -x "$script" ]; then
        check_ok "$script"
    else
        check_error "$script manquant ou non exécutable"
    fi
done

# Vérifier les builds
echo ""
echo "📦 Status des builds:"

if [ -d "backend/dist" ]; then
    check_ok "Backend compilé (backend/dist/)"
else
    check_warn "Backend non compilé, exécutez: ./build.sh"
fi

if [ -d "frontend/dist" ]; then
    check_ok "Frontend compilé (frontend/dist/)"
else
    check_warn "Frontend non compilé, exécutez: ./build.sh"
fi

# Vérifier la configuration
echo ""
echo "⚙️  Configuration:"

if [ -f "backend/.env" ]; then
    check_ok "Fichier .env backend trouvé"
else
    check_warn "Fichier .env backend manquant"
fi

echo ""
echo "🎯 Prochaines étapes recommandées:"
echo "1. Si des éléments manquent: ./install-deps.sh"
echo "2. Pour construire: ./build.sh"
echo "3. Pour lancer en production: ./prod.sh"
echo ""
