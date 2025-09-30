#!/bin/bash

# CSV Backend - Docker Startup Script

echo "🚀 Starting CSV Backend with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. You may want to edit it with your preferred settings."
fi

# Build and start services
echo "🔨 Building and starting backend service..."
docker compose up -d --build

# Wait for service to be healthy
echo "⏳ Waiting for service to be ready..."
sleep 10

# Check if service is running
if docker compose ps | grep -q "Up (healthy)"; then
    echo "✅ Backend service is running and healthy!"
    echo ""
    echo "🌐 Access the backend:"
    echo "   API: http://localhost:5008"
    echo "   Health Check: http://localhost:5008/api/csv/data"
    echo ""
    echo "📊 Useful commands:"
    echo "   View logs: npm run docker:logs"
    echo "   Stop service: npm run docker:down"
    echo "   Seed sample data: npm run seed"
    echo ""
    echo "🎉 Ready to use!"
else
    echo "❌ Service failed to start. Check logs with: npm run docker:logs"
    exit 1
fi
