const { Client } = require('ssh2');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASS || '',
};

const conn = new Client();

const script = `
  cd /var/www/nerve && \
  git pull origin main && \
  cd server && \
  npm install && \
  pm2 restart nerve-api && \
  node src/seed-hospital.js
`;

conn.on('ready', () => {
    console.log('✅ Connected to VPS');
    conn.exec(script, { pty: true }, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', code => {
            console.log(`✅ Script completed with code ${code}`);
            conn.end();
        });
    });
}).connect(VPS);
