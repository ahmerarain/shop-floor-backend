# 🐳 Docker Setup for CSV Backend

This document provides comprehensive instructions for running the CSV Backend using Docker.

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## 🚀 Quick Start

### Option 1: Using the startup script (Recommended)

```bash
./start-docker.sh
```

### Option 2: Using npm scripts

```bash
# Start the backend
npm run docker:up

# View logs
npm run docker:logs

# Stop the backend
npm run docker:down
```

### Option 3: Using Docker Compose directly

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🔧 Configuration

### Environment Variables

The backend uses the following environment variables (configured in `.env.example`):

| Variable        | Default                 | Description            |
| --------------- | ----------------------- | ---------------------- |
| `NODE_ENV`      | `development`           | Environment mode       |
| `PORT`          | `5008`                  | Backend port           |
| `DATABASE_PATH` | `./data/csv_data.db`    | SQLite database path   |
| `MAX_FILE_SIZE` | `10485760`              | Max upload size (10MB) |
| `UPLOAD_DIR`    | `./uploads`             | Upload directory       |
| `CORS_ORIGIN`   | `http://localhost:3000` | CORS origin            |

### Creating .env file

```bash
# Copy the example file
cp .env.example .env

# Edit with your preferred settings
nano .env
```

## 📁 Project Structure

```
backend/
├── Dockerfile              # Backend container definition
├── docker-compose.yml      # Service orchestration
├── .env.example           # Environment variables template
├── .dockerignore          # Files to ignore in Docker build
├── start-docker.sh        # Quick start script
├── sample-data/           # Sample CSV files for seeding
│   ├── sample.csv
│   └── sample-with-errors.csv
└── src/                   # Source code
    ├── controllers/
    ├── database/
    ├── routes/
    ├── services/
    └── utils/
```

## 🗄️ Data Persistence

The Docker setup includes persistent volumes for:

- **Database**: `backend_data` volume stores SQLite database files
- **Uploads**: `backend_uploads` volume stores uploaded CSV files

Data persists between container restarts and updates.

## 🔍 Health Checks

The backend includes health checks that verify:

- Service is running on port 5008
- API endpoint `/api/csv/data` responds with 200 status
- Checks run every 30 seconds with 3 retries

## 📊 Available Scripts

| Script                 | Description                    |
| ---------------------- | ------------------------------ |
| `npm run docker:build` | Build Docker image             |
| `npm run docker:run`   | Run container directly         |
| `npm run docker:up`    | Start with docker-compose      |
| `npm run docker:down`  | Stop services                  |
| `npm run docker:logs`  | View logs                      |
| `npm run docker:clean` | Clean up volumes and images    |
| `npm run seed`         | Seed database with sample data |

## 🌐 Access Points

- **API Base URL**: http://localhost:5008
- **Health Check**: http://localhost:5008/api/csv/data
- **Upload Endpoint**: http://localhost:5008/api/csv/upload
- **Data Endpoint**: http://localhost:5008/api/csv/data

## 🧪 Testing with Sample Data

### Seed the database

```bash
# Build first
npm run build

# Seed with sample data
npm run seed
```

### Sample CSV files

- `sample-data/sample.csv` - Valid data for testing
- `sample-data/sample-with-errors.csv` - Data with validation errors

## 🔧 Development

### Running in development mode

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for production

```bash
# Build TypeScript
npm run build

# Build Docker image
npm run docker:build
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Check what's using the port
   lsof -i :5008

   # Kill the process or change port in docker-compose.yml
   ```

2. **Database permission issues**

   ```bash
   # Reset database volume
   docker-compose down -v
   docker-compose up -d
   ```

3. **Build failures**

   ```bash
   # Clean Docker cache
   docker system prune -a

   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Health check failures**

   ```bash
   # Check service status
   docker-compose ps

   # Check logs
   docker-compose logs csv-backend
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# View backend logs only
docker-compose logs csv-backend

# Follow logs in real-time
docker-compose logs -f csv-backend

# Check container status
docker-compose ps
```

## 🔒 Security Features

- **File Upload Security**: 10MB limit, MIME type validation
- **CSV Formula Injection Protection**: Sanitizes exported data
- **CORS Configuration**: Configurable origin restrictions
- **Health Checks**: Monitors service availability

## 📈 Performance

- **Multi-stage build**: Optimized image size
- **Alpine Linux**: Minimal base image
- **Volume mounting**: Persistent data storage
- **Health checks**: Automatic service monitoring

## 🚀 Production Deployment

For production deployment:

1. Update environment variables in `.env`
2. Set `NODE_ENV=production`
3. Configure proper CORS origins
4. Set up reverse proxy (nginx/traefik)
5. Configure SSL/TLS certificates
6. Set up monitoring and logging

## 📞 Support

For issues or questions:

1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Check Docker and Docker Compose versions
4. Review this documentation
