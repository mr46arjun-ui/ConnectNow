# ConnectNow MVP - Final Deployment Guide

## Pre-Deployment Checklist

### Code Quality
- [ ] No TypeScript errors: `pnpm tsc --noEmit`
- [ ] No ESLint errors: `pnpm lint`
- [ ] Tests passing: `pnpm test`
- [ ] No console errors in browser
- [ ] No console warnings (except expected)

### Environment Configuration
- [ ] All required env vars set in `.env`
- [ ] No secrets committed to git
- [ ] Database URL correct
- [ ] Redis URL correct
- [ ] OAuth credentials valid
- [ ] JWT_SECRET strong (32+ chars)

### Database
- [ ] Fresh database created
- [ ] All migrations applied: `pnpm drizzle-kit migrate`
- [ ] Tables created successfully
- [ ] Indexes present
- [ ] No errors in migration logs

### Build & Assets
- [ ] Frontend builds without errors: `pnpm build`
- [ ] No build warnings
- [ ] Static assets uploaded to S3 (if applicable)
- [ ] Asset URLs correct in code
- [ ] No local file references in production code

### Docker
- [ ] Dockerfile builds successfully: `docker build -t connectnow:latest .`
- [ ] Image size reasonable (< 500MB)
- [ ] No build errors
- [ ] No security warnings

### Testing
- [ ] Critical flows manually tested
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Mobile responsive verified
- [ ] Cross-browser tested

## Deployment Steps

### Option 1: Docker Compose (Local/Self-Hosted)

```bash
# 1. Create .env file
cp .env.example .env
# Edit .env with your values

# 2. Build and start services
docker-compose up -d

# 3. Verify services running
docker-compose ps

# 4. Check logs
docker-compose logs -f app

# 5. Test health endpoint
curl http://localhost:3000/health

# 6. Access application
# Open http://localhost:3000 in browser
```

### Option 2: AWS ECS/Fargate

```bash
# 1. Push image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
docker tag connectnow:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/connectnow:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/connectnow:latest

# 2. Create RDS MySQL database
# - Engine: MySQL 8.0
# - Instance: db.t3.micro (dev) or db.t3.small (prod)
# - Storage: 20GB
# - Backup: 7 days

# 3. Create ElastiCache Redis cluster
# - Engine: Redis 7.0
# - Node type: cache.t3.micro (dev) or cache.t3.small (prod)
# - Num cache nodes: 1

# 4. Create ECS Task Definition
# - Image: ECR image URL
# - Memory: 512 MB
# - CPU: 256
# - Port: 3000
# - Environment variables: DATABASE_URL, REDIS_URL, etc.

# 5. Create ECS Service
# - Launch type: Fargate
# - Desired count: 2
# - Load balancer: ALB
# - Health check: /health

# 6. Create ALB
# - Target group: port 3000
# - Health check: /health
# - SSL certificate: ACM

# 7. Update Route53 DNS
# - Create A record pointing to ALB
```

### Option 3: Google Cloud Run

```bash
# 1. Build and push to Artifact Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/connectnow

# 2. Create Cloud SQL MySQL instance
gcloud sql instances create connectnow \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1

# 3. Create Cloud Memorystore Redis instance
gcloud redis instances create connectnow \
  --size=1 \
  --region=us-central1 \
  --redis-version=7.0

# 4. Deploy to Cloud Run
gcloud run deploy connectnow \
  --image gcr.io/PROJECT_ID/connectnow \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=cloudsql://...,REDIS_URL=redis://... \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10
```

### Option 4: Railway

```bash
# 1. Connect GitHub repository
# - Go to railway.app
# - Click "New Project"
# - Select "Deploy from GitHub"
# - Select your repository

# 2. Add services
# - MySQL: Click "Add Service" → "MySQL"
# - Redis: Click "Add Service" → "Redis"

# 3. Configure environment
# - Set DATABASE_URL from MySQL service
# - Set REDIS_URL from Redis service
# - Set other env vars (JWT_SECRET, OAuth creds, etc.)

# 4. Deploy
# - Push to main branch
# - Railway auto-deploys
# - Check deployment logs
```

### Option 5: Heroku

```bash
# 1. Create app
heroku create connectnow

# 2. Add MySQL add-on
heroku addons:create cleardb:ignite

# 3. Add Redis add-on
heroku addons:create heroku-redis:premium-0

# 4. Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set VITE_APP_ID=your-app-id
# ... set all other vars

# 5. Deploy
git push heroku main

# 6. Run migrations
heroku run "pnpm drizzle-kit migrate"

# 7. View logs
heroku logs --tail
```

