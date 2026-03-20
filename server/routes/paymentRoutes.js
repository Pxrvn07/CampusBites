const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();

// ── Initialize Razorpay instance conditionally ──────────────────────────────

const RAZORPAY_ENABLED =
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== 'rzp_test_YOUR_KEY_ID_HERE' &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== 'YOUR_KEY_SECRET_HERE';

const razorpay = RAZORPAY_ENABLED ? new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

// ── POST /api/payment/create-order ───────────────────────────────────────────
// Creates a Razorpay order (required before launching the checkout SDK)
router.post('/create-order', async (req, res) => {
    if (!RAZORPAY_ENABLED) {
        return res.status(503).json({
            message: 'Razorpay is not configured. Please add your API keys to .env',
            configured: false,
        });
    }

    try {
        const { amount } = req.body; // amount in rupees

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Razorpay expects paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: { source: 'CampusBites' },
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            configured: true,
        });
    } catch (err) {
        console.error('Razorpay create order error:', err);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
});

// ── POST /api/payment/verify ─────────────────────────────────────────────────
// Verifies the HMAC signature that Razorpay sends after payment
router.post('/verify', (req, res) => {
    if (!RAZORPAY_ENABLED) {
        // In mock mode, treat every verify call as success
        return res.json({ verified: true, mock: true });
    }

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment verification fields', verified: false });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment signature mismatch — possible tampering', verified: false });
        }

        res.json({ verified: true, paymentId: razorpay_payment_id });
    } catch (err) {
        console.error('Razorpay verify error:', err);
        res.status(500).json({ message: 'Verification failed', verified: false });
    }
});

// ── GET /api/payment/config ──────────────────────────────────────────────────
// Returns public config (key, UPI ID) to the frontend
router.get('/config', (req, res) => {
    res.json({
        configured: !!RAZORPAY_ENABLED,
        keyId: RAZORPAY_ENABLED ? process.env.RAZORPAY_KEY_ID : null,
        upiId: process.env.CANTEEN_UPI_ID || 'campusbites@okaxis',
        canteenName: process.env.CANTEEN_NAME || 'CampusBites Canteen',
    });
});

module.exports = router;
