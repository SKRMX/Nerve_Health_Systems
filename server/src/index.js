// ================================================
// NERVE Health Systems — API Server
// ================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');

const app = express();

// ---- Security ----
app.use(helmet());
app.use(cors({
    origin: config.clientUrl,
    credentials: true,
}));

// ---- Rate Limiting ----
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000,                 // 5000 requests per window (Escalado para múltiples doctores en misma IP)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
});
app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 attempts per 15 mins for clinics with multiple users logging in
    message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
});

// ---- Parsing ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Logging ----
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ---- Routes ----
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const userRoutes = require('./routes/users');
const orgRoutes = require('./routes/organizations');
const deptRoutes = require('./routes/departments');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/departments', deptRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'NERVE Health Systems API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: config.nodeEnv === 'development' ? err.message : 'Error interno del servidor',
    });
});

// ---- Start Server ----
async function startServer() {
    const prisma = require('./config/database');
    const bcrypt = require('bcryptjs');

    try {
        // Test DB connection
        await prisma.$connect();
        console.log('✅ Conectado a PostgreSQL');

        // Ensure superadmin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: config.superAdmin.email },
        });

        if (!existingAdmin) {
            const passwordHash = await bcrypt.hash(config.superAdmin.password, 12);
            await prisma.user.create({
                data: {
                    email: config.superAdmin.email,
                    passwordHash,
                    name: config.superAdmin.name,
                    role: 'superadmin',
                },
            });
            console.log(`✅ Superadmin creado: ${config.superAdmin.email}`);
        }

        app.listen(config.port, () => {
            console.log(`
╔═══════════════════════════════════════════════╗
║   🏥 NERVE Health Systems API                 ║
║   Puerto: ${config.port}                              ║
║   Entorno: ${config.nodeEnv.padEnd(16)}            ║
║   URL: http://localhost:${config.port}                ║
╚═══════════════════════════════════════════════╝
      `);
        });
    } catch (err) {
        console.error('❌ Error al iniciar el servidor:', err);
        process.exit(1);
    }
}

startServer();

module.exports = app;