## Post-Deployment Verification

### Health Checks
```bash
# Test health endpoint
curl https://your-domain.com/health

# Test API endpoint
curl https://your-domain.com/api/trpc/auth.me

# Check logs
# AWS: CloudWatch Logs
# GCP: Cloud Logging
# Heroku: heroku logs --tail
# Railway: Dashboard → Logs
```

### Functional Tests
- [ ] Login works
- [ ] Send message works
- [ ] Video call works
- [ ] Admin dashboard accessible
- [ ] Database queries fast
- [ ] WebSocket connections stable
- [ ] No errors in logs

### Performance Tests
```bash
# Page load time
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# API response time
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://your-domain.com/api/trpc/auth.me

# Load test (optional)
ab -n 1000 -c 10 https://your-domain.com/
```

### Monitoring Setup

#### AWS CloudWatch
```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/connectnow

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name connectnow-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

#### GCP Cloud Monitoring
```bash
# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 1%" \
  --condition-threshold-value=1
```

#### Heroku
```bash
# Enable log drains
heroku drains:add syslog+tls://logs.example.com:12345
```

## Scaling Considerations

### Horizontal Scaling
- Load balance across multiple instances
- Use shared database (RDS, Cloud SQL)
- Use shared Redis (ElastiCache, Memorystore)
- Socket.IO adapter for multi-instance support

### Vertical Scaling
- Increase CPU/memory
- Optimize database queries
- Implement caching
- Use CDN for static assets

### Database Optimization
```sql
-- Check slow queries
SELECT * FROM mysql.slow_log LIMIT 10;

-- Analyze query performance
EXPLAIN SELECT * FROM messages WHERE userId = 1;

-- Create indexes if needed
CREATE INDEX idx_messages_userId ON messages(userId);
```

## Backup & Recovery

### Database Backup
```bash
# Manual backup
mysqldump -u user -p database > backup.sql

# Automated backup (AWS RDS)
# - Enable automated backups
# - Set retention to 30 days
# - Enable backup encryption

# Restore from backup
mysql -u user -p database < backup.sql
```

### Redis Backup
```bash
# RDB snapshot
BGSAVE

# AOF persistence
CONFIG SET appendonly yes
```

## Rollback Plan

### If deployment fails:
1. Check logs for errors
2. Verify environment variables
3. Check database connectivity
4. Check Redis connectivity
5. Rollback to previous version:
   ```bash
   # Docker: Use previous image tag
   docker run -d connectnow:previous-tag
   
   # AWS: Update task definition to previous version
   # GCP: Deploy previous version
   # Heroku: heroku releases:rollback v123
   ```

## Maintenance

### Regular Tasks
- [ ] Monitor logs daily
- [ ] Check database size
- [ ] Review error rates
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Test backup/restore quarterly
- [ ] Security audit quarterly

### Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update major versions (test first)
npm install package@latest

# Rebuild and redeploy
pnpm build
docker build -t connectnow:new-version .
```

## Support & Troubleshooting

### Common Issues

**Database connection refused**
- Check DATABASE_URL format
- Verify database is running
- Check firewall rules
- Verify credentials

**Redis connection refused**
- Check REDIS_URL format
- Verify Redis is running
- Check firewall rules
- Check network connectivity

**WebSocket connection failed**
- Check CORS settings
- Verify WebSocket port open
- Check proxy configuration
- Check SSL certificate

**High memory usage**
- Check for memory leaks
- Monitor WebSocket connections
- Restart service if needed
- Increase memory allocation

### Getting Help
- Check application logs
- Review error messages
- Test with curl/Postman
- Check database directly
- Monitor resource usage
- Review recent changes

## Success Criteria

MVP deployment is successful when:
- ✅ Application accessible at your domain
- ✅ All critical flows working
- ✅ No critical errors in logs
- ✅ Response times < 1 second
- ✅ Database and Redis connected
- ✅ WebSocket connections stable
- ✅ Admin can manage users
- ✅ Users can message and video chat
- ✅ Monitoring/alerts configured
- ✅ Backup strategy in place

## Next Steps (Post-MVP)

1. **Monitor & Optimize**
   - Track performance metrics
   - Optimize slow queries
   - Implement caching

2. **Add Features**
   - Password reset
   - File uploads
   - Matching algorithm
   - Advanced moderation

3. **Scale**
   - Add more instances
   - Implement CDN
   - Database replication
   - Redis clustering

4. **Security**
   - Penetration testing
   - Security audit
   - DDoS protection
   - WAF configuration

5. **Analytics**
   - User analytics
   - Performance analytics
   - Business metrics
   - Custom dashboards
