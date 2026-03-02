#!/bin/bash
# ================================================
# NERVE Health Systems — VPS Setup Script
# SAFE: Does NOT touch existing projects (GESTORAQ, etc.)
# Only creates /var/www/nerve and its own Nginx server block
# ================================================
set -e

echo "╔═══════════════════════════════════════════════╗"
echo "║   🏥 NERVE Health Systems — VPS Setup         ║"
echo "║   ⚠️  Safe mode: won't touch other projects   ║"
echo "╚═══════════════════════════════════════════════╝"

# ---- 1. Install dependencies (only if missing) ----
echo "📦 Installing dependencies (skipping if already present)..."
apt-get update -y -qq

# Node.js 20
if ! command -v node &> /dev/null; then
  echo "  → Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "✅ Node.js $(node --version)"

# PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "  → Installing PostgreSQL..."
  apt-get install -y -qq postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
fi
echo "✅ PostgreSQL $(psql --version | head -1)"

# PM2
if ! command -v pm2 &> /dev/null; then
  echo "  → Installing PM2..."
  npm install -g pm2
fi
echo "✅ PM2 $(pm2 --version)"

# Certbot (only install, don't run)
if ! command -v certbot &> /dev/null; then
  apt-get install -y -qq certbot python3-certbot-nginx
fi
echo "✅ Certbot installed"

# ---- 2. Create database (idempotent — won't fail if exists) ----
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='nerve_user'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER nerve_user WITH PASSWORD 'NerveDB_Pr0d_2026!';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='nerve_prod'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE nerve_prod OWNER nerve_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nerve_prod TO nerve_user;" 2>/dev/null
echo "✅ Database nerve_prod ready"

# ---- 3. Clone repo into /var/www/nerve (isolated folder) ----
echo "📂 Setting up project in /var/www/nerve..."
mkdir -p /var/www/nerve
cd /var/www/nerve
if [ ! -d ".git" ]; then
  git init
  git remote add origin https://github.com/SKRMX/Nerve_Health_Systems.git
  git pull origin main
else
  git pull origin main
fi
echo "✅ Repository cloned to /var/www/nerve"

# ---- 4. Install server dependencies ----
echo "📦 Installing server dependencies..."
cd /var/www/nerve/server
npm install --production
echo "✅ Dependencies installed"

# ---- 5. Generate Prisma client ----
echo "🔧 Generating Prisma client..."
npx prisma generate

# ---- 6. Create production .env ----
echo "🔧 Creating production .env..."
cat > /var/www/nerve/server/.env << 'ENVEOF'
DATABASE_URL="postgresql://nerve_user:NerveDB_Pr0d_2026!@localhost:5432/nerve_prod?schema=public"
JWT_SECRET="nerve-prod-jwt-2026-x7Kp9mQzL4wR8nBv3hTfYc2eAi6uDg0s"
JWT_REFRESH_SECRET="nerve-prod-refresh-2026-J5tW8qN1xP3hF7vM0rK2dY9cBa4iEu6s"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="production"
CLIENT_URL="https://nervehealthsystems.com"
ENCRYPTION_KEY="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2"
SUPER_ADMIN_EMAIL="mauricio@nervehealthsystems.com"
SUPER_ADMIN_PASSWORD="palmera22022800"
SUPER_ADMIN_NAME="MauricioCV"
ENVEOF
echo "✅ .env created"

# ---- 7. Run database migrations ----
echo "🗄️ Syncing database schema..."
cd /var/www/nerve/server
npx prisma db push
echo "✅ Database schema synced"

# ---- 8. PM2 config ----
echo "🔧 Creating PM2 config..."
cat > /var/www/nerve/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'nerve-api',
    script: './server/src/index.js',
    cwd: '/var/www/nerve',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
PM2EOF

# ---- 9. Start API with PM2 ----
echo "🚀 Starting NERVE API with PM2..."
cd /var/www/nerve
pm2 delete nerve-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "✅ API running on port 3001"

# ---- 10. ADD Nginx server block (without touching existing configs!) ----
echo "🌐 Adding Nginx config for nervehealthsystems.com..."
echo "   ⚠️  NOT modifying any existing Nginx configs"

cat > /etc/nginx/sites-available/nervehealthsystems.com << 'NGINXEOF'
# NERVE Health Systems — nervehealthsystems.com
# This config is independent from other projects on this server
server {
    listen 80;
    server_name nervehealthsystems.com www.nervehealthsystems.com;

    # Frontend files served from /var/www/nerve/client
    root /var/www/nerve/client;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(css|js|svg|png|jpg|jpeg|gif|ico|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API → Node.js on port 3001
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINXEOF

# Enable ONLY our site (don't touch default or other sites!)
ln -sf /etc/nginx/sites-available/nervehealthsystems.com /etc/nginx/sites-enabled/nervehealthsystems.com

# Test config before reloading (if test fails, don't reload)
echo "   Testing Nginx config..."
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  echo "✅ Nginx reloaded — nervehealthsystems.com active"
else
  echo "❌ Nginx config test failed! Other sites are NOT affected."
  echo "   Run 'nginx -t' to see the error."
fi

# ---- 11. Test ----
echo ""
echo "🔍 Testing API..."
sleep 2
curl -s http://localhost:3001/api/health || echo "API not responding yet (may need a moment)"

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   ✅ NERVE Setup Complete!                    ║"
echo "║                                               ║"
echo "║   📂 Project: /var/www/nerve                  ║"
echo "║   🔌 API: http://localhost:3001               ║"
echo "║   🌐 Site: nervehealthsystems.com (after DNS) ║"
echo "║                                               ║"
echo "║   ⚠️  Existing projects NOT modified           ║"
echo "║                                               ║"
echo "║   Next steps:                                 ║"
echo "║   1. Point DNS to 69.62.87.145                ║"
echo "║   2. certbot --nginx -d nervehealthsystems.com║"
echo "╚═══════════════════════════════════════════════╝"
