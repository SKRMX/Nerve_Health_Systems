const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

async function buildIcon() {
    try {
        const svgPath = path.join(__dirname, '../client/logos/isotipo_nerve.svg');
        const pngPath = path.join(__dirname, 'icon.png');
        const icoPath = path.join(__dirname, 'icon.ico');

        // Render SVG to a 256x256 PNG
        console.log('Converting SVG to PNG...');
        await sharp(svgPath)
            .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(pngPath);
        console.log('✅ SVG -> PNG conversion successful');

        // Convert PNG to ICO
        console.log('Converting PNG to ICO...');
        const buf = await pngToIco(pngPath);
        fs.writeFileSync(icoPath, buf);
        console.log('✅ PNG -> ICO conversion successful');
    } catch (err) {
        console.error('Error building icon:', err);
        process.exit(1);
    }
}
buildIcon();
