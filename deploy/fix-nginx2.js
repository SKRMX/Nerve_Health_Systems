const { Client } = require('ssh2');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASS || '',
};

const REMOTE_FILE = '/etc/nginx/sites-available/nervehealthsystems.com';

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to VPS');
    conn.sftp((err, sftp) => {
        if (err) {
            console.error('SFTP Error:', err);
            return conn.end();
        }

        // Read the Nginx file
        sftp.readFile(REMOTE_FILE, 'utf8', (err, data) => {
            if (err) {
                console.error('Read Error:', err);
                return conn.end();
            }

            // Fix try_files loop
            // Replace: try_files $uri $uri/ /app.html; OR try_files $uri $uri/ /index.html;
            // With: try_files $uri $uri/ =404; (to prevent internal redirection loops)
            let fixedData = data;
            fixedData = fixedData.replace(/try_files\s+\$uri\s+\$uri\/\s+\/[a-zA-Z0-9_.]*;/g, 'try_files $uri $uri/ =404;');

            // Write it back
            sftp.writeFile(REMOTE_FILE, fixedData, (err) => {
                if (err) {
                    console.error('Write Error:', err);
                    return conn.end();
                }
                console.log('✅ Nginx config file updated via SFTP (try_files loop fixed)');

                // Reload Nginx
                conn.exec('nginx -t && systemctl reload nginx', { pty: true }, (err, stream) => {
                    if (err) {
                        console.error('Exec Error:', err);
                        return conn.end();
                    }
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', code => {
                        console.log(`✅ Nginx reloaded (Code ${code})`);
                        conn.end();
                    });
                });
            });
        });
    });
}).on('error', err => {
    console.error('Connection Error:', err);
}).connect(VPS);
