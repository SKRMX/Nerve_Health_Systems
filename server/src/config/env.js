// ================================================
// NERVE API — Environment Config
// ================================================
require('dotenv').config();

module.exports = {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-me',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    encryption: {
        key: process.env.ENCRYPTION_KEY || '0000000000000000000000000000000000000000000000000000000000000000',
    },

    superAdmin: {
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@nerve.local',
        password: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
        name: process.env.SUPER_ADMIN_NAME || 'Admin',
    },
};
