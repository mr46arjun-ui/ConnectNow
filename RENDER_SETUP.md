# Render setup

## Fix `ECONNREFUSED` during migrations

ConnectNow uses MySQL. A URL such as:

```env
DATABASE_URL=mysql://connectnow:password@localhost:3306/connectnow
```

works only when MySQL runs in the same local machine or Docker Compose
network. Inside a Render web-service container, `localhost` points back to the
ConnectNow container. It does not point to your computer or to another Render
service.

Use a reachable MySQL database and copy its complete connection URL into the
Render service:

```env
DATABASE_URL=mysql://USER:PASSWORD@REACHABLE_HOST:3306/DATABASE
JWT_SECRET=at-least-32-random-characters
RUN_DB_MIGRATIONS=true
DB_MIGRATION_ATTEMPTS=10
```

If the provider requires TLS, also set:

```env
DB_SSL=true
DB_SSL_CA="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

`DB_SSL_CA` is optional when the provider's certificate is already trusted by
the Node.js image.

## Render dashboard checklist

1. Open the ConnectNow web service.
2. Select **Environment**.
3. Replace `DATABASE_URL`; do not use `localhost`, `127.0.0.1`, or `0.0.0.0`.
4. Confirm the MySQL user can create and alter tables in the selected database.
5. Save with **Save, rebuild, and deploy**.
6. Set the health-check path to `/ready`.
7. Wait for the log line:

   ```text
   [Database] Migrations applied and schema is ready
   ```

8. Confirm `/ready` returns HTTP 200.

The included `render.yaml` configures the Docker service, generates a session
secret, enables migrations, and deliberately requires the real database URL to
be entered as a secret.

## Media calls

HTTPS is required for browser camera and microphone APIs. Public STUN is
included, but production voice/video—especially group calls—should also
configure:

```env
VITE_TURN_URL=turn:turn.example.com:3478
VITE_TURN_USERNAME=...
VITE_TURN_CREDENTIAL=...
```

These `VITE_` values are public browser configuration and are embedded during
the Docker build. Redeploy after changing them.
