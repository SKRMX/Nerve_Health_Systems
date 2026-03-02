#!/bin/bash
# ================================================
# NERVE Health Systems — VPS Setup Script
# Run this on the VPS as root
# ================================================
set -e

echo "╔═══════════════════════════════════════════════╗"
echo "║   🏥 NERVE Health Systems — VPS Setup         ║"
echo "╚═══════════════════════════════════════════════╝"

# ---- 1. Update system ----
echo "📦 Updating system packages..."
apt-get update -y && apt-get upgrade -y

# ---- 2. Install Node.js 20 ----
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "✅ Node.js $(node --version)"

# ---- 3. Install PostgreSQL ----
echo "📦 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
  apt-get install -y postgresql postgresql-contrib
fi
systemctl enable postgresql
systemctl start postgresql
echo "✅ PostgreSQL $(psql --version)"

# ---- 4. Install Nginx ----
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
fi
systemctl enable nginx
systemctl start nginx
echo "✅ Nginx installed"

# ---- 5. Install PM2 ----
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi
echo "✅ PM2 $(pm2 --version)"

# ---- 6. Install Certbot ----
echo "📦 Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# ---- 7. Create database ----
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='nerve_user'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER nerve_user WITH PASSWORD 'NerveDB_Pr0d_2026!';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='nerve_prod'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE nerve_prod OWNER nerve_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nerve_prod TO nerve_user;"
echo "✅ Database nerve_prod ready"

# ---- 8. Clone repository ----
echo "📂 Setting up project directory..."
mkdir -p /var/www/nerve
if [ ! -d "/var/www/nerve/.git" ]; then
  cd /var/www/nerve
  git init
  git remote add origin https://github.com/SKRMX/Nerve_Health_Systems.git
  git pull origin main
else
  cd /var/www/nerve
  git pull origin main
fi
echo "✅ Repository cloned"

# ---- 9. Install dependencies ----
echo "📦 Installing server dependencies..."
cd /var/www/nerve/server
npm install --production
echo "✅ Dependencies installed"

# ---- 10. Generate Prisma client ----
echo "🔧 Generating Prisma client..."
npx prisma generate

# ---- 11. Create production .env ----
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

# ---- 12. Run Prisma migrations ----
echo "🗄️ Running database migrations..."
cd /var/www/nerve/server
npx prisma db push
echo "✅ Database schema synced"

# ---- 13. Create PM2 ecosystem file ----
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

# ---- 14. Start with PM2 ----
echo "🚀 Starting NERVE API with PM2..."
cd /var/www/nerve
pm2 delete nerve-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
echo "✅ API running on port 3001"

# ---- 15. Configure Nginx ----
echo "🔧 Configuring Nginx..."
cat > /etc/nginx/sites-available/nervehealthsystems.com << 'NGINXEOF'
server {
    listen 80;
    server_name nervehealthsystems.com www.nervehealthsystems.com;

    # Frontend static files
    root /var/www/nerve/client;
    index index.html;

    # Gzip compression
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

    # API reverse proxy
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
        proxy_send_timeout 30s;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/nervehealthsystems.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t && systemctl reload nginx
echo "✅ Nginx configured"

# ---- 16. Setup firewall ----
echo "🔧 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "✅ Firewall configured"

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   ✅ NERVE VPS Setup Complete!                ║"
echo "║                                               ║"
echo "║   Frontend: http://nervehealthsystems.com     ║"
echo "║   API:      http://nervehealthsystems.com/api ║"
echo "║   Health:   .../api/health                    ║"
echo "║                                               ║"
echo "║   Next: Point DNS to 69.62.87.145             ║"
echo "║   Then: certbot --nginx -d nervehealthsystems.com ║"
echo "╚═══════════════════════════════════════════════╝"
