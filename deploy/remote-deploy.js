// ================================================
// NERVE — Remote VPS Deployment via ssh2
// ================================================
const { Client } = require('ssh2');
const fs = require('fs');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: '.x3G5lt)eVF-;M4l54wN',
};

// Commands to execute in sequence
const commands = [
    // 1. System update
    { label: '📦 Updating system', cmd: 'apt-get update -y -qq' },

    // 2. Node.js 20
    {
        label: '📦 Installing Node.js 20',
        cmd: `if ! command -v node &>/dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
    fi && node --version`,
    },

    // 3. PostgreSQL
    {
        label: '📦 Installing PostgreSQL',
        cmd: `if ! command -v psql &>/dev/null; then
      apt-get install -y -qq postgresql postgresql-contrib
    fi && systemctl enable postgresql && systemctl start postgresql && psql --version`,
    },

    // 4. Git
    {
        label: '📦 Installing Git',
        cmd: `if ! command -v git &>/dev/null; then apt-get install -y -qq git; fi && git --version`,
    },

    // 5. Nginx
    {
        label: '📦 Installing Nginx',
        cmd: `if ! command -v nginx &>/dev/null; then apt-get install -y -qq nginx; fi && systemctl enable nginx && systemctl start nginx && echo "Nginx OK"`,
    },

    // 6. PM2
    {
        label: '📦 Installing PM2',
        cmd: `if ! command -v pm2 &>/dev/null; then npm install -g pm2; fi && pm2 --version`,
    },

    // 7. Certbot
    {
        label: '📦 Installing Certbot',
        cmd: 'apt-get install -y -qq certbot python3-certbot-nginx && echo "Certbot OK"',
    },

    // 8. Create DB user and database
    {
        label: '🗄️ Setting up PostgreSQL database',
        cmd: `sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='nerve_user'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER nerve_user WITH PASSWORD 'NerveDB_Pr0d_2026!';"; sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='nerve_prod'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE nerve_prod OWNER nerve_user;"; sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nerve_prod TO nerve_user;" && echo "DB Ready"`,
    },

    // 9. Clone repo
    {
        label: '📂 Cloning repository',
        cmd: `mkdir -p /var/www/nerve && cd /var/www/nerve && if [ ! -d ".git" ]; then git init && git remote add origin https://github.com/SKRMX/Nerve_Health_Systems.git && git pull origin main; else git pull origin main; fi && echo "Repo OK"`,
    },

    // 10. Install deps
    {
        label: '📦 Installing server dependencies',
        cmd: 'cd /var/www/nerve/server && npm install --production && echo "Deps OK"',
    },

    // 11. Generate Prisma client
    {
        label: '🔧 Generating Prisma client',
        cmd: 'cd /var/www/nerve/server && npx prisma generate && echo "Prisma OK"',
    },

    // 12. Create production .env
    {
        label: '🔧 Creating production .env',
        cmd: `cat > /var/www/nerve/server/.env << 'EOF'
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
EOF
echo ".env created"`,
    },

    // 13. Run Prisma migrations
    {
        label: '🗄️ Running database migrations',
        cmd: 'cd /var/www/nerve/server && npx prisma db push && echo "DB synced"',
    },

    // 14. Create PM2 config
    {
        label: '🔧 Creating PM2 config',
        cmd: `cat > /var/www/nerve/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nerve-api',
    script: './server/src/index.js',
    cwd: '/var/www/nerve',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: { NODE_ENV: 'production' },
  }],
};
EOF
echo "PM2 config OK"`,
    },

    // 15. Start API with PM2
    {
        label: '🚀 Starting NERVE API',
        cmd: 'cd /var/www/nerve && pm2 delete nerve-api 2>/dev/null; pm2 start ecosystem.config.js && pm2 save && echo "API running"',
    },

    // 16. Configure Nginx
    {
        label: '🌐 Configuring Nginx',
        cmd: `cat > /etc/nginx/sites-available/nervehealthsystems.com << 'EOF'
server {
    listen 80;
    server_name nervehealthsystems.com www.nervehealthsystems.com;
    root /var/www/nerve/client;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
    location ~* \\.(css|js|svg|png|jpg|jpeg|gif|ico|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    location / {
        try_files \\$uri \\$uri/ /index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF
ln -sf /etc/nginx/sites-available/nervehealthsystems.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx && echo "Nginx OK"`,
    },

    // 17. Test API
    {
        label: '✅ Testing API health',
        cmd: 'sleep 2 && curl -s http://localhost:3001/api/health',
    },
];

// Execute commands sequentially via SSH
async function deploy() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', () => {
            console.log('✅ Connected to VPS!\n');
            executeSequentially(conn, 0, resolve);
        });

        conn.on('error', (err) => {
            console.error('❌ SSH Connection error:', err.message);
            reject(err);
        });

        console.log(`🔌 Connecting to ${VPS.host}...`);
        conn.connect(VPS);
    });
}

function executeSequentially(conn, index, done) {
    if (index >= commands.length) {
        console.log('\n╔═══════════════════════════════════════════════╗');
        console.log('║   ✅ NERVE VPS Deployment Complete!            ║');
        console.log('║   API: http://69.62.87.145/api/health          ║');
        console.log('╚═══════════════════════════════════════════════╝');
        conn.end();
        return done();
    }

    const { label, cmd } = commands[index];
    console.log(`[${index + 1}/${commands.length}] ${label}...`);

    conn.exec(cmd, { pty: true }, (err, stream) => {
        if (err) {
            console.error(`  ❌ Error: ${err.message}`);
            // Continue to next command
            return executeSequentially(conn, index + 1, done);
        }

        let output = '';
        stream.on('data', (data) => {
            output += data.toString();
        });

        stream.stderr.on('data', (data) => {
            output += data.toString();
        });

        stream.on('close', (code) => {
            // Print last 3 lines of output
            const lines = output.trim().split('\n');
            const tail = lines.slice(-3).join('\n');
            if (tail) console.log(`  → ${tail}`);
            if (code !== 0 && code !== null) {
                console.log(`  ⚠️ Exit code: ${code}`);
            }
            console.log('');
            executeSequentially(conn, index + 1, done);
        });
    });
}

deploy().catch(err => {
    console.error('Deployment failed:', err.message);
    process.exit(1);
});
