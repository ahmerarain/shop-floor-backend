# Docker Setup for CSV Ingest + Grid MVP

This guide explains how to run the CSV Ingest application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd csv-ingest-grid-mvp
```

### 2. Environment Configuration

Copy the environment example file:

```bash
cp .env.example .env
```

Edit `.env` file with your preferred settings:

```bash
# Backend Configuration
NODE_ENV=production
PORT=5008
BACKEND_URL=http://localhost:5008

# Frontend Configuration
VITE_API_URL=http://localhost:5008
VITE_APP_NAME=CSV Ingest + Grid MVP

# Database Configuration
DATABASE_PATH=./data/csv_data.db

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Security Configuration
CORS_ORIGIN=http://localhost:3000

# Docker Configuration
COMPOSE_PROJECT_NAME=csv-ingest
```

### 3. One-Command Deployment

```bash
# Start all services
npm run docker:up

# Or using docker-compose directly
docker-compose up -d
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5008
- **API Documentation**: http://localhost:5008/api/csv/data

## Available Commands

### Docker Commands

```bash
# Start all services in background
npm run docker:up

# Stop all services
npm run docker:down

# Build all images
npm run docker:build

# View logs
npm run docker:logs

# Clean up (removes volumes and containers)
npm run docker:clean

# Seed database with sample data
npm run seed
```

### Individual Service Commands

```bash
# Start only backend
docker-compose up backend

# Start only frontend
docker-compose up frontend

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

## Services

### Backend Service

- **Image**: `csv-backend`
- **Port**: 5008
- **Health Check**: `/api/csv/data`
- **Volumes**:
  - `backend_data` (database files)
  - `backend_uploads` (uploaded files)

### Frontend Service

- **Image**: `csv-frontend`
- **Port**: 3000 (mapped to 80 in container)
- **Health Check**: `/`
- **Dependencies**: Backend service must be healthy

## Sample Data

The application includes sample CSV data for testing:

- **Valid Data**: `sample-data/sample.csv` (20 rows)
- **Data with Errors**: `sample-data/sample-with-errors.csv` (7 rows with validation errors)

To seed the database with sample data:

```bash
npm run seed
```

## Environment Variables

### Backend Variables

| Variable        | Default                 | Description            |
| --------------- | ----------------------- | ---------------------- |
| `NODE_ENV`      | `development`           | Environment mode       |
| `PORT`          | `5008`                  | Backend port           |
| `DATABASE_PATH` | `./data/csv_data.db`    | SQLite database path   |
| `MAX_FILE_SIZE` | `10485760`              | Max upload size (10MB) |
| `UPLOAD_DIR`    | `./uploads`             | Upload directory       |
| `CORS_ORIGIN`   | `http://localhost:3000` | CORS origin            |

### Frontend Variables

| Variable        | Default                 | Description      |
| --------------- | ----------------------- | ---------------- |
| `VITE_API_URL`  | `http://localhost:5008` | Backend API URL  |
| `VITE_APP_NAME` | `CSV Ingest + Grid MVP` | Application name |

## Development

### Local Development with Docker

```bash
# Start only backend in Docker
npm run docker:dev

# Run frontend locally
cd frontend && npm run dev
```

### Debugging

```bash
# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# Access backend container
docker-compose exec backend sh

# Access frontend container
docker-compose exec frontend sh
```

## Production Deployment

### 1. Environment Setup

```bash
# Set production environment
export NODE_ENV=production
export VITE_API_URL=https://your-api-domain.com
```

### 2. Build and Deploy

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. SSL/HTTPS (Optional)

For production, consider using a reverse proxy like nginx or traefik for SSL termination.

## Troubleshooting

### Common Issues

1. **Port Already in Use**

   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :5008

   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database Permission Issues**

   ```bash
   # Reset database volume
   docker-compose down -v
   docker-compose up -d
   ```

3. **Build Failures**

   ```bash
   # Clean Docker cache
   docker system prune -a

   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Health Check Failures**

   ```bash
   # Check service status
   docker-compose ps

   # Check logs
   docker-compose logs backend
   ```

### Logs and Monitoring

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Security Considerations

- Change default ports in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Regularly update base images
- Use non-root users in containers (already configured)

## Performance Optimization

- Use multi-stage builds (already implemented)
- Enable gzip compression (already configured)
- Use production-ready nginx configuration
- Monitor resource usage with `docker stats`

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec backend cp /app/data/csv_data.db /app/backup_$(date +%Y%m%d_%H%M%S).db

# Restore from backup
docker-compose exec backend cp /app/backup_file.db /app/data/csv_data.db
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v csv-ingest_backend_data:/data -v $(pwd):/backup alpine tar czf /backup/backend_data_backup.tar.gz -C /data .
```

## Support

For issues or questions:

1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Check Docker and Docker Compose versions
4. Review this documentation
