// ================================================
// NERVE API — JWT Authentication Middleware
// ================================================
const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Verify JWT token from Authorization header
 * Sets req.user = { id, email, role, orgId }
 */
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Token inválido' });
    }
}

/**
 * Generate access + refresh tokens
 */
function generateTokens(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId || null,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
    return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = { authenticate, generateTokens, verifyRefreshToken };
