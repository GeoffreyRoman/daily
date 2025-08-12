#!/bin/bash

# Script simple de démarrage en production
# Lance le backend compilé et sert le frontend avec serve

set -e

echo "🚀 Lancement de Daily Journal en production..."

# Vérifier que les builds existent
if [ ! -f "backend/dist/index.js" ]; then
    echo "❌ Backend non compilé. Exécutez d'abord: cd backend && npm run build"
    exit 1
fi

if [ ! -d "frontend/dist" ]; then
    echo "❌ Frontend non compilé. Exécutez d'abord: cd frontend && npm run build"
    exit 1
fi

# Vérifier que serve est installé
if ! command -v serve >/dev/null 2>&1; then
    echo "❌ 'serve' n'est pas installé. Installez-le avec: npm install -g serve"
    exit 1
fi

# Créer le répertoire de logs
mkdir -p logs

echo "📱 Démarrage du backend..."
cd backend
NODE_ENV=production npm start > ../logs/backend-prod.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "🌐 Démarrage du frontend..."
cd frontend/dist/frontend
serve -s . -l 4200 > ../../../logs/frontend-prod.log 2>&1 &
FRONTEND_PID=$!
cd ../../..

# Fonction de nettoyage
cleanup() {
    echo "🛑 Arrêt des services..."
    [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "✅ Services démarrés!"
echo "🌍 Frontend: http://localhost:4200"
echo "⚙️  Backend:  http://localhost:3000"
echo "📋 Logs: logs/backend-prod.log et logs/frontend-prod.log"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter..."

# Attendre
wait
