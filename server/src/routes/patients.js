// ================================================
// NERVE API — Patients Routes
// ================================================
const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ---- GET /api/patients ----
// List patients (filtered by role/org)
router.get('/',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor', 'asistente'),
    async (req, res) => {
        try {
            const { role, orgId, id: userId } = req.user;
            const { search, status, page = 1, limit = 50 } = req.query;

            const where = {};

            // Multi-tenancy: filter by org (except superadmin)
            if (role !== 'superadmin') {
                where.orgId = orgId;
            }

            // Doctors only see their own patients
            if (role === 'doctor') {
                where.doctorId = userId;
            }

            // Asistente sees all patients in their org (already filtered by orgId)

            // Search
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                ];
            }

            if (status) where.status = status;

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [patients, total] = await Promise.all([
                prisma.patient.findMany({
                    where,
                    include: {
                        doctor: { select: { id: true, name: true, specialty: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                prisma.patient.count({ where }),
            ]);

            // Strip medical notes for asistente role
            const data = role === 'asistente'
                ? patients.map(p => ({ ...p, medicalNotes: undefined, diagnosis: undefined }))
                : patients;

            res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
        } catch (err) {
            console.error('List patients error:', err);
            res.status(500).json({ error: 'Error al listar pacientes' });
        }
    }
);

// ---- GET /api/patients/:id ----
router.get('/:id',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor', 'asistente'),
    async (req, res) => {
        try {
            const patient = await prisma.patient.findUnique({
                where: { id: req.params.id },
                include: {
                    doctor: { select: { id: true, name: true, specialty: true } },
                    appointments: { orderBy: { date: 'desc' }, take: 20 },
                    prescriptions: { orderBy: { createdAt: 'desc' }, take: 20 },
                },
            });

            if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });

            // Multi-tenancy check
            if (req.user.role !== 'superadmin' && patient.orgId !== req.user.orgId) {
                return res.status(403).json({ error: 'Sin acceso a este paciente' });
            }

            // Strip medical data for asistente
            if (req.user.role === 'asistente') {
                patient.medicalNotes = undefined;
                patient.diagnosis = undefined;
            }

            res.json(patient);
        } catch (err) {
            console.error('Get patient error:', err);
            res.status(500).json({ error: 'Error al obtener paciente' });
        }
    }
);

// ---- POST /api/patients ----
router.post('/',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor', 'asistente'),
    auditMiddleware('patient'),
    async (req, res) => {
        try {
            const { name, email, phone, dob, gender, bloodType, allergies, doctorId } = req.body;

            if (!name) return res.status(400).json({ error: 'Nombre del paciente es requerido' });

            const assignedDoctorId = doctorId || (req.user.role === 'doctor' ? req.user.id : null);
            if (!assignedDoctorId) {
                return res.status(400).json({ error: 'Debe asignar un doctor al paciente' });
            }

            const patient = await prisma.patient.create({
                data: {
                    name,
                    email: email || null,
                    phone: phone || null,
                    dob: dob ? new Date(dob) : null,
                    gender: gender || null,
                    bloodType: bloodType || null,
                    allergies: allergies || null,
                    doctorId: assignedDoctorId,
                    orgId: req.user.orgId,
                },
                include: {
                    doctor: { select: { id: true, name: true, specialty: true } },
                },
            });

            res.status(201).json(patient);
        } catch (err) {
            console.error('Create patient error:', err);
            res.status(500).json({ error: 'Error al crear paciente' });
        }
    }
);

// ---- PUT /api/patients/:id/info ----
// Update demographic info (asistente CAN do this)
router.put('/:id/info',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor', 'asistente'),
    auditMiddleware('patient'),
    async (req, res) => {
        try {
            const { name, email, phone, dob, gender, bloodType, allergies, status } = req.body;

            // Verify org ownership
            const existing = await prisma.patient.findUnique({ where: { id: req.params.id } });
            if (!existing) return res.status(404).json({ error: 'Paciente no encontrado' });
            if (req.user.role !== 'superadmin' && existing.orgId !== req.user.orgId) {
                return res.status(403).json({ error: 'Sin acceso' });
            }

            const patient = await prisma.patient.update({
                where: { id: req.params.id },
                data: {
                    ...(name && { name }),
                    ...(email !== undefined && { email }),
                    ...(phone !== undefined && { phone }),
                    ...(dob && { dob: new Date(dob) }),
                    ...(gender && { gender }),
                    ...(bloodType && { bloodType }),
                    ...(allergies !== undefined && { allergies }),
                    ...(status && { status }),
                },
            });

            res.json(patient);
        } catch (err) {
            console.error('Update patient info error:', err);
            res.status(500).json({ error: 'Error al actualizar paciente' });
        }
    }
);

// ---- PUT /api/patients/:id ----
// Update medical data (asistente CANNOT do this)
router.put('/:id',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor'),
    auditMiddleware('patient'),
    async (req, res) => {
        try {
            const { diagnosis, medicalNotes, ...demoData } = req.body;

            const existing = await prisma.patient.findUnique({ where: { id: req.params.id } });
            if (!existing) return res.status(404).json({ error: 'Paciente no encontrado' });
            if (req.user.role !== 'superadmin' && existing.orgId !== req.user.orgId) {
                return res.status(403).json({ error: 'Sin acceso' });
            }

            const patient = await prisma.patient.update({
                where: { id: req.params.id },
                data: {
                    ...(diagnosis !== undefined && { diagnosis }),
                    ...(medicalNotes !== undefined && { medicalNotes }),
                    // Also allow demographic updates
                    ...(demoData.name && { name: demoData.name }),
                    ...(demoData.email !== undefined && { email: demoData.email }),
                    ...(demoData.phone !== undefined && { phone: demoData.phone }),
                    ...(demoData.status && { status: demoData.status }),
                },
            });

            res.json(patient);
        } catch (err) {
            console.error('Update patient error:', err);
            res.status(500).json({ error: 'Error al actualizar paciente' });
        }
    }
);

// ---- DELETE /api/patients/:id ----
router.delete('/:id',
    authorize('org_owner', 'superadmin'),
    auditMiddleware('patient'),
    async (req, res) => {
        try {
            const existing = await prisma.patient.findUnique({ where: { id: req.params.id } });
            if (!existing) return res.status(404).json({ error: 'Paciente no encontrado' });
            if (req.user.role !== 'superadmin' && existing.orgId !== req.user.orgId) {
                return res.status(403).json({ error: 'Sin acceso' });
            }

            await prisma.patient.delete({ where: { id: req.params.id } });
            res.json({ message: 'Paciente eliminado' });
        } catch (err) {
            console.error('Delete patient error:', err);
            res.status(500).json({ error: 'Error al eliminar paciente' });
        }
    }
);

module.exports = router;
