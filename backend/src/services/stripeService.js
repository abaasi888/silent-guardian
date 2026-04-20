const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const createCustomer = async (email) => await stripe.customers.create({ email });
const createSubscription = async (customerId, priceId) => await stripe.subscriptions.create({ customer: customerId, items: [{ price: priceId }] });
module.exports = { createCustomer, createSubscription };
