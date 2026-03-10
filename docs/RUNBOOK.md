# Operations Runbook

This document covers deployment, maintenance, monitoring, and troubleshooting for the IJECCET platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment](#deployment)
3. [Database Operations](#database-operations)
4. [Monitoring](#monitoring)
5. [Troubleshooting](#troubleshooting)
6. [Backup & Recovery](#backup--recovery)
7. [Security](#security)

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│ PostgreSQL  │
│   Client    │     │  Server     │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │Cloudinary│  │ SendGrid │
              │ (Files)  │  │ (Email)  │
              └──────────┘  └──────────┘
```

**Components:**
- Next.js 16 (App Router) - Server-side rendering + API routes
- PostgreSQL - Primary database
- Prisma ORM - Database access layer
- Cloudinary - File storage (manuscripts)
- SendGrid/SMTP - Email delivery
- NextAuth.js v5 - Authentication (JWT)

---

## Deployment

### Production Environment Setup

#### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- SSL certificate
- Domain with DNS configured

#### Method 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel Dashboard
3. Add environment variables:
   ```
   DATABASE_URL
   AUTH_SECRET
   NEXTAUTH_URL
   CLOUDINARY_*
   SENDGRID_API_KEY
   EMAIL_FROM
   ```
4. Deploy

Vercel handles:
- SSL certificates
- Auto-scaling
- Build optimization
- Edge caching

#### Method 2: Self-Hosted (VPS/Docker)

**Server Setup:**
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone and setup
git clone <repo-url> /var/www/tmj
cd /var/www/tmj
npm ci --production

# Environment
cp .env.production.example .env
nano .env  # Fill in values

# Database
npx prisma migrate deploy

# Build
npm run build

# Start with PM2
pm2 start npm --name "tmj" -- start
pm2 save
pm2 startup
```

**Nginx Reverse Proxy:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Method 3: Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/journaldb
    depends_on:
      - db
  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=journaldb
volumes:
  postgres_data:
```

---

## Database Operations

### Migrations

**Apply pending migrations:**
```bash
npx prisma migrate deploy
```

**Create new migration (development):**
```bash
npx prisma migrate dev --name description_of_change
```

**Reset database (DESTRUCTIVE):**
```bash
npx prisma migrate reset --force
```

### Seeding

**Seed with test data:**
```bash
npm run db:seed
```

**Custom seeding:**
```bash
node prisma/seed.js
```

### Backup

**Full database backup:**
```bash
pg_dump -h localhost -U postgres -d journaldb -F c -f backup_$(date +%Y%m%d).dump
```

**Restore from backup:**
```bash
pg_restore -h localhost -U postgres -d journaldb -c backup.dump
```

### Common Queries

**Check article counts by status:**
```sql
SELECT status, COUNT(*) FROM "Article" GROUP BY status;
```

**Find users by role:**
```sql
SELECT name, email, role FROM "User" ORDER BY role, name;
```

**List pending reviews:**
```sql
SELECT a.title, u.name as reviewer, r.status 
FROM "Review" r 
JOIN "Article" a ON r."articleId" = a.id 
JOIN "User" u ON r."reviewerId" = u.id 
WHERE r.status IN ('PENDING', 'ACCEPTED');
```

---

## Monitoring

### Health Checks

**Application health:**
```bash
curl -I https://your-domain.com
# Expect: HTTP/2 200
```

**Database connection:**
```bash
npx prisma db execute --stdin <<< "SELECT 1"
```

### Logging

**View PM2 logs:**
```bash
pm2 logs tmj --lines 100
```

**Application logs location:**
- Vercel: Dashboard → Deployments → Logs
- PM2: `~/.pm2/logs/`
- Docker: `docker logs tmj-app`

### Metrics to Monitor

- Response times (target: <500ms)
- Error rates (target: <1%)
- Database connections
- Disk usage (for file uploads)
- Memory usage

---

## Troubleshooting

### Common Issues

#### 500 Internal Server Error

1. Check application logs
2. Verify DATABASE_URL is correct
3. Ensure migrations are applied
4. Check Prisma client generation

```bash
npx prisma generate
npm run build
pm2 restart tmj
```

#### Authentication Issues

1. Verify AUTH_SECRET is set
2. Check NEXTAUTH_URL matches domain
3. Clear browser cookies and retry

#### File Upload Failures

1. Verify Cloudinary credentials
2. Check file size (max 10MB default)
3. Ensure PDF format

#### Email Not Sending

1. Verify SendGrid API key
2. Check EMAIL_FROM is verified sender
3. Review SendGrid dashboard for bounces

#### Database Connection Errors

1. Check DATABASE_URL format
2. Verify PostgreSQL is running
3. Check connection limits

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check max connections
psql -c "SHOW max_connections;"
```

### Recovery Procedures

#### Rollback Deployment

**Vercel:**
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Self-hosted:**
```bash
git checkout <previous-commit>
npm ci
npm run build
pm2 restart tmj
```

#### Database Recovery

```bash
# Stop application
pm2 stop tmj

# Restore from backup
pg_restore -h localhost -U postgres -d journaldb -c latest_backup.dump

# Run migrations (if needed)
npx prisma migrate deploy

# Restart
pm2 start tmj
```

---

## Backup & Recovery

### Backup Strategy

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full DB | Daily | 30 days |
| Transaction logs | Continuous | 7 days |
| Application code | Per deployment | All versions |
| Uploaded files | Cloudinary handles | Per plan |

### Backup Script

```bash
#!/bin/bash
# backup.sh - Run via cron daily

BACKUP_DIR="/var/backups/tmj"
DATE=$(date +%Y%m%d_%H%M%S)

# Database
pg_dump -h localhost -U postgres -d journaldb -F c -f "$BACKUP_DIR/db_$DATE.dump"

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.dump" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp "$BACKUP_DIR/db_$DATE.dump" s3://your-bucket/backups/
```

---

## Security

### Environment Variables

Never commit `.env` files. Use:
- Vercel Environment Variables (encrypted)
- AWS Secrets Manager
- HashiCorp Vault

### Database Security

- Use strong passwords
- Limit network access (firewall)
- Enable SSL connections
- Regular security updates

### Application Security

Built-in protections:
- CSRF protection (NextAuth)
- JWT token validation
- Role-based access control
- Input validation on all APIs

### Security Checklist

- [ ] AUTH_SECRET is unique and strong (32+ chars)
- [ ] Database is not publicly accessible
- [ ] HTTPS enforced
- [ ] Admin accounts use strong passwords
- [ ] Cloudinary is set to authenticated uploads
- [ ] SendGrid sender is verified

---

## Maintenance Windows

### Recommended Schedule

- **Security updates**: Within 24 hours of release
- **Feature deployments**: Weekly, low-traffic hours
- **Database maintenance**: Monthly, with backup

### Deployment Checklist

Before deploying:
1. [ ] Run tests locally
2. [ ] Review changes in staging (if available)
3. [ ] Backup database
4. [ ] Notify users (if downtime expected)

After deploying:
1. [ ] Verify health check
2. [ ] Test critical flows (login, submit, review)
3. [ ] Monitor logs for errors
4. [ ] Update changelog

---

## Contact & Escalation

**On-call rotation:** [Define based on team]

**Escalation path:**
1. Level 1: Check logs, restart services
2. Level 2: Database issues, rollback
3. Level 3: Security incidents, data loss

**External support:**
- Vercel support: support.vercel.com
- Cloudinary: support.cloudinary.com
- SendGrid: support.sendgrid.com
