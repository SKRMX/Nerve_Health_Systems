const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const clients = new Map();
const qrCodes = new Map();

// Helper to clean up auth folder on disconnect
const removeAuthFolder = (orgId) => {
    const fn = path.join(__dirname, '../../.wwebjs_auth/session-org-' + orgId);
    if (fs.existsSync(fn)) {
        fs.rmSync(fn, { recursive: true, force: true });
    }
};

class WhatsAppService {
    static getStatus(orgId) {
        if (clients.has(orgId)) {
            const client = clients.get(orgId);
            if (client.info) return { status: 'CONNECTED', number: client.info.wid.user };
            if (qrCodes.has(orgId)) return { status: 'QR_READY', qr: qrCodes.get(orgId) };
            return { status: 'STARTING' };
        }
        return { status: 'DISCONNECTED' };
    }

    static async connect(orgId) {
        if (clients.has(orgId)) return;

        console.log(`[WA] Initializing client for org ${orgId}`);
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: 'org-' + orgId }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote'
                ]
            }
        });

        // Set to STARTING phase
        clients.set(orgId, client);

        client.on('qr', async (qr) => {
            console.log(`[WA] QR received for org ${orgId}`);
            try {
                const qrDataUrl = await qrcode.toDataURL(qr);
                qrCodes.set(orgId, qrDataUrl);
            } catch (err) {
                console.error('Error generating QR format:', err);
            }
        });

        client.on('ready', async () => {
            console.log(`[WA] Client ready for org ${orgId}`);
            qrCodes.delete(orgId);
            const number = client.info?.wid?.user;
            await prisma.organization.update({
                where: { id: orgId },
                data: { whatsappConnected: true, whatsappNumber: number }
            });
        });

        client.on('disconnected', async (reason) => {
            console.log(`[WA] Client disconnected for org ${orgId}:`, reason);
            clients.delete(orgId);
            qrCodes.delete(orgId);
            try {
                await prisma.organization.update({
                    where: { id: orgId },
                    data: { whatsappConnected: false, whatsappNumber: null }
                });
            } catch(e){}
        });

        client.on('auth_failure', () => {
             console.log(`[WA] Auth failure for org ${orgId}`);
             clients.delete(orgId);
             qrCodes.delete(orgId);
             removeAuthFolder(orgId);
        });

        client.initialize().catch(err => {
            console.error('[WA] Failed to init client:', err);
            clients.delete(orgId);
        });
    }

    static async disconnect(orgId) {
        console.log(`[WA] Processing manual disconnect for org ${orgId}`);
        const client = clients.get(orgId);
        if (client) {
            try { await client.logout(); } catch(e){}
            try { await client.destroy(); } catch(e){}
            clients.delete(orgId);
            qrCodes.delete(orgId);
        }
        removeAuthFolder(orgId);
        await prisma.organization.update({
            where: { id: orgId },
            data: { whatsappConnected: false, whatsappNumber: null }
        });
    }

    static async sendMessage(orgId, phoneStr, message) {
        const client = clients.get(orgId);
        if (!client || !client.info) {
            console.log(`[WA] Send failed: No active client for org ${orgId}`);
            return false;
        }
        
        try {
            // Very basic phone sanitization for WhatsApp standard
            let phone = phoneStr.replace(/\D/g, '');
            // Assume 10-digit MX numbers
            if (phone.length === 10) phone = '521' + phone; 
            
            const chatId = phone + '@c.us';
            await client.sendMessage(chatId, message);
            console.log(`[WA] Message sent successfully to ${chatId}`);
            return true;
        } catch (err) {
            console.error('[WA] Send message error:', err);
            return false;
        }
    }
}

module.exports = WhatsAppService;
