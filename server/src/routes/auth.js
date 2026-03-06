// ================================================
// NERVE API — Auth Routes
// ================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { authenticate, generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { VALID_ROLES } = require('../middleware/rbac');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter to prevent abuse: Max 3 free accounts per IP
const registerLimiter = rateLimit({
    windowMs: 30 * 24 * 60 * 60 * 1000, // 30 days duration (in memory)
    max: 3, // limit each IP to 3 signups
    message: { error: '⚠️ Límite de cuentas gratuitas alcanzado. Por favor contacta a soporte para continuar.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use true IP when deployed behind Nginx proxy
        return req.headers['x-forwarded-for'] || req.ip;
    }
});

// ---- POST /api/auth/register ----
// Creates an organization + org_owner in one step
router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { name, email, password, orgName, phone, specialty, license } = req.body;

        if (!name || !email || !password || !orgName) {
            return res.status(400).json({ error: 'Nombre, email, contraseña y nombre de organización son requeridos' });
        }

        // Check duplicate email
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Ya existe una cuenta con este correo' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create org + owner in a transaction
        const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const result = await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: orgName,
                    slug: `${slug}-${Date.now().toString(36)}`,
                    plan: 'trial',
                },
            });

            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    role: 'org_owner',
                    phone: phone || null,
                    specialty: specialty || null,
                    license: license || null,
                    orgId: org.id,
                },
            });

            return { org, user };
        });

        const tokens = generateTokens(result.user);

        await logAudit(result.user.id, 'CREATE', 'organization', result.org.id, 'Registro de nueva organización', req.ip);

        res.status(201).json({
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                specialty: result.user.specialty,
                license: result.user.license,
                orgId: result.org.id,
                orgName: result.org.name,
            },
            ...tokens,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Error al crear la cuenta' });
    }
});

// ---- POST /api/auth/login ----
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { org: { select: { id: true, name: true, plan: true, active: true } } },
        });

        if (!user || !user.active) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Check org is active (skip for superadmin)
        if (user.role !== 'superadmin' && user.org && !user.org.active) {
            return res.status(403).json({ error: 'Tu organización está suspendida. Contacta soporte.' });
        }

        const tokens = generateTokens(user);

        await logAudit(user.id, 'LOGIN', 'user', user.id, null, req.ip);

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                specialty: user.specialty,
                license: user.license,
                phone: user.phone,
                orgId: user.org?.id || null,
                orgName: user.org?.name || null,
                orgPlan: user.org?.plan || null,
            },
            ...tokens,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ---- POST /api/auth/register-invite ----
// Completes registration using a JWT invite token
router.post('/register-invite', async (req, res) => {
    try {
        const { token, name, password, specialty, phone } = req.body;

        if (!token || !name || !password) {
            return res.status(400).json({ error: 'Token, nombre y contraseña son requeridos' });
        }

        const jwt = require('jsonwebtoken');
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invitación inválida o expirada' });
        }

        if (payload.type !== 'invite') {
            return res.status(400).json({ error: 'Token inválido' });
        }

        // Check duplicate email
        const existing = await prisma.user.findUnique({ where: { email: payload.email } });
        if (existing) {
            return res.status(409).json({ error: 'Esta invitación ya fue utilizada o el correo ya está registrado' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email: payload.email,
                passwordHash,
                role: payload.role,
                phone: phone || null,
                specialty: specialty || null,
                orgId: payload.orgId,
                departmentId: payload.departmentId || null,
            },
            include: { org: { select: { id: true, name: true, plan: true } } }
        });

        const tokens = generateTokens(user);

        await logAudit(user.id, 'CREATE', 'user', user.id, `Usuario aceptó invitación a la org ${payload.orgName}`, req.ip);

        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                specialty: user.specialty,
                orgId: user.org?.id || null,
                orgName: user.org?.name || null,
            },
            ...tokens,
        });
    } catch (err) {
        console.error('Register invite error:', err);
        res.status(500).json({ error: 'Error al completar el registro por invitación' });
    }
});

// ---- POST /api/auth/refresh ----
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token requerido' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user || !user.active) {
            return res.status(401).json({ error: 'Usuario no válido' });
        }

        const tokens = generateTokens(user);
        res.json(tokens);
    } catch (err) {
        res.status(401).json({ error: 'Refresh token inválido' });
    }
});

// ---- GET /api/auth/me ----
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, name: true, email: true, role: true,
                specialty: true, phone: true, avatarUrl: true,
                org: { select: { id: true, name: true, plan: true } },
                department: { select: { id: true, name: true } },
            },
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

module.exports = router;
