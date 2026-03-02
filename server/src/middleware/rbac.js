// ================================================
// NERVE API — Role-Based Access Control (RBAC)
// ================================================

/**
 * Role hierarchy (higher number = more access)
 */
const ROLE_LEVEL = {
    patient: 0,
    asistente: 1,
    doctor: 2,
    dept_head: 3,
    org_owner: 4,
    superadmin: 5,
};

const VALID_ROLES = Object.keys(ROLE_LEVEL);

/**
 * Require one of the specified roles
 * Usage: authorize('doctor', 'dept_head', 'org_owner', 'superadmin')
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'No tienes permisos para esta acción',
                required: allowedRoles,
                current: req.user.role,
            });
        }
        next();
    };
}

/**
 * Require minimum role level
 * Usage: requireLevel('doctor') → allows doctor, dept_head, org_owner, superadmin
 */
function requireLevel(minRole) {
    const minLevel = ROLE_LEVEL[minRole] ?? 0;
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const userLevel = ROLE_LEVEL[req.user.role] ?? -1;
        if (userLevel < minLevel) {
            return res.status(403).json({
                error: 'No tienes permisos suficientes',
                required: minRole,
                current: req.user.role,
            });
        }
        next();
    };
}

/**
 * Ensure user belongs to the same org (multi-tenancy isolation)
 * Superadmin bypasses this check
 */
function sameOrg(req, res, next) {
    if (req.user.role === 'superadmin') return next();
    // orgId comes from the route param or query
    const targetOrgId = req.params.orgId || req.query.orgId || req.body.orgId;
    if (targetOrgId && targetOrgId !== req.user.orgId) {
        return res.status(403).json({ error: 'No tienes acceso a esta organización' });
    }
    next();
}

module.exports = { authorize, requireLevel, sameOrg, ROLE_LEVEL, VALID_ROLES };
