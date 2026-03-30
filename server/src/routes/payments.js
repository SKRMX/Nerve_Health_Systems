// ================================================
// NERVE API — Payments Routes (Mercado Pago)
// ================================================
const express = require('express');
const prisma = require('../config/database');
const config = require('../config/env');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Plan configuration (prices in MXN)
const PLANS = {
    starter: {
        name: 'Doctor Solo — Starter',
        monthly: 999,
        annual: 832, // ~$9,984/year vs $11,988 = ~17% off
        maxDoctors: 3,
    },
    clinica_pro: {
        name: 'Clínica Pro',
        monthly: 6999,
        annual: 5832, // ~$69,984/year vs $83,988 = ~17% off
        maxDoctors: 10,
    },
};

// ---- POST /api/payments/create-preference ----
// Creates a Mercado Pago Checkout Pro preference
router.post('/create-preference',
    authenticate,
    authorize('superadmin', 'org_owner'),
    async (req, res) => {
        try {
            const { plan, billingCycle = 'monthly' } = req.body;

            if (!plan || !PLANS[plan]) {
                return res.status(400).json({ error: 'Plan inválido. Opciones: starter, clinica_pro' });
            }

            if (!config.mercadoPago.accessToken || config.mercadoPago.accessToken === 'YOUR_MERCADO_PAGO_ACCESS_TOKEN') {
                return res.status(503).json({ error: 'Pasarela de pagos no configurada. Contacta soporte.' });
            }

            const { MercadoPagoConfig, Preference } = require('mercadopago');

            const client = new MercadoPagoConfig({
                accessToken: config.mercadoPago.accessToken,
            });

            const preference = new Preference(client);

            const planConfig = PLANS[plan];
            const price = billingCycle === 'annual' ? planConfig.annual : planConfig.monthly;
            const periodLabel = billingCycle === 'annual' ? '(facturación anual)' : '(facturación mensual)';

            // Create or find existing subscription record
            let subscription = await prisma.subscription.findFirst({
                where: {
                    orgId: req.user.orgId,
                    status: { in: ['pending', 'active'] },
                },
            });

            if (!subscription) {
                // Calculate trial end date (15 days from now)
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 15);

                subscription = await prisma.subscription.create({
                    data: {
                        orgId: req.user.orgId,
                        plan,
                        status: 'pending',
                        amount: price * 100, // Store in cents
                        billingCycle,
                        trialEndsAt: trialEnd,
                    },
                });
            }

            // Build the base URL for callbacks
            const baseUrl = config.nodeEnv === 'production'
                ? 'https://nervehealthsystems.com'
                : config.clientUrl;

            const apiBase = config.nodeEnv === 'production'
                ? 'https://nervehealthsystems.com'
                : `http://localhost:${config.port}`;

            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: `nerve-${plan}-${billingCycle}`,
                            title: `NERVE Health Systems — ${planConfig.name} ${periodLabel}`,
                            description: `Suscripción ${planConfig.name} — ${billingCycle === 'annual' ? '12 meses' : '1 mes'}`,
                            quantity: 1,
                            unit_price: price,
                            currency_id: 'MXN',
                        },
                    ],
                    payer: {
                        email: req.user.email || '',
                    },
                    back_urls: {
                        success: `${baseUrl}/app.html?payment=success&sub=${subscription.id}`,
                        failure: `${baseUrl}/app.html?payment=failure`,
                        pending: `${baseUrl}/app.html?payment=pending&sub=${subscription.id}`,
                    },
                    auto_return: 'approved',
                    notification_url: `${apiBase}/api/payments/webhook`,
                    external_reference: subscription.id,
                    statement_descriptor: 'NERVE Health',
                },
            });

            // Save the preference ID
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { mpPreferenceId: result.id },
            });

            await logAudit(req.user.id, 'CREATE', 'subscription', subscription.id, `Preferencia de pago creada: ${plan} ${billingCycle}`, req.ip);

            res.json({
                preferenceId: result.id,
                initPoint: result.init_point,
                sandboxInitPoint: result.sandbox_init_point,
                subscriptionId: subscription.id,
            });
        } catch (err) {
            console.error('Create preference error:', err);
            res.status(500).json({ error: 'Error al crear preferencia de pago' });
        }
    }
);

