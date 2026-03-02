// ================================================
// NERVE API — Departments Routes
// ================================================
const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');

const router = express.Router();
router.use(authenticate);

// ---- GET /api/departments ----
router.get('/',
    authorize('superadmin', 'org_owner', 'dept_head'),
    async (req, res) => {
        try {
            const where = req.user.role !== 'superadmin' ? { orgId: req.user.orgId } : {};

            const departments = await prisma.department.findMany({
                where,
                include: {
                    _count: { select: { users: true } },
                },
                orderBy: { name: 'asc' },
            });

            res.json({ data: departments, total: departments.length });
        } catch (err) {
            res.status(500).json({ error: 'Error al listar departamentos' });
        }
    }
);

// ---- POST /api/departments ----
router.post('/',
    authorize('superadmin', 'org_owner'),
    auditMiddleware('department'),
    async (req, res) => {
        try {
            const { name } = req.body;
            if (!name) return res.status(400).json({ error: 'Nombre del departamento es requerido' });

            const dept = await prisma.department.create({
                data: { name, orgId: req.user.orgId },
            });

            res.status(201).json(dept);
        } catch (err) {
            res.status(500).json({ error: 'Error al crear departamento' });
        }
    }
);

// ---- PUT /api/departments/:id ----
router.put('/:id',
    authorize('superadmin', 'org_owner'),
    auditMiddleware('department'),
    async (req, res) => {
        try {
            const { name } = req.body;
            const dept = await prisma.department.update({
                where: { id: req.params.id },
                data: { ...(name && { name }) },
            });
            res.json(dept);
        } catch (err) {
            res.status(500).json({ error: 'Error al actualizar departamento' });
        }
    }
);

// ---- DELETE /api/departments/:id ----
router.delete('/:id',
    authorize('superadmin', 'org_owner'),
    auditMiddleware('department'),
    async (req, res) => {
        try {
            await prisma.department.delete({ where: { id: req.params.id } });
            res.json({ message: 'Departamento eliminado' });
        } catch (err) {
            res.status(500).json({ error: 'Error al eliminar departamento' });
        }
    }
);

module.exports = router;
