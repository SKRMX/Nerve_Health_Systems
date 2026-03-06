// ================================================
// NERVE API — Organizations Routes
// ================================================
const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');

const router = express.Router();
router.use(authenticate);

// ---- GET /api/organizations ----
// Superadmin: all orgs. Org owner: own org.
router.get('/',
    authorize('superadmin'),
    async (req, res) => {
        try {
            const orgs = await prisma.organization.findMany({
                include: {
                    _count: { select: { users: true, patients: true, departments: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
            res.json({ data: orgs, total: orgs.length });
        } catch (err) {
            res.status(500).json({ error: 'Error al listar organizaciones' });
        }
    }
);

// ---- GET /api/organizations/:id ----
router.get('/:id',
    authorize('superadmin', 'org_owner'),
    async (req, res) => {
        try {
            if (req.user.role !== 'superadmin' && req.params.id !== req.user.orgId) {
                return res.status(403).json({ error: 'Sin acceso a esta organización' });
            }

            const org = await prisma.organization.findUnique({
                where: { id: req.params.id },
                include: {
                    departments: true,
                    _count: { select: { users: true, patients: true } },
                },
            });

            if (!org) return res.status(404).json({ error: 'Organización no encontrada' });
            res.json(org);
        } catch (err) {
            res.status(500).json({ error: 'Error al obtener organización' });
        }
    }
);

// ---- PUT /api/organizations/:id ----
router.put('/:id',
    authorize('superadmin', 'org_owner'),
    auditMiddleware('organization'),
    async (req, res) => {
        try {
            if (req.user.role !== 'superadmin' && req.params.id !== req.user.orgId) {
                return res.status(403).json({ error: 'Sin acceso' });
            }

            const { name, location, city, phone, email, plan, maxDoctors } = req.body;

            const org = await prisma.organization.update({
                where: { id: req.params.id },
                data: {
                    ...(name && { name }),
                    ...(location !== undefined && { location }),
                    ...(city !== undefined && { city }),
                    ...(phone !== undefined && { phone }),
                    ...(email !== undefined && { email }),
                    ...(plan && { plan }),
                    ...(maxDoctors !== undefined && { maxDoctors: parseInt(maxDoctors) }),
                },
            });

            res.json(org);
        } catch (err) {
            res.status(500).json({ error: 'Error al actualizar organización' });
        }
    }
);

// ---- GET /api/organizations/:id/users ----
// List all users in a specific organization
router.get('/:id/users',
    authorize('superadmin', 'org_owner'),
    async (req, res) => {
        try {
            if (req.user.role !== 'superadmin' && req.params.id !== req.user.orgId) {
                return res.status(403).json({ error: 'Sin acceso' });
            }

            const users = await prisma.user.findMany({
                where: { orgId: req.params.id },
                select: { id: true, name: true, email: true, role: true, active: true, specialty: true },
                orderBy: { name: 'asc' }
            });

            res.json(users);
        } catch (err) {
            res.status(500).json({ error: 'Error al listar usuarios de la organización' });
        }
    }
);

module.exports = router;
