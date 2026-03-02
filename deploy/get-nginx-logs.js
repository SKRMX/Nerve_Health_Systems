const { Client } = require('ssh2');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASS || '',
};

const conn = new Client();
conn.on('ready', () => {
    conn.exec('tail -n 50 /var/log/nginx/error.log && echo "---ACCESS---" && tail -n 50 /var/log/nginx/access.log', { pty: true }, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(VPS);
