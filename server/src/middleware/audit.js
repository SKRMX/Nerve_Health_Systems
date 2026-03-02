// ================================================
// NERVE API — Audit Log Middleware
// ================================================
const prisma = require('../config/database');

/**
 * Log an action to the audit trail
 */
async function logAudit(userId, action, entity, entityId, details, ip) {
    try {
        await prisma.auditLog.create({
            data: { userId, action, entity, entityId, details, ip },
        });
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
}

/**
 * Express middleware that auto-logs write operations
 */
function auditMiddleware(entity) {
    return (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            // Log on successful write operations
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400) {
                const action = {
                    POST: 'CREATE',
                    PUT: 'UPDATE',
                    PATCH: 'UPDATE',
                    DELETE: 'DELETE',
                }[req.method];

                const entityId = req.params.id || data?.id || null;
                const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

                if (req.user) {
                    logAudit(req.user.id, action, entity, entityId, null, ip);
                }
            }
            return originalJson(data);
        };
        next();
    };
}

module.exports = { logAudit, auditMiddleware };
