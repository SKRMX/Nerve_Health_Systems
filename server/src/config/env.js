// ================================================
// NERVE API — Environment Config
// ================================================
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isProd = process.env.NODE_ENV === 'production';

// In production, ensure critical secrets are set
if (isProd) {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL', 'SUPER_ADMIN_PASSWORD'];
    for (const key of required) {
        if (!process.env[key] || process.env[key].includes('CHANGE_ME')) {
            console.error(`❌ FATAL: Environment variable ${key} is not configured for production.`);
            process.exit(1);
        }
    }
}

// Parse allowed origins from env or use defaults
const defaultOrigins = ['http://localhost:3000'];
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : defaultOrigins;

module.exports = {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    allowedOrigins,

    jwt: {
        secret: process.env.JWT_SECRET || (isProd ? undefined : 'nerve-dev-jwt-secret-LOCAL-ONLY'),
        refreshSecret: process.env.JWT_REFRESH_SECRET || (isProd ? undefined : 'nerve-dev-refresh-secret-LOCAL-ONLY'),
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    superAdmin: {
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@nervehealthsystems.com',
        password: process.env.SUPER_ADMIN_PASSWORD || (isProd ? undefined : 'dev-password-local-only'),
        name: process.env.SUPER_ADMIN_NAME || 'Admin',
    },

    mercadoPago: {
        accessToken: process.env.MP_ACCESS_TOKEN || '',
        publicKey: process.env.MP_PUBLIC_KEY || '',
    },

    chromiumPath: process.env.CHROMIUM_PATH || null,
};
