// ================================================
// NERVE API — Users & Invitations Routes
// ================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');
const { VALID_ROLES } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

// ---- PUT /api/users/me ----
// Update own profile (any authenticated user)
router.put('/me', async (req, res) => {
    try {
        const { name, specialty, phone } = req.body;
        const data = {};
        if (name) data.name = name;
        if (specialty !== undefined) data.specialty = specialty;
        if (phone !== undefined) data.phone = phone;

        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data,
            select: { id: true, name: true, email: true, role: true, specialty: true, phone: true },
        });
        res.json(updated);
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

// ---- GET /api/users ----
// List users in org (staff management)
router.get('/',
    authorize('superadmin', 'org_owner', 'dept_head'),
    async (req, res) => {
        try {
            const { role, orgId } = req.user;
            const { search, userRole, departmentId } = req.query;

            const where = {};

            if (role !== 'superadmin') {
                where.orgId = orgId;
            }

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (userRole) where.role = userRole;
            if (departmentId) where.departmentId = departmentId;

            const users = await prisma.user.findMany({
                where,
                select: {
                    id: true, name: true, email: true, role: true,
                    specialty: true, phone: true, active: true,
                    department: { select: { id: true, name: true } },
                    createdAt: true,
                    _count: { select: { patients: true, appointments: true } },
                },
                orderBy: { name: 'asc' },
            });

            res.json({ data: users, total: users.length });
        } catch (err) {
            console.error('List users error:', err);
            res.status(500).json({ error: 'Error al listar usuarios' });
        }
    }
);

// ---- POST /api/users/invite ----
// Invite a new user to the organization via JWT link
router.post('/invite',
    authorize('superadmin', 'org_owner'),
    auditMiddleware('user'),
    async (req, res) => {
        try {
            const { email, role, departmentId } = req.body;

            if (!email || !role) {
                return res.status(400).json({ error: 'Email y rol son requeridos' });
            }

            // Validate role
            const allowedInviteRoles = ['org_owner', 'dept_head', 'doctor', 'asistente', 'patient'];
            if (!allowedInviteRoles.includes(role)) {
                return res.status(400).json({ error: `Rol inválido. Permitidos: ${allowedInviteRoles.join(', ')}` });
            }

            // Check duplicate
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return res.status(409).json({ error: 'Ya existe un usuario con ese correo registrado en el sistema' });
            }

            // We need the org name to embed in the token
            const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
            if (!org) {
                return res.status(404).json({ error: 'Organización no encontrada' });
            }

            // Import jwt (require inside or globally, let's just use jsonwebtoken)
            const jwt = require('jsonwebtoken');

            const payload = {
                email,
                role,
                orgId: req.user.orgId,
                orgName: org.name,
                departmentId: departmentId || null,
                inviterName: req.user.name,
                type: 'invite'
            };

            const inviteToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '48h' });

            // In a real app we would send an email here using a mailer service.
            // For now, we return the token and the link to the frontend so it can display it.
            const inviteUrl = `${req.protocol}://${req.get('host')}/invite.html?token=${inviteToken}`;

            res.status(201).json({
                message: 'Invitación generada con éxito',
                inviteToken,
                inviteUrl,
                expiresIn: '48 horas'
            });
        } catch (err) {
            console.error('Invite user error:', err);
            res.status(500).json({ error: 'Error al generar la invitación' });
        }
    }
);

// ---- POST /api/users/create ----
// Directly create a user in the org (no invitation needed)
router.post('/create',
    authorize('superadmin', 'org_owner'),
    auditMiddleware('user'),
    async (req, res) => {
        try {
            const { name, email, password, role, specialty, phone, departmentId } = req.body;

            if (!name || !email || !password || !role) {
                return res.status(400).json({ error: 'Nombre, email, contraseña y rol son requeridos' });
            }

            // Validate role
            const allowedRoles = ['org_owner', 'dept_head', 'doctor', 'asistente'];
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({ error: `Rol inválido. Permitidos: ${allowedRoles.join(', ')}` });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
            }

            // Check duplicate
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return res.status(409).json({ error: 'Ya existe un usuario con ese correo registrado en el sistema' });
            }

            const passwordHash = await bcrypt.hash(password, 12);

            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    role,
                    phone: phone || null,
                    specialty: specialty || null,
                    orgId: req.user.orgId,
                    departmentId: departmentId || null,
                },
                select: {
                    id: true, name: true, email: true, role: true,
                    specialty: true, phone: true, active: true,
                },
            });

            res.status(201).json({
                message: 'Usuario creado exitosamente',
                user,
            });
        } catch (err) {
            console.error('Create user error:', err);
            res.status(500).json({ error: 'Error al crear el usuario' });
        }
    }
);

// ---- PUT /api/users/:id ----
router.put('/:id',
    authorize('superadmin', 'org_owner'),
    auditMiddleware('user'),
    async (req, res) => {
        try {
            const { name, role, specialty, phone, active, departmentId } = req.body;

            const user = await prisma.user.update({
                where: { id: req.params.id },
                data: {
                    ...(name && { name }),
                    ...(role && { role }),
                    ...(specialty !== undefined && { specialty }),
                    ...(phone !== undefined && { phone }),
                    ...(active !== undefined && { active }),
                    ...(departmentId !== undefined && { departmentId }),
                },
                select: {
                    id: true, name: true, email: true, role: true,
                    specialty: true, active: true,
                },
            });

            res.json(user);
        } catch (err) {
            console.error('Update user error:', err);
            res.status(500).json({ error: 'Error al actualizar usuario' });
        }
    }
);

// ---- DELETE /api/users/:id ----
router.delete('/:id',
    authorize('superadmin', 'org_owner'),
    auditMiddleware('user'),
    async (req, res) => {
        try {
            // Prevent self-deletion
            if (req.params.id === req.user.id) {
                return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
            }

            await prisma.user.delete({ where: { id: req.params.id } });
            res.json({ message: 'Usuario eliminado' });
        } catch (err) {
            console.error('Delete user error:', err);
            res.status(500).json({ error: 'Error al eliminar usuario' });
        }
    }
);

module.exports = router;
