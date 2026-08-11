# ConnectNow Deployment Guide

## Prerequisites

- Node.js 22+
- MySQL 8.0+
- Redis 7+
- Docker & Docker Compose (optional)
- SSL certificates for HTTPS

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@mysql.example.com:3306/connectnow

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars

# Optional OAuth (local email/password login is enabled by default)
VITE_ENABLE_OAUTH=false
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
APP_PUBLIC_ORIGIN=https://connectnow.app

# LLM & APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im/v1
BUILT_IN_FORGE_API_KEY=your-api-key

# Frontend
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/v1
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://connectnow.app
```

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

```bash
# Generate migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate
```

### 3. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t connectnow:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=... \
  connectnow:latest
```

## Production Deployment

### Render database requirement

The application uses MySQL. On Render, `localhost` and `127.0.0.1` refer to the
ConnectNow app container and will produce `ECONNREFUSED` because MySQL is not
running inside that container. Set `DATABASE_URL` to either:

- a reachable managed MySQL provider URL; or
- the private hostname of a separately deployed persistent MySQL service.

Render's managed relational database is PostgreSQL, which is not compatible
with this MySQL schema. The included `render.yaml` requires `DATABASE_URL` as a
secret and generates `JWT_SECRET`. After entering the real URL, choose
**Save, rebuild, and deploy** in Render.

### Automatic schema readiness

Production startup applies every committed migration in `drizzle/` and verifies
the auth and messaging columns before opening the HTTP port. Keep
`RUN_DB_MIGRATIONS=true` (the default). If the database is temporarily
unavailable, startup retries five times and then fails the new release instead
of serving traffic against an outdated schema.

- `/health` is the lightweight process liveness endpoint.
- `/ready` verifies the live database and required schema.
- The Docker health check uses `/ready`.

For reliable voice and video between restrictive networks, configure
`VITE_TURN_URL`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL` before the
build. Public STUN remains the fallback, but a TURN relay is strongly
recommended for group calls.

### 1. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE connectnow;"

# Create user
mysql -u root -p -e "CREATE USER 'connectnow'@'localhost' IDENTIFIED BY 'password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON connectnow.* TO 'connectnow'@'localhost';"

# Apply migrations
DATABASE_URL=mysql://connectnow:password@localhost:3306/connectnow pnpm drizzle-kit migrate
```

### 2. Build Application

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build frontend and backend
pnpm build

# Verify build
ls -la dist/
ls -la client/dist/
```

### 3. Start Application

```bash
# Start with Node
NODE_ENV=production node dist/index.js

# Or with PM2
pm2 start dist/index.js --name connectnow --instances max
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/connectnow`:

```nginx
upstream connectnow {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name connectnow.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name connectnow.app;

    ssl_certificate /etc/ssl/certs/connectnow.crt;
    ssl_certificate_key /etc/ssl/private/connectnow.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;
    limit_req zone=general burst=200 nodelay;

    location / {
        proxy_pass http://connectnow;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Support
    location /socket.io {
        proxy_pass http://connectnow/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/connectnow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate

Using Let's Encrypt with Certbot:

```bash
sudo certbot certonly --standalone -d connectnow.app
sudo certbot renew --dry-run  # Test renewal
```

### 6. Monitoring & Logging

#### PM2 Monitoring

```bash
pm2 monit
pm2 logs connectnow
```

#### Log Rotation

Create `/etc/logrotate.d/connectnow`:

```
/var/log/connectnow/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 connectnow connectnow
    sharedscripts
    postrotate
        systemctl reload connectnow > /dev/null 2>&1 || true
    endscript
}
```

## Performance Optimization

### 1. Database Indexing

Indexes are automatically created during migration. Verify:

```sql
SHOW INDEXES FROM users;
SHOW INDEXES FROM messages;
SHOW INDEXES FROM chat_sessions;
```

### 2. Redis Caching

- User sessions cached in Redis
- Message history cached
- Online status tracked in Redis

### 3. CDN Configuration

Static assets should be served from a CDN:

- Frontend build files
- User avatars
- Media uploads

### 4. Load Balancing

For horizontal scaling:

```nginx
upstream connectnow_backend {
    least_conn;
    server app1.internal:3000;
    server app2.internal:3000;
    server app3.internal:3000;
}
```

## Security Checklist

- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS properly
- [ ] Sanitize user inputs
- [ ] Enable content moderation
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup database regularly
- [ ] Use environment variables for secrets
- [ ] Enable CSRF protection
- [ ] Implement DDoS protection

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

### Metrics

- Active connections
- Message throughput
- Database query time
- WebRTC connection quality
- Error rates

### Alerts

Set up alerts for:

- High error rate (>1%)
- Database connection failures
- Redis connection failures
- Memory usage >80%
- CPU usage >90%
- Disk space <10%

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
mysql -h localhost -u connectnow -p connectnow -e "SELECT 1;"

# Check connection pool
SHOW PROCESSLIST;
```

### Redis Connection Issues

```bash
# Test connection
redis-cli ping

# Check memory usage
redis-cli INFO memory
```

### Socket.IO Issues

- Check WebSocket support in proxy
- Verify CORS settings
- Check firewall rules for port 3000

### High Memory Usage

- Check for memory leaks in Socket.IO
- Verify Redis memory usage
- Monitor database connections

## Backup & Recovery

### Database Backup

```bash
# Daily backup
mysqldump -u connectnow -p connectnow > /backups/connectnow-$(date +%Y%m%d).sql

# Automated backup with cron
0 2 * * * mysqldump -u connectnow -p connectnow > /backups/connectnow-$(date +\%Y\%m\%d).sql
```

### Database Restore

```bash
mysql -u connectnow -p connectnow < /backups/connectnow-20240101.sql
```

## Scaling Considerations

### Horizontal Scaling

1. Load balance multiple app instances
2. Use shared Redis instance
3. Use shared MySQL database
4. Implement Socket.IO clustering with Redis adapter

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Implement caching strategies
4. Use connection pooling

## Additional Cloud Platforms

### Railway

1. Connect GitHub repository
2. Add MySQL and Redis services
3. Set environment variables
4. Deploy automatically on push

### Render

1. Create Web Service from GitHub
2. Add PostgreSQL database
3. Add Redis cache
4. Configure environment variables
5. Deploy

### Fly.io

```bash
fly launch
fly secrets set JWT_SECRET=...
fly deploy
```

### Vercel (Frontend Only)

For frontend deployment:

```bash
vercel deploy
```

Backend must run separately on a server/container platform.

## Support

For deployment issues, check:

1. Environment variables are set correctly
2. Database and Redis are accessible
3. Firewall rules allow traffic
4. SSL certificates are valid
5. Application logs for errors
