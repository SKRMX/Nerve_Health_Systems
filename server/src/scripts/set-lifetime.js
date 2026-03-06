const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const date = new Date('2030-12-31');
    try {
        const res = await prisma.organization.updateMany({
            data: {
                subscriptionExpires: date,
                plan: 'platinum',
                maxDoctors: 100,
                active: true
            }
        });
        console.log(`✅ Success: Updated ${res.count} organizations to Lifetime/Platinum status (Expiry: 2030)`);
    } catch (err) {
        console.error('❌ Error updating organizations:', err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
