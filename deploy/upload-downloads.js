const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASS || '',
};

const localDownloadsDir = path.join(__dirname, '../client/downloads');
const remoteDownloadsDir = '/var/www/nerve/client/downloads';

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Connected to VPS via SSH');
    conn.sftp((err, sftp) => {
        if (err) throw err;

        // Create remote directory if not exists
        sftp.mkdir(remoteDownloadsDir, (err) => {
            // ignore EEXIST
            console.log('📁 Verified remote download path');
            uploadFiles(sftp);
        });
    });
}).connect(VPS);

function uploadFiles(sftp) {
    const files = fs.readdirSync(localDownloadsDir);
    let total = files.length;
    let count = 0;

    if (total === 0) {
        console.log('No files to upload.');
        return conn.end();
    }

    files.forEach(file => {
        const localFile = path.join(localDownloadsDir, file);
        const remoteFile = `${remoteDownloadsDir}/${file}`;

        console.log(`📤 Uploading ${file} (${(fs.statSync(localFile).size / 1024 / 1024).toFixed(2)} MB)...`);
        sftp.fastPut(localFile, remoteFile, {
            step: (transferred, chunk, total) => {
                process.stdout.write(`\r   Progress: ${(transferred / total * 100).toFixed(1)}%`);
            }
        }, (err) => {
            console.log(); // Newline
            if (err) console.error(`❌ Failed to upload ${file}:`, err.message);
            else console.log(`✅ Uploaded ${file}`);

            count++;
            if (count === total) {
                console.log('🎉 All downloads uploaded successfully!');
                conn.end();
            }
        });
    });
}
