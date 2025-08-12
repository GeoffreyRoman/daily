#!/bin/bash

# Script de démarrage en production pour Daily Journal
# Ce script construit et lance le frontend et le backend en mode production

set -e  # Arrêter le script si une commande échoue

echo "🚀 Démarrage de Daily Journal en mode production..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les logs avec couleur
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "start-prod.sh" ]; then
    error "Ce script doit être exécuté depuis le répertoire racine du projet"
    exit 1
fi

# Créer le répertoire de logs s'il n'existe pas
mkdir -p logs

# Fonction pour nettoyer les processus à la sortie
cleanup() {
    log "Arrêt des services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

# Capturer Ctrl+C pour nettoyer proprement
trap cleanup SIGINT SIGTERM

# 1. Construction du backend
log "📦 Construction du backend..."
cd backend
if [ ! -d "node_modules" ]; then
    info "Installation des dépendances du backend..."
    npm install
fi

log "Compilation du TypeScript..."
npm run build

if [ ! -f "dist/index.js" ]; then
    error "La compilation du backend a échoué"
    exit 1
fi

log "✅ Backend construit avec succès"
cd ..

# 2. Construction du frontend
log "📦 Construction du frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    info "Installation des dépendances du frontend..."
    npm install
fi

log "Construction de l'application Angular..."
npm run build

if [ ! -d "dist" ]; then
    error "La construction du frontend a échoué"
    exit 1
fi

log "✅ Frontend construit avec succès"
cd ..

# 3. Vérification des variables d'environnement
log "🔧 Vérification de la configuration..."

if [ ! -f "backend/.env" ]; then
    warning "Fichier .env manquant dans le backend"
    info "Création d'un fichier .env par défaut..."
    cat > backend/.env << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=votre-jwt-secret-super-securise-changez-moi
MISTRAL_API_KEY=votre-cle-mistral-api
DB_HOST=localhost
DB_PORT=5432
DB_NAME=daily_journal
DB_USER=daily_user
DB_PASSWORD=votre-mot-de-passe
EOF
    warning "⚠️  Veuillez configurer le fichier backend/.env avec vos vraies valeurs avant de continuer"
    read -p "Appuyez sur Entrée une fois la configuration terminée..."
fi

# 4. Démarrage des services
log "🚀 Démarrage des services..."

# Démarrer le backend
log "Démarrage du backend sur le port 3000..."
cd backend
NODE_ENV=production npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
sleep 3

# Vérifier que le backend fonctionne
if ! curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    warning "Le backend ne répond pas sur http://localhost:3000"
    info "Vérifiez les logs dans logs/backend.log"
fi

# Démarrer un serveur web pour le frontend (nginx ou serve)
log "Démarrage du serveur web pour le frontend..."

# Vérifier si 'serve' est installé globalement
if command -v serve >/dev/null 2>&1; then
    cd frontend/dist/frontend
    serve -s . -l 4200 > ../../../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ../../..
    log "Frontend servi sur http://localhost:4200 avec 'serve'"
elif command -v python3 >/dev/null 2>&1; then
    cd frontend/dist/frontend
    python3 -m http.server 4200 > ../../../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ../../..
    log "Frontend servi sur http://localhost:4200 avec Python"
elif command -v python >/dev/null 2>&1; then
    cd frontend/dist/frontend
    python -m SimpleHTTPServer 4200 > ../../../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ../../..
    log "Frontend servi sur http://localhost:4200 avec Python 2"
else
    error "Aucun serveur web disponible. Installez 'serve' avec: npm install -g serve"
    exit 1
fi

# 5. Informations de démarrage
log "✅ Services démarrés avec succès!"
echo ""
echo "📱 Application disponible sur:"
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:3000"
echo ""
echo "📊 Logs disponibles dans:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🛑 Pour arrêter les services, appuyez sur Ctrl+C"
echo ""

# Suivre les logs en temps réel
log "Suivi des logs (Ctrl+C pour arrêter)..."
tail -f logs/backend.log logs/frontend.log
