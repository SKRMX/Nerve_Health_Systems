// ================================================
// NERVE API — Appointments Routes
// ================================================
const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');

const router = express.Router();
router.use(authenticate);

// ---- GET /api/appointments ----
router.get('/',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor', 'asistente', 'patient'),
    async (req, res) => {
        try {
            const { role, orgId, id: userId } = req.user;
            const { date, status, doctorId, page = 1, limit = 50 } = req.query;

            const where = {};

            if (role === 'patient') {
                // Patients see their own appointments via their patient record
                const patientRecord = await prisma.patient.findFirst({
                    where: { email: req.user.email, orgId },
                });
                if (!patientRecord) return res.json({ data: [], total: 0 });
                where.patientId = patientRecord.id;
            } else if (role === 'doctor') {
                where.doctorId = userId;
            } else if (role !== 'superadmin') {
                // org_owner, dept_head, asistente — all in same org
                where.patient = { orgId };
            }

            if (date) {
                const d = new Date(date);
                where.date = {
                    gte: new Date(d.setHours(0, 0, 0, 0)),
                    lte: new Date(d.setHours(23, 59, 59, 999)),
                };
            }

            if (status) where.status = status;
            if (doctorId && role !== 'doctor') where.doctorId = doctorId;

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [appointments, total] = await Promise.all([
                prisma.appointment.findMany({
                    where,
                    include: {
                        patient: { select: { id: true, name: true, phone: true } },
                        doctor: { select: { id: true, name: true, specialty: true } },
                    },
                    orderBy: { date: 'asc' },
                    skip,
                    take: parseInt(limit),
                }),
                prisma.appointment.count({ where }),
            ]);

            res.json({ data: appointments, total, page: parseInt(page), limit: parseInt(limit) });
        } catch (err) {
            console.error('List appointments error:', err);
            res.status(500).json({ error: 'Error al listar citas' });
        }
    }
);

// ---- POST /api/appointments ----
router.post('/',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor', 'asistente'),
    auditMiddleware('appointment'),
    async (req, res) => {
        try {
            const { patientId, doctorId, date, time, type, reason } = req.body;

            if (!patientId || !date || !time) {
                return res.status(400).json({ error: 'Paciente, fecha y hora son requeridos' });
            }

            const assignedDoctorId = doctorId || (req.user.role === 'doctor' ? req.user.id : null);
            if (!assignedDoctorId) {
                return res.status(400).json({ error: 'Debe asignar un doctor' });
            }

            const appointment = await prisma.appointment.create({
                data: {
                    patientId,
                    doctorId: assignedDoctorId,
                    date: new Date(date),
                    time,
                    type: type || 'consulta',
                    reason: reason || null,
                },
                include: {
                    patient: { select: { id: true, name: true, phone: true, orgId: true } },
                    doctor: { select: { id: true, name: true } },
                },
            });

            // --- WHATSAPP INTEGRATION ---
            try {
                const org = await prisma.organization.findUnique({ where: { id: appointment.patient.orgId } });
                if (org && org.whatsappConnected && appointment.patient.phone) {
                    const waService = require('../services/whatsappService');
                    
                    // Add 12 hours to counter UTC offset issues sometimes seen on server
                    const dLocal = new Date(new Date(appointment.date).getTime() + 12*60*60*1000).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
                    
                    const drName = appointment.doctor.name.replace('Dr. ', '').replace('Dra. ', '');
                    const msg = `🏥 *NERVE Reminders*\n\nHola *${appointment.patient.name.split(' ')[0]}*, confirmamos tu cita médica programada en *${org.name}*.\n\n👨‍⚕️ Especialista: Dr(a). ${drName}\n📅 Fecha: ${dLocal}\n⏰ Hora: ${appointment.time}\n\nSi necesitas cancelar o reprogramar, por favor contáctanos con anticipación.`;
                    
                    // Fire and forget
                    waService.sendMessage(org.id, appointment.patient.phone, msg);
                }
            } catch (waErr) {
                console.error('[WA] Send hook error:', waErr);
            }
            // -----------------------------

            res.status(201).json(appointment);
        } catch (err) {
            console.error('Create appointment error:', err);
            res.status(500).json({ error: 'Error al crear cita' });
        }
    }
);

