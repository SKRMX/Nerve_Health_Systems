const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const downloadsDir = path.join(__dirname, '../client/downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

console.log('🚧 Cleaning old builds...');
fs.rmSync(path.join(__dirname, 'built'), { recursive: true, force: true });
fs.rmSync(path.join(__dirname, '../client/downloads/Nerve_Desktop_Windows.zip'), { force: true });

console.log('📦 Packaging Windows App with Custom Icon...');
try {
    execSync('npx electron-packager . NerveHealthSystems --platform=win32 --arch=x64 --icon=icon.ico --out=built --overwrite', { stdio: 'inherit' });
} catch (e) {
    console.error('Packaging failed.', e.message);
    process.exit(1);
}

console.log('🗜️ Zipping Windows App...');
try {
    execSync('powershell.exe -ExecutionPolicy Bypass -Command "Compress-Archive -Path built\\NerveHealthSystems-win32-x64\\* -DestinationPath ..\\client\\downloads\\Nerve_Desktop_Windows.zip -Force"', { stdio: 'inherit' });
} catch (e) {
    console.error('Zipping failed.', e.message);
}

console.log('🍎 Creating Mac Placeholder...');
fs.writeFileSync('mac-readme.txt', 'La versión para macOS se encuentra actualmente en proceso de revisión notarial por parte de Apple. Estará disponible para su descarga oficial muy pronto. Por favor utiliza la versión web mientras tanto.');
try {
    execSync('powershell.exe -ExecutionPolicy Bypass -Command "Compress-Archive -Path mac-readme.txt -DestinationPath ..\\client\\downloads\\Nerve_Desktop_Mac.zip -Force"', { stdio: 'inherit' });
} catch (e) {
    console.error('Mac zip failed.', e.message);
}

console.log('✅ App successfully packaged and zipped into client/downloads!');
