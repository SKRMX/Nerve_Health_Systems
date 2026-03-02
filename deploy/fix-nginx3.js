const { Client } = require('ssh2');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASS || '',
};

const REMOTE_FILE = '/etc/nginx/sites-available/nervehealthsystems.com';

const newConfig = `server {
    server_name nervehealthsystems.com www.nervehealthsystems.com;
    root /var/www/nerve/client;
    index app.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
    location ~* \\.(css|js|svg|png|jpg|jpeg|gif|ico|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    location / {
        try_files $uri $uri/ /app.html;
    }
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
    }
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/nervehealthsystems.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/nervehealthsystems.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.nervehealthsystems.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = nervehealthsystems.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name nervehealthsystems.com www.nervehealthsystems.com;
    return 404; # managed by Certbot
}
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to VPS');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.writeFile(REMOTE_FILE, newConfig, (err) => {
            if (err) throw err;
            console.log('✅ Wrote clean Nginx config without backslash errors');
            conn.exec('nginx -t && systemctl reload nginx', { pty: true }, (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', code => {
                    console.log(`✅ Nginx reloaded (Code ${code})`);
                    conn.end();
                });
            });
        });
    });
}).connect(VPS);
