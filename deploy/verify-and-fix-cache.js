const { Client } = require('ssh2');

const VPS = {
    host: '69.62.87.145',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASS || '',
};

const commands = [
    { label: '🔍 Verificando staff.js en VPS', cmd: 'grep -c "newStaffPass" /var/www/nerve/client/assets/js/modules/staff.js && echo "✅ Archivo actualizado correctamente" || echo "❌ Archivo NO actualizado"' },
    { label: '🔍 Verificando api.js en VPS', cmd: 'grep -c "createUser" /var/www/nerve/client/assets/js/api.js && echo "✅ API actualizada" || echo "❌ API NO actualizada"' },
    { label: '🔍 Verificando users.js en VPS', cmd: 'grep -c "users/create" /var/www/nerve/server/src/routes/users.js && echo "✅ Backend actualizado" || echo "❌ Backend NO actualizado"' },
    { label: '🔧 Eliminando caché de Nginx', cmd: `sed -i 's/expires 30d;/expires -1;/' /etc/nginx/sites-available/nervehealthsystems.com && sed -i 's/add_header Cache-Control "public, immutable";/add_header Cache-Control "no-cache, must-revalidate";/' /etc/nginx/sites-available/nervehealthsystems.com && nginx -t && systemctl reload nginx && echo "✅ Caché de Nginx desactivado"` },
];

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to VPS\n');
    let i = 0;
    function next() {
        if (i >= commands.length) { conn.end(); return; }
        const { label, cmd } = commands[i];
        console.log(`[${i + 1}/${commands.length}] ${label}...`);
        conn.exec(cmd, { pty: true }, (err, stream) => {
            let out = '';
            stream.on('data', d => { out += d.toString(); });
            stream.on('close', () => {
                console.log(`  → ${out.trim()}\n`);
                i++;
                next();
            });
        });
    }
    next();
}).connect(VPS);
