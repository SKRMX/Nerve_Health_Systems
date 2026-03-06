const { Client } = require('ssh2');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASS || '',
};

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to VPS for activation');
    conn.exec('cd /var/www/nerve/server && node src/scripts/set-lifetime.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code, signal) => {
            console.log(`✅ Status Update: Script finished with code ${code}`);
            conn.end();
        });
    });
}).connect(VPS);
