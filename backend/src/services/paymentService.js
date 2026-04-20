const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const processStripePayment = async (amount, paymentMethodId, email) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency: 'usd', payment_method: paymentMethodId, confirm: true, receipt_email: email });
    return { success: true, transactionId: paymentIntent.id };
  } catch (err) { return { success: false, error: err.message }; }
};
const processMobileMoney = async (amount, phoneNumber, provider) => {
  console.log(`Processing ${provider} payment of ${amount} to ${phoneNumber}`);
  return { success: true, transactionId: 'MM' + Date.now() };
};
module.exports = { processStripePayment, processMobileMoney };
