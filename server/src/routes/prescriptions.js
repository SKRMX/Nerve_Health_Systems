// ================================================
// NERVE API — Prescriptions Routes
// ================================================
const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');

const router = express.Router();
router.use(authenticate);

// ---- GET /api/prescriptions ----
router.get('/',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor', 'asistente', 'patient'),
    async (req, res) => {
        try {
            const { role, orgId, id: userId } = req.user;
            const { patientId, active, page = 1, limit = 50 } = req.query;

            const where = {};

            if (role === 'patient') {
                const patientRecord = await prisma.patient.findFirst({
                    where: { email: req.user.email, orgId },
                });
                if (!patientRecord) return res.json({ data: [], total: 0 });
                where.patientId = patientRecord.id;
            } else if (role === 'doctor') {
                where.doctorId = userId;
            } else if (role !== 'superadmin') {
                where.patient = { orgId };
            }

            if (patientId) where.patientId = patientId;
            if (active !== undefined) where.active = active === 'true';

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [prescriptions, total] = await Promise.all([
                prisma.prescription.findMany({
                    where,
                    include: {
                        patient: { select: { id: true, name: true } },
                        doctor: { select: { id: true, name: true, specialty: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                prisma.prescription.count({ where }),
            ]);

            res.json({ data: prescriptions, total, page: parseInt(page), limit: parseInt(limit) });
        } catch (err) {
            console.error('List prescriptions error:', err);
            res.status(500).json({ error: 'Error al listar recetas' });
        }
    }
);

// ---- POST /api/prescriptions ----
// Only doctors and dept_heads can create prescriptions
router.post('/',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor'),
    auditMiddleware('prescription'),
    async (req, res) => {
        try {
            const { patientId, medication, dosage, frequency, duration, notes, batchId } = req.body;

            if (!patientId || !medication || !dosage || !frequency || !duration) {
                return res.status(400).json({ error: 'Paciente, medicamento, dosis, frecuencia y duración son requeridos' });
            }

            const prescription = await prisma.prescription.create({
                data: {
                    patientId,
                    doctorId: req.user.id,
                    medication,
                    dosage,
                    frequency,
                    duration,
                    notes: notes || null,
                    batchId: batchId || null,
                },
                include: {
                    patient: { select: { id: true, name: true } },
                    doctor: { select: { id: true, name: true } },
                },
            });

            res.status(201).json(prescription);
        } catch (err) {
            console.error('Create prescription error:', err);
            res.status(500).json({ error: 'Error al crear receta' });
        }
    }
);

// ---- PUT /api/prescriptions/:id ----
router.put('/:id',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor'),
    auditMiddleware('prescription'),
    async (req, res) => {
        try {
            const { medication, dosage, frequency, duration, notes, active } = req.body;

            const prescription = await prisma.prescription.update({
                where: { id: req.params.id },
                data: {
                    ...(medication && { medication }),
                    ...(dosage && { dosage }),
                    ...(frequency && { frequency }),
                    ...(duration && { duration }),
                    ...(notes !== undefined && { notes }),
                    ...(active !== undefined && { active }),
                },
            });

            res.json(prescription);
        } catch (err) {
            console.error('Update prescription error:', err);
            res.status(500).json({ error: 'Error al actualizar receta' });
        }
    }
);

module.exports = router;
