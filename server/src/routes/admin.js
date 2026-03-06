// ================================================
// NERVE API — Admin / Superadmin Routes
// ================================================
const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);
router.use(authorize('superadmin'));

// ---- GET /api/admin/stats ----
// Global platform statistics
router.get('/stats', async (req, res) => {
    try {
        const [orgCount, userCount, patientCount, appointmentCount, prescriptionCount] = await Promise.all([
            prisma.organization.count(),
            prisma.user.count({ where: { role: { not: 'superadmin' } } }),
            prisma.patient.count(),
            prisma.appointment.count(),
            prisma.prescription.count(),
        ]);

        console.log('--- GLOBAL STATS DEBUG ---');
        console.log('Orgs:', orgCount);
        console.log('Users:', userCount);
        console.log('Patients:', patientCount);
        console.log('Appointments:', appointmentCount);
        console.log('--------------------------');

        // Doctors count
        const doctorCount = await prisma.user.count({ where: { role: 'doctor' } });

        // Org breakdown
        const orgs = await prisma.organization.findMany({
            select: {
                id: true, name: true, plan: true, location: true, city: true, active: true,
                _count: { select: { users: true, patients: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Plan distribution
        const planDist = await prisma.organization.groupBy({
            by: ['plan'],
            _count: true,
        });

        res.json({
            stats: {
                organizations: orgCount,
                users: userCount,
                doctors: doctorCount,
                patients: patientCount,
                appointments: appointmentCount,
                prescriptions: prescriptionCount,
            },
            organizations: orgs,
            planDistribution: planDist,
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// ---- GET /api/admin/audit ----
// Global audit log
router.get('/audit', async (req, res) => {
    try {
        const { page = 1, limit = 50, entity, action, userId } = req.query;
        const where = {};

        if (entity) where.entity = entity;
        if (action) where.action = action;
        if (userId) where.userId = userId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: { user: { select: { id: true, name: true, email: true, role: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.json({ data: logs, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener auditoría' });
    }
});

// ---- PUT /api/admin/organizations/:id/plan ----
// Change org plan
router.put('/organizations/:id/plan', async (req, res) => {
    try {
        const { plan, maxDoctors, active, subscriptionExpires } = req.body;

        const org = await prisma.organization.update({
            where: { id: req.params.id },
            data: {
                ...(plan && { plan }),
                ...(maxDoctors !== undefined && { maxDoctors: parseInt(maxDoctors) }),
                ...(active !== undefined && { active }),
                ...(subscriptionExpires !== undefined && { subscriptionExpires: subscriptionExpires ? new Date(subscriptionExpires) : null }),
            },
        });

        res.json(org);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar plan' });
    }
});

// ---- GET /api/admin/organizations/:id/audit ----
// Fetch audit logs for a specific organization
router.get('/organizations/:id/audit', async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await prisma.auditLog.findMany({
            where: {
                user: { orgId: id }
            },
            include: { user: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener auditoría de la organización' });
    }
});

module.exports = router;
