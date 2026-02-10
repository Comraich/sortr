# 🚀 Production Deployment Guide

This guide walks through deploying Sortr to production using Docker.

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Server with ports 80 and 8000 available (or configure different ports)
- Domain or hostname configured (e.g., sortr, sortr.example.com)

## Step 1: Configure Environment

### Create Production .env File

Copy `.env.example` to `.env` and configure for production:

```bash
cp .env.example .env
```

### Required Configuration

Edit `.env` with your production values:

```bash
# Server Configuration
PORT=8000

# IMPORTANT: Set these to your actual server hostname/domain
FRONTEND_URL=http://sortr  # Or https://sortr.example.com
VITE_API_URL=http://sortr:8000  # Or https://api.sortr.example.com

# Security - CRITICAL: Generate a strong secret key
SECRET_KEY=<generate-with-command-below>

# Database - SQLite (default) or PostgreSQL
DB_STORAGE=./inventory.db

# OAuth (Optional - configure if using social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-microsoft-tenant-id
```

### Generate Strong SECRET_KEY

```bash
openssl rand -base64 32
```

Copy the output and set it as `SECRET_KEY` in `.env`.

### For HTTPS Deployment

If using HTTPS (recommended for production):

```bash
FRONTEND_URL=https://sortr.example.com
VITE_API_URL=https://sortr.example.com/api
```

You'll need a reverse proxy (nginx, Caddy, Traefik) with SSL certificates.

## Step 2: Build and Deploy with Docker

### Production Deployment (Recommended)

```bash
# Build images
docker-compose build

# Start services in background
docker-compose up -d

# Check status
docker-compose ps
```

Access your application at:
- **Frontend**: http://sortr (or your configured domain)
- **Backend API**: http://sortr:8000
- **Health Check**: http://sortr:8000/health

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Step 3: Configure Firewall

**IMPORTANT**: Open required ports in your firewall for the application to be accessible.

### Required Ports

- **Port 80** (HTTP) or **443** (HTTPS) - Frontend access
- **Port 8000** - Backend API

### Open Ports

**Ubuntu/Debian (UFW):**
```bash
sudo ufw allow 80/tcp      # Frontend
sudo ufw allow 8000/tcp    # Backend API
sudo ufw status            # Verify
```

**CentOS/RHEL (firewalld):**
```bash
sudo firewall-cmd --add-port=80/tcp --permanent
sudo firewall-cmd --add-port=8000/tcp --permanent
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports  # Verify
```

**Test Access:**
```bash
# From your local machine:
curl http://sortr:8000/health
# Should return: {"status":"ok",...}
```

## Step 4: Run Database Migrations

**IMPORTANT**: Run migrations after first deployment and after any updates:

```bash
docker-compose exec backend npx sequelize-cli db:migrate
```

Check migration status:

```bash
docker-compose exec backend npx sequelize-cli db:migrate:status
```

## Step 5: Verify Deployment

### Health Check

```bash
curl http://sortr:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T...",
  "uptime": 123.456,
  "environment": "production"
}
```

### Test API Endpoints

```bash
# Should return 401 (authentication required)
curl http://sortr:8000/api/items

# Should return 404
curl http://sortr:8000/nonexistent
```

### Test Frontend

Open browser and navigate to: `http://sortr`

You should see the Sortr login page.

## Step 6: Set Up HTTPS (Recommended)

For production, use HTTPS with a reverse proxy.

### Option A: Using Nginx

Create `/etc/nginx/sites-available/sortr`:

```nginx
server {
    listen 80;
    server_name sortr.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sortr.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # OAuth callbacks
    location /auth/ {
        proxy_pass http://localhost:8000/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
    }
}
```

Enable and restart nginx:
```bash
sudo ln -s /etc/nginx/sites-available/sortr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option B: Using Caddy (Automatic HTTPS)

Create `Caddyfile`:

```
sortr.example.com {
    reverse_proxy /api/* localhost:8000
    reverse_proxy /auth/* localhost:8000
    reverse_proxy /health localhost:8000
    reverse_proxy localhost:80
}
```

Start Caddy:
```bash
caddy run
```

## Database Management

### Backup Database

```bash
# SQLite backup
docker cp sortr-backend:/app/inventory.db ./backup-$(date +%Y%m%d).db

# Or use volume backup
docker run --rm -v sortr_sortr-data:/data -v $(pwd):/backup alpine \
    tar czf /backup/sortr-backup-$(date +%Y%m%d).tar.gz /data
```

### Restore Database

```bash
# SQLite restore
docker cp ./backup.db sortr-backend:/app/inventory.db
docker-compose restart backend
```

### Switch to PostgreSQL

For production scale, consider PostgreSQL:

1. Add to `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
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

2. Update `.env`:

```bash
DB_DIALECT=postgres
DB_HOST=postgres
DB_NAME=sortr
DB_USER=sortr
DB_PASSWORD=<strong-password>
```

3. Rebuild and restart:

```bash
docker-compose down
docker-compose up -d
docker-compose exec backend npx sequelize-cli db:migrate
```

## Monitoring & Maintenance

### Health Monitoring

Set up automated health checks:

```bash
# Add to crontab
*/5 * * * * curl -f http://sortr:8000/health || echo "Sortr is down!" | mail -s "Alert" admin@example.com
```

### Log Rotation

Docker handles log rotation automatically, but you can configure it in `docker-compose.yml`:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Updates

To deploy updates:

```bash
# Pull latest code
git pull

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d

# Run new migrations
docker-compose exec backend npx sequelize-cli db:migrate
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check if ports are in use
sudo lsof -i :8000
sudo lsof -i :80
```

### Database Issues

```bash
# Check migrations
docker-compose exec backend npx sequelize-cli db:migrate:status

# Reset database (⚠️ DESTRUCTIVE)
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx sequelize-cli db:migrate
```

### OAuth Not Working

Ensure OAuth callback URLs are configured correctly in provider consoles:
- Google: `https://sortr.example.com/auth/google/callback`
- GitHub: `https://sortr.example.com/auth/github/callback`
- Microsoft: `https://sortr.example.com/auth/microsoft/callback`

## Security Checklist

- [ ] Strong `SECRET_KEY` generated (32+ characters)
- [ ] `.env` file is NOT committed to git
- [ ] HTTPS enabled with valid SSL certificate
- [ ] OAuth credentials are production credentials (not dev)
- [ ] Database backups configured
- [ ] Firewall configured (only ports 80, 443 exposed)
- [ ] Regular security updates scheduled
- [ ] Log monitoring enabled
- [ ] Health check monitoring enabled

## Performance Optimization

For high-traffic deployments:

1. **Use PostgreSQL** instead of SQLite
2. **Enable Redis** for session storage
3. **Use CDN** for static assets
4. **Scale horizontally** with multiple backend containers:

```bash
docker-compose up -d --scale backend=3
```

Add a load balancer (nginx, HAProxy) in front.

---

**Need Help?** Check [DOCKER.md](DOCKER.md) for detailed Docker commands or [README.md](README.md) for general documentation.
