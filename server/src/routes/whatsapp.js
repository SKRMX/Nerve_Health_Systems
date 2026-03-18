const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/rbac');
const { authenticate } = require('../middleware/auth');
const WhatsAppService = require('../services/whatsappService');

router.use(authenticate);
// Requiere ser Dueño, Doctor o Superadmin para manipular ajustes de mensajería
router.use(authorize('org_owner', 'doctor', 'superadmin'));

// Estado actual (esperando QR, desconectado, conectado)
router.get('/status', (req, res) => {
    try {
        const orgId = req.user.orgId;
        const statusObj = WhatsAppService.getStatus(orgId);
        res.json(statusObj);
    } catch (err) {
        res.json({ status: 'DISCONNECTED' });
    }
});

// Arrancar Puppeteer (Whatsapp Web)
router.post('/connect', (req, res) => {
    try {
        const orgId = req.user.orgId;
        WhatsAppService.connect(orgId);
        res.json({ message: 'Conexión iniciada. Generando código QR...' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error iniciando motor de mensajería' });
    }
});

// Cerrar sesión
router.post('/disconnect', async (req, res) => {
    try {
        const orgId = req.user.orgId;
        await WhatsAppService.disconnect(orgId);
        res.json({ message: 'Cuenta desvinculada.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error cerrando sesión' });
    }
});

module.exports = router;
