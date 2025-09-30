#!/bin/bash

# CSV Ingest + Grid MVP - Docker Startup Script

echo "🚀 Starting CSV Ingest + Grid MVP..."

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
echo "🔨 Building and starting services..."
docker compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker compose ps | grep -q "Up (healthy)"; then
    echo "✅ Services are running and healthy!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5008"
    echo ""
    echo "📊 Useful commands:"
    echo "   View logs: npm run docker:logs"
    echo "   Stop services: npm run docker:down"
    echo "   Seed sample data: npm run seed"
    echo ""
    echo "🎉 Ready to use!"
else
    echo "❌ Some services failed to start. Check logs with: npm run docker:logs"
    exit 1
fi
