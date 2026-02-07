# 🐳 Docker Setup Guide

This guide explains how to run Sortr using Docker for consistent deployment across environments.

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- `.env` file configured (copy from `.env.example`)

## 🚀 Quick Start

### Production Mode

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

### Development Mode

```bash
# Build and start in development mode (with hot reloading)
docker-compose -f docker-compose.dev.yml up

# Run in background
docker-compose -f docker-compose.dev.yml up -d

# Stop development services
docker-compose -f docker-compose.dev.yml down
```

Access the application at:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:8000

## 📦 What's Included

### Production Setup (`docker-compose.yml`)
- **Backend**: Node.js application (Alpine Linux)
- **Frontend**: Nginx serving built React app
- **Health Checks**: Automatic container health monitoring
- **Persistent Data**: Volume for SQLite database
- **Security**: Runs as non-root user
- **Optimization**: Multi-stage builds for smaller images

### Development Setup (`docker-compose.dev.yml`)
- **Hot Reloading**: Code changes trigger automatic restart
- **Source Mounting**: Local files mounted into containers
- **Dev Dependencies**: All development tools available
- **Fast Iteration**: No rebuild needed for code changes

## 🔧 Docker Commands

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache (fresh build)
docker-compose build --no-cache

# Build for development
docker-compose -f docker-compose.dev.yml build
```

### Running

```bash
# Start services in foreground
docker-compose up

# Start services in background (detached)
docker-compose up -d

# Start specific service
docker-compose up backend

# Recreate containers
docker-compose up --force-recreate
```

### Stopping

```bash
# Stop services (keeps containers)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v

# Stop and remove containers + volumes + images
docker-compose down -v --rmi all
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# View logs for specific service
docker-compose logs backend
docker-compose logs -f frontend

# View last 100 lines
docker-compose logs --tail=100
```

### Executing Commands

```bash
# Run command in backend container
docker-compose exec backend npm test
docker-compose exec backend npx sequelize-cli db:migrate

# Run command in frontend container
docker-compose exec frontend npm run build

# Open shell in container
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Container Management

```bash
# List running containers
docker-compose ps

# View container resource usage
docker-compose top

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

## 🗄️ Database Management

### Run Migrations

```bash
# Run migrations in production
docker-compose exec backend npx sequelize-cli db:migrate

# Run migrations in development
docker-compose -f docker-compose.dev.yml exec backend npx sequelize-cli db:migrate

# Check migration status
docker-compose exec backend npx sequelize-cli db:migrate:status
```

### Backup Database

```bash
# Copy database from container
docker cp sortr-backend:/app/data/inventory.db ./backup-$(date +%Y%m%d).db

# Restore database to container
docker cp ./backup.db sortr-backend:/app/data/inventory.db
docker-compose restart backend
```

### Using PostgreSQL

To use PostgreSQL instead of SQLite:

1. Update `docker-compose.yml` to add PostgreSQL service:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: sortr-postgres
    environment:
      POSTGRES_DB: sortr
      POSTGRES_USER: sortr
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - sortr-network

volumes:
  postgres-data:
```

2. Update backend environment variables:

```yaml
environment:
  - DB_DIALECT=postgres
  - DB_HOST=postgres
  - DB_NAME=sortr
  - DB_USER=sortr
  - DB_PASSWORD=${DB_PASSWORD}
```

## 🔒 Security Best Practices

### Production Deployment

1. **Set Strong SECRET_KEY**
   ```bash
   openssl rand -base64 32
   ```

2. **Use Environment Variables**
   - Never commit `.env` to version control
   - Use `.env.production` for production secrets

3. **Run as Non-Root**
   - Containers run as user `nodejs` (UID 1001)

4. **Enable HTTPS**
   - Use a reverse proxy (nginx, traefik, caddy)
   - Obtain SSL certificates (Let's Encrypt)

5. **Limit Exposed Ports**
   - Only expose necessary ports
   - Use Docker networks for internal communication

## 🐛 Troubleshooting

### "SECRET_KEY environment variable is required"

Create `.env` file with:
```bash
SECRET_KEY=$(openssl rand -base64 32)
```

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### "Port already in use"

```bash
# Find process using port
lsof -i :8000  # Backend
lsof -i :80    # Frontend

# Or change ports in docker-compose.yml
ports:
  - "8080:8000"  # Map host:8080 to container:8000
```

### Database changes not reflected

```bash
# Run migrations
docker-compose exec backend npx sequelize-cli db:migrate

# Or restart with clean database
docker-compose down -v
docker-compose up -d
```

### Hot reloading not working (development)

```bash
# Ensure volumes are mounted correctly
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### Out of disk space

```bash
# Clean up unused Docker resources
docker system prune -a

# Remove all stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune -a
```

## 📊 Monitoring

### Health Checks

Both backend and frontend have built-in health checks:

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend health
curl http://localhost/

# View health status in Docker
docker inspect sortr-backend | grep -A 10 Health
```

### Resource Usage

```bash
# View real-time stats
docker stats

# View resource usage for specific containers
docker stats sortr-backend sortr-frontend
```

## 🚀 Deployment Examples

### Deploy to Production Server

```bash
# 1. Copy files to server
scp -r ./* user@server:/app/sortr/

# 2. SSH into server
ssh user@server

# 3. Navigate to app directory
cd /app/sortr

# 4. Configure environment
cp .env.example .env
nano .env  # Set production values

# 5. Build and start
docker-compose up -d

# 6. Verify
docker-compose ps
curl http://localhost/health
```

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml sortr

# List services
docker service ls

# Scale services
docker service scale sortr_backend=3
```

### Using Kubernetes

See `k8s/` directory for Kubernetes manifests (coming soon).

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## 🎯 Next Steps

After Docker setup:
1. Configure reverse proxy (nginx/traefik) with SSL
2. Set up automated backups
3. Configure logging and monitoring
4. Set up CI/CD pipeline for automated deployments

---

**Need Help?** Check the main [README.md](README.md) or open an issue.
