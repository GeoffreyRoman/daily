#!/bin/bash

echo "🚀 Démarrage de l'application Journal Quotidien..."

# Démarrage du backend
echo "📦 Démarrage du backend..."
echo "🔧 Vérification des dépendances..."
cd backend

# Vérifier si ts-node est installé
if ! npm list ts-node > /dev/null 2>&1; then
    echo "⚙️  Installation de ts-node..."
    npm install -D ts-node
fi

npm run dev &
BACKEND_PID=$!

# Attendre un peu pour que le backend démarre
sleep 3
# Démarrage du frontend
echo "🌐 Démarrage du frontend..."
cd ./frontend && ng serve &
FRONTEND_PID=$!

echo "✅ Application démarrée !"
echo "   - Backend : http://localhost:3000"
echo "   - Frontend : http://localhost:4200"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs..."

# Fonction de nettoyage
cleanup() {
    echo "🛑 Arrêt des serveurs..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Attendre que les processus se terminent
wait
