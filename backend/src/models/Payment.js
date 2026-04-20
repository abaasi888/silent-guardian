const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, subscriptionId: mongoose.Schema.Types.ObjectId,
  amount: Number, currency: String, method: { type: String, enum: ['stripe', 'mobile_money', 'card'] },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' }, transactionId: String, metadata: mongoose.Schema.Types.Mixed, createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Payment', paymentSchema);
