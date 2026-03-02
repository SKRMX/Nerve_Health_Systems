const { Client } = require('ssh2');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASS || '',
};

const commands = [
    {
        label: 'Fixing Nginx Config',
        cmd: `
      CONFIG_FILE="/etc/nginx/sites-available/nervehealthsystems.com"
      
      # 1. Back up config
      cp $CONFIG_FILE $CONFIG_FILE.bak
      
      # 2. Fix the index and try_files to point to app.html instead of index.html 
      sed -i 's/index index.html;/index app.html;/g' $CONFIG_FILE
      sed -i 's|try_files \\$uri \\$uri/ /index.html;|try_files \\$uri \\$uri/ /app.html;|g' $CONFIG_FILE
      
      # 3. Test and reload Nginx
      nginx -t && systemctl reload nginx
    `
    }
];

// Reusing same execute logic from remote-deploy.js
async function deploy() {
    const conn = new Client();
    return new Promise((resolve, reject) => {
        conn.on('ready', () => {
            console.log('✅ Connected to VPS!');
            executeSequentially(conn, 0, resolve);
        });
        conn.on('error', (err) => reject(err));
        conn.connect(VPS);
    });
}

function executeSequentially(conn, index, done) {
    if (index >= commands.length) {
        conn.end();
        return done();
    }
    const { label, cmd } = commands[index];
    conn.exec(cmd, { pty: true }, (err, stream) => {
        if (err) return executeSequentially(conn, index + 1, done);
        let output = '';
        stream.on('data', (data) => output += data.toString());
        stream.stderr.on('data', (data) => output += data.toString());
        stream.on('close', (code) => {
            console.log(output);
            executeSequentially(conn, index + 1, done);
        });
    });
}

deploy().catch(err => console.error(err));