// ---- PUT /api/appointments/:id ----
router.put('/:id',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor', 'asistente'),
    auditMiddleware('appointment'),
    async (req, res) => {
        try {
            const { date, time, type, status, reason, notes } = req.body;

            const existing = await prisma.appointment.findUnique({
                where: { id: req.params.id },
                include: { patient: { select: { orgId: true } } },
            });

            if (!existing) return res.status(404).json({ error: 'Cita no encontrada' });
            if (req.user.role !== 'superadmin' && existing.patient.orgId !== req.user.orgId) {
                return res.status(403).json({ error: 'Sin acceso' });
            }

            // Asistente can change date/time/status but not clinical notes
            const updateData = {};
            if (date) updateData.date = new Date(date);
            if (time) updateData.time = time;
            if (type) updateData.type = type;
            if (status) updateData.status = status;
            if (reason !== undefined) updateData.reason = reason;

            // Only medical staff can add clinical notes
            if (notes !== undefined && req.user.role !== 'asistente') {
                updateData.notes = notes;
            }

            const appointment = await prisma.appointment.update({
                where: { id: req.params.id },
                data: updateData,
                include: {
                    patient: { select: { id: true, name: true, phone: true, orgId: true } },
                    doctor: { select: { id: true, name: true } },
                },
            });

            // --- WHATSAPP: RESCHEDULE NOTIFICATION ---
            if ((date || time) && appointment.patient.phone) {
                try {
                    const org = await prisma.organization.findUnique({ where: { id: appointment.patient.orgId } });
                    if (org && org.whatsappConnected) {
                        const waService = require('../services/whatsappService');
                        const firstName = appointment.patient.name.split(' ')[0];
                        const drName = appointment.doctor.name.replace('Dr. ', '').replace('Dra. ', '');
                        const newDate = new Date(new Date(appointment.date).getTime() + 12*60*60*1000)
                            .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
                        const msg = `📋 *Cita Reagendada*\n\nHola *${firstName}*, tu consulta en *${org.name}* ha sido modificada.\n\n📅 Nueva fecha: ${newDate}\n⏰ Nueva hora: ${appointment.time}\n👨‍⚕️ Dr(a). ${drName}\n\nSi tienes alguna duda, contáctanos.`;
                        waService.sendMessage(org.id, appointment.patient.phone, msg);
                    }
                } catch (waErr) {
                    console.error('[WA] Reschedule hook error:', waErr);
                }
            }
            // -----------------------------------------

            res.json(appointment);
        } catch (err) {
            console.error('Update appointment error:', err);
            res.status(500).json({ error: 'Error al actualizar cita' });
        }
    }
);

// ---- DELETE /api/appointments/:id ----
router.delete('/:id',
    authorize('superadmin', 'org_owner', 'dept_head', 'doctor', 'asistente'),
    auditMiddleware('appointment'),
    async (req, res) => {
        try {
            const existing = await prisma.appointment.findUnique({
                where: { id: req.params.id },
                include: {
                    patient: { select: { name: true, phone: true, orgId: true } },
                    doctor: { select: { name: true } },
                },
            });

            if (!existing) return res.status(404).json({ error: 'Cita no encontrada' });
            if (req.user.role !== 'superadmin' && existing.patient.orgId !== req.user.orgId) {
                return res.status(403).json({ error: 'Sin acceso' });
            }

            // --- WHATSAPP: CANCELLATION NOTIFICATION ---
            if (existing.patient.phone) {
                try {
                    const org = await prisma.organization.findUnique({ where: { id: existing.patient.orgId } });
                    if (org && org.whatsappConnected) {
                        const waService = require('../services/whatsappService');
                        const firstName = existing.patient.name.split(' ')[0];
                        const dateStr = new Date(new Date(existing.date).getTime() + 12*60*60*1000)
                            .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
                        const drName = existing.doctor.name.replace('Dr. ', '').replace('Dra. ', '');
                        const msg = `❌ *Cita Cancelada*\n\nHola *${firstName}*, tu consulta del ${dateStr} a las ${existing.time} en *${org.name}* con Dr(a). ${drName} ha sido cancelada.\n\nSi deseas reagendar, por favor contáctanos. 🏥`;
                        waService.sendMessage(org.id, existing.patient.phone, msg);
                    }
                } catch (waErr) {
                    console.error('[WA] Cancellation hook error:', waErr);
                }
            }
            // -------------------------------------------

            await prisma.appointment.delete({ where: { id: req.params.id } });
            res.json({ message: 'Cita eliminada' });
        } catch (err) {
            console.error('Delete appointment error:', err);
            res.status(500).json({ error: 'Error al eliminar cita' });
        }
    }
);

module.exports = router;
