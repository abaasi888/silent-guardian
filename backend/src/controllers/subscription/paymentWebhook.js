const paymentWebhook = (req, res) => { console.log('Webhook received:', req.body.type); res.json({ received: true }); };
module.exports = paymentWebhook;
