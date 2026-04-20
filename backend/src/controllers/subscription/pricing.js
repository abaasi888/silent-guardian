const pricing = (req, res) => { res.json({ basic: 9.99, premium: 19.99, family: 39.99, currency: 'USD' }); };
module.exports = pricing;
