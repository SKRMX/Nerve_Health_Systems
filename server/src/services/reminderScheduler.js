// ================================================
// NERVE — Automated WhatsApp Reminder Scheduler
// Runs every 30 minutes via node-cron
// ================================================
const cron = require('node-cron');
const prisma = require('../config/database');

const TAG = '[WA-CRON]';

function formatDateES(date) {
    return new Date(date.getTime() + 12 * 60 * 60 * 1000)
        .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

async function sendReminders() {
    let waService;
    try {
        waService = require('./whatsappService');
    } catch (e) {
        console.log(`${TAG} WhatsApp service not available, skipping`);
        return;
    }

    const now = new Date();

    // ---- 24-HOUR REMINDERS ----
    try {
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const appointments24 = await prisma.appointment.findMany({
            where: {
                status: 'programada',
                reminderSentAt: null,
                date: { gte: now, lte: in24h },
            },
            include: {
                patient: { select: { name: true, phone: true, orgId: true } },
                doctor: { select: { name: true } },
            },
        });

        for (const appt of appointments24) {
            if (!appt.patient.phone) continue;

            const org = await prisma.organization.findUnique({ where: { id: appt.patient.orgId } });
            if (!org || !org.whatsappConnected) continue;

            const drName = appt.doctor.name.replace('Dr. ', '').replace('Dra. ', '');
            const dateStr = formatDateES(appt.date);
            const firstName = appt.patient.name.split(' ')[0];

            const msg = `⏰ *Recordatorio de Cita*\n\nHola *${firstName}*, te recordamos que mañana tienes tu consulta en *${org.name}*.\n\n👨‍⚕️ Especialista: Dr(a). ${drName}\n📅 Fecha: ${dateStr}\n⏰ Hora: ${appt.time}\n\nTe esperamos. Por favor llega 15 minutos antes. 🏥`;

            const sent = await waService.sendMessage(org.id, appt.patient.phone, msg);
            if (sent) {
                await prisma.appointment.update({
                    where: { id: appt.id },
                    data: { reminderSentAt: new Date() },
                });
                console.log(`${TAG} 24h reminder sent for appt ${appt.id}`);
            }
        }
    } catch (err) {
        console.error(`${TAG} 24h reminder error:`, err);
    }

    // ---- 2-HOUR REMINDERS ----
    try {
        const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const appointments2h = await prisma.appointment.findMany({
            where: {
                status: 'programada',
                reminder2hSentAt: null,
                date: { gte: now, lte: in2h },
            },
            include: {
                patient: { select: { name: true, phone: true, orgId: true } },
                doctor: { select: { name: true } },
            },
        });

        for (const appt of appointments2h) {
            if (!appt.patient.phone) continue;

            const org = await prisma.organization.findUnique({ where: { id: appt.patient.orgId } });
            if (!org || !org.whatsappConnected) continue;

            const drName = appt.doctor.name.replace('Dr. ', '').replace('Dra. ', '');
            const firstName = appt.patient.name.split(' ')[0];

            const msg = `🔔 *Tu cita es pronto*\n\nHola *${firstName}*, en aproximadamente 2 horas tienes tu consulta en *${org.name}*.\n\n👨‍⚕️ Dr(a). ${drName}\n⏰ Hora: ${appt.time}\n\n¡Ya casi es hora! Te esperamos. 🏥`;

            const sent = await waService.sendMessage(org.id, appt.patient.phone, msg);
            if (sent) {
                await prisma.appointment.update({
                    where: { id: appt.id },
                    data: { reminder2hSentAt: new Date() },
                });
                console.log(`${TAG} 2h reminder sent for appt ${appt.id}`);
            }
        }
    } catch (err) {
        console.error(`${TAG} 2h reminder error:`, err);
    }
}

function startReminderScheduler() {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', () => {
        console.log(`${TAG} Running reminder check at ${new Date().toISOString()}`);
        sendReminders();
    });

    // Also run once on startup (after a 10s delay to let WA clients reconnect)
    setTimeout(() => {
        console.log(`${TAG} Initial reminder check on startup`);
        sendReminders();
    }, 10000);

    console.log(`${TAG} ✅ Reminder scheduler started (every 30 min)`);
}

module.exports = { startReminderScheduler };
