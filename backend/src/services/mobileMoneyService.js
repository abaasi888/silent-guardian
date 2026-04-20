const mockMobileMoneyAPI = async (amount, phone, provider) => new Promise(resolve => setTimeout(() => resolve({ success: true, reference: `MM_${Date.now()}` }), 500));
module.exports = { mockMobileMoneyAPI };
