// ================================================
// NERVE Health Systems — Hospital Nerve Seeder
// ================================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const specialties = [
    'Alergología', 'Anestesiología', 'Cardiología', 'Cirugía General',
    'Cirugía Plástica', 'Dermatología', 'Endocrinología', 'Gastroenterología',
    'Geriatría', 'Ginecología', 'Hematología', 'Infectología',
    'Medicina Familiar', 'Medicina Interna', 'Nefrología', 'Neumología',
    'Neurología', 'Nutrición', 'Odontología', 'Oftalmología',
    'Oncología', 'Ortopedia', 'Pediatría', 'Psiquiatría',
    'Reumatología'
];

async function main() {
    console.log('🌱 Iniciando siembra de Hospital Nerve...');

    // 1. Crear Organización
    const org = await prisma.organization.create({
        data: {
            name: 'Hospital Nerve',
            slug: `hospital-nerve-${Date.now().toString(36)}`,
            plan: 'enterprise',
            location: 'Ciudad de México, CDMX',
            active: true
        }
    });
    console.log(`✅ Organización creada: ${org.name} (${org.id})`);

    // 2. Crear Org Owner (Director Médico)
    const ownerPass = await bcrypt.hash('DirectorNerve2026', 12);
    const owner = await prisma.user.create({
        data: {
            name: 'Dr. Alejandro Robles (Director Médico)',
            email: 'director@hospitalnerve.com',
            passwordHash: ownerPass,
            role: 'org_owner',
            specialty: 'Administración en Salud',
            orgId: org.id
        }
    });
    console.log(`✅ Director Médico creado: ${owner.email} | Pass: DirectorNerve2026`);

    // 3. Crear 24 Doctores (1 especialidad c/u)
    console.log(`👨‍⚕️ Creando 24 doctores con especialidades únicas...`);
    const defaultDoctorPass = await bcrypt.hash('DoctorNerve2026', 12);

    // We only create 24 explicitly. The 25th will be an invitation link for the user.
    for (let i = 0; i < 24; i++) {
        const spec = specialties[i];
        await prisma.user.create({
            data: {
                name: `Dr(a). Médico Especialista ${i + 1}`,
                email: `doctor${i + 1}@hospitalnerve.com`,
                passwordHash: defaultDoctorPass,
                role: 'doctor',
                specialty: spec,
                orgId: org.id
            }
        });
    }
    console.log(`✅ 24 Doctores creados exitosamente. Pass genérico: DoctorNerve2026`);

    // 4. Crear Enlace de Invitación JWT para el Doctor #25 (El Usuario Real)
    console.log(`📨 Generando invitación para el 25º doctor (Tú)...`);

    // Get JWT_SECRET
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.warn('⚠️ No se encontró JWT_SECRET, usando secreto de prueba para el seed local.');
    }

    const payload = {
        email: 'tucorreo@hospitalnerve.com',
        role: 'doctor',
        orgId: org.id,
        orgName: org.name,
        departmentId: null,
        inviterName: owner.name,
        type: 'invite'
    };

    const inviteToken = jwt.sign(payload, secret || 'nerve_super_secret_key_2026', { expiresIn: '48h' });
    const inviteUrl = `https://nervehealthsystems.com/invite.html?token=${inviteToken}`;

    console.log(`\n=============================================================`);
    console.log(`🎉 ¡HOSPITAL NERVE ESTÁ LISTO EN PRODUCCIÓN!`);
    console.log(`=============================================================`);
    console.log(`Director Login : director@hospitalnerve.com`);
    console.log(`Director Pass  : DirectorNerve2026`);
    console.log(`Doctores (1-24): doctor1@hospitalnerve.com ... doctor24@hospitalnerve.com`);
    console.log(`Pass Doctores  : DoctorNerve2026`);
    console.log(`-------------------------------------------------------------`);
    console.log(`🔗 ENLACE DE INVITACIÓN PARA EL 25º DOCTOR (TU ACCESO):`);
    console.log(`👉 ${inviteUrl}`);
    console.log(`=============================================================\n`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