// ---- POST /api/payments/webhook ----
// Mercado Pago IPN webhook (no auth — MP calls this directly)
router.post('/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;

        // MP sends different notification types
        if (type === 'payment') {
            const paymentId = data?.id;
            if (!paymentId) return res.sendStatus(200);

            if (!config.mercadoPago.accessToken || config.mercadoPago.accessToken === 'YOUR_MERCADO_PAGO_ACCESS_TOKEN') {
                return res.sendStatus(200);
            }

            const { MercadoPagoConfig, Payment: MPPayment } = require('mercadopago');
            const client = new MercadoPagoConfig({
                accessToken: config.mercadoPago.accessToken,
            });

            const mpPayment = new MPPayment(client);
            const paymentInfo = await mpPayment.get({ id: paymentId });

            if (!paymentInfo) return res.sendStatus(200);

            const subscriptionId = paymentInfo.external_reference;
            if (!subscriptionId) return res.sendStatus(200);

            const subscription = await prisma.subscription.findUnique({
                where: { id: subscriptionId },
                include: { org: true },
            });

            if (!subscription) return res.sendStatus(200);

            // Record the payment
            await prisma.payment.upsert({
                where: { mpPaymentId: String(paymentId) },
                create: {
                    orgId: subscription.orgId,
                    subscriptionId: subscription.id,
                    amount: Math.round((paymentInfo.transaction_amount || 0) * 100),
                    status: paymentInfo.status || 'unknown',
                    mpPaymentId: String(paymentId),
                    mpStatus: paymentInfo.status,
                    mpStatusDetail: paymentInfo.status_detail,
                    description: paymentInfo.description || null,
                },
                update: {
                    status: paymentInfo.status || 'unknown',
                    mpStatus: paymentInfo.status,
                    mpStatusDetail: paymentInfo.status_detail,
                },
            });

            // If payment approved, activate subscription
            if (paymentInfo.status === 'approved') {
                const now = new Date();
                const periodEnd = new Date(now);
                periodEnd.setMonth(periodEnd.getMonth() + (subscription.billingCycle === 'annual' ? 12 : 1));

                const planConfig = PLANS[subscription.plan];

                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        status: 'active',
                        mpPaymentId: String(paymentId),
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                    },
                });

                // Update organization plan and limits
                await prisma.organization.update({
                    where: { id: subscription.orgId },
                    data: {
                        plan: subscription.plan,
                        maxDoctors: planConfig?.maxDoctors || 3,
                        subscriptionExpires: periodEnd,
                        mpSubscriptionId: subscription.id,
                    },
                });

                console.log(`✅ [PAYMENT] Subscription ${subscription.id} activated for org ${subscription.orgId}`);
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.error('Webhook error:', err);
        res.sendStatus(200); // Always return 200 to MP so they stop retrying
    }
});

// ---- GET /api/payments/subscription-status ----
// Get the current subscription status for the org
router.get('/subscription-status',
    authenticate,
    authorize('superadmin', 'org_owner'),
    async (req, res) => {
        try {
            const subscription = await prisma.subscription.findFirst({
                where: {
                    orgId: req.user.orgId,
                    status: { in: ['active', 'pending'] },
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    payments: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        select: {
                            id: true, amount: true, status: true,
                            mpStatus: true, createdAt: true,
                        },
                    },
                },
            });

            if (!subscription) {
                return res.json({ status: 'no_subscription', plan: 'trial' });
            }

            res.json({
                status: subscription.status,
                plan: subscription.plan,
                billingCycle: subscription.billingCycle,
                amount: subscription.amount / 100,
                trialEndsAt: subscription.trialEndsAt,
                currentPeriodEnd: subscription.currentPeriodEnd,
                recentPayments: subscription.payments,
            });
        } catch (err) {
            console.error('Subscription status error:', err);
            res.status(500).json({ error: 'Error al obtener estado de suscripción' });
        }
    }
);

// ---- GET /api/payments/plans ----
// Public endpoint to get plan pricing (no auth required)
router.get('/plans', (req, res) => {
    res.json({
        plans: Object.entries(PLANS).map(([key, plan]) => ({
            id: key,
            name: plan.name,
            monthly: plan.monthly,
            annual: plan.annual,
            maxDoctors: plan.maxDoctors,
        })),
        publicKey: config.mercadoPago.publicKey || null,
    });
});

module.exports = router;
