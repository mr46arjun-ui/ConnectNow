# Environment Configuration Guide

## Required Production Environment Variables

### Database

- `DATABASE_URL` - MySQL connection string (e.g., `mysql://user:pass@host:3306/db`).
  On Render, the host must be reachable and must not be `localhost` or
  `127.0.0.1`.
- `DB_SSL` - Set to `true` when the MySQL provider requires TLS.
- `DB_SSL_CA` - Optional trusted CA certificate PEM for MySQL TLS. Escaped
  `\n` line breaks are supported.
- `DB_CONNECTION_LIMIT` - MySQL pool limit, from 1 to 50 (default: 10).

### JWT & Sessions

- `JWT_SECRET` - Secret key for JWT signing (minimum 32 characters)
- `SESSION_ISSUER` - Session issuer name (default: `connectnow`)

## Optional Environment Variables

### Redis (Optional)

- `REDIS_URL` - Complete Redis connection string; takes precedence over host/port settings
- `REDIS_HOST` - Redis server hostname (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_DB` - Redis database number (default: 0)

If Redis is not configured or becomes unavailable, request rate limiting falls
back to an in-process store.

### OAuth (Optional)

- `VITE_ENABLE_OAUTH` - Set to `true` to enable OAuth (default: `false`)
- `OAUTH_SERVER_URL` - OAuth server URL
- `VITE_OAUTH_PORTAL_URL` - OAuth portal URL
- `VITE_APP_ID` - Application ID
- `APP_PUBLIC_ORIGIN` - Public site origin used to validate OAuth callback state
- `OWNER_OPEN_ID` - Owner's OpenID
- `OWNER_NAME` - Owner's name

When OAuth is enabled, the server URL, portal URL, app ID, and public origin
must all be configured. When it is disabled, ConnectNow uses its built-in
email/password login and does not contact an OAuth service.

### S3 Storage

- `S3_BUCKET` - S3 bucket name
- `S3_REGION` - AWS region
- `S3_ACCESS_KEY_ID` - AWS access key
- `S3_SECRET_ACCESS_KEY` - AWS secret key
- `S3_ENDPOINT` - S3 endpoint URL (optional, defaults to AWS)

### Email (SMTP)

- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM` - From email address

### LLM Integration (OpenAI)

- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - Model to use (default: gpt-4)

### Frontend

- `VITE_APP_TITLE` - Application title
- `VITE_APP_LOGO` - Logo URL
- `VITE_FRONTEND_FORGE_API_KEY` - Frontend API key
- `VITE_FRONTEND_FORGE_API_URL` - Frontend API URL
- `VITE_ANALYTICS_ENDPOINT` - Analytics endpoint
- `VITE_ANALYTICS_WEBSITE_ID` - Analytics website ID

### Server

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)

### Security

- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `CORS_CREDENTIALS` - Enable CORS credentials (true/false)
- `RATE_LIMIT_WINDOW` - Rate limit window in ms (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

### Features

- `ENABLE_GUEST_LOGIN` - Allow guest login (true/false)
- `ENABLE_EMAIL_VERIFICATION` - Require email verification (true/false)
- `ENABLE_TWO_FACTOR_AUTH` - Enable 2FA (true/false)
- `ENABLE_SOCIAL_LOGIN` - Enable social login (true/false)
- `ENABLE_PROFANITY_FILTER` - Enable profanity filtering (true/false)
- `ENABLE_LLM_MODERATION` - Enable LLM content moderation (true/false)
- `ENABLE_ANALYTICS` - Enable analytics (true/false)

### WebRTC

- `STUN_SERVERS` - Comma-separated STUN servers
- `TURN_SERVERS` - Comma-separated TURN servers
- `TURN_USERNAME` - TURN server username
- `TURN_PASSWORD` - TURN server password

### Deployment

- `DEPLOYMENT_ENV` - Deployment environment
- `DEPLOYMENT_REGION` - Deployment region
- `DEPLOYMENT_VERSION` - Application version

## Development Setup

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your values
nano .env

# Start development server
pnpm dev
```

## Production Setup

```bash
# Set production environment
export NODE_ENV=production

# Ensure all required variables are set
# Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

# Build and start
pnpm build
pnpm start
```

## Docker Setup

```bash
# Build image
docker build -f Dockerfile.prod -t connectnow:latest .

# Run with environment file
docker run --env-file .env.prod -p 3000:3000 connectnow:latest

# Or with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## Security Best Practices

1. **Never commit secrets** - Use `.env.local` for local development
2. **Use strong secrets** - Generate 32+ character random strings
3. **Rotate secrets** - Regularly rotate API keys and passwords
4. **Use HTTPS** - Always use HTTPS in production
5. **Enable CORS carefully** - Only allow trusted origins
6. **Rate limiting** - Configure appropriate rate limits
7. **Monitoring** - Set up error tracking and monitoring
8. **Backups** - Regular database backups
9. **Logging** - Enable comprehensive logging
10. **Updates** - Keep dependencies updated

## Troubleshooting

### Database Connection Issues

- Check DATABASE_URL format
- Verify database is running
- Check firewall rules
- Verify credentials

### Redis Connection Issues

- Verify Redis is running
- Check REDIS_HOST and REDIS_PORT
- Check REDIS_PASSWORD if set
- Check firewall rules

### OAuth Issues

- Confirm `VITE_ENABLE_OAUTH=true`
- Verify OAUTH_SERVER_URL is correct
- Check VITE_APP_ID is registered
- Ensure APP_PUBLIC_ORIGIN exactly matches the deployed site's origin
- Verify callback URL is configured
- Check OWNER_OPEN_ID is correct

### Email Issues

- Verify SMTP credentials
- Check firewall allows SMTP port
- Verify SMTP_FROM is valid
- Check email provider settings

### S3 Issues

- Verify AWS credentials
- Check S3_BUCKET exists
- Verify S3_REGION is correct
- Check IAM permissions
