const { Client } = require('ssh2');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASS || '',
};

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to VPS');
    conn.exec('cd /var/www/nerve && git pull origin main && npm install && npx -y prisma generate && npx -y prisma db push --accept-data-loss && pm2 restart ecosystem.config.js', { pty: true }, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', code => {
            console.log(`✅ Git pulled (Code ${code})`);
            conn.end();
        });
    });
}).connect(VPS);
