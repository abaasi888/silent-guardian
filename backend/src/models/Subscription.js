const mongoose = require('mongoose');
const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: String, required: true }, status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'pending' },
  startDate: { type: Date, default: Date.now }, endDate: Date, autoRenew: { type: Boolean, default: true }, paymentMethodId: String, lastPaymentId: String
});
subscriptionSchema.index({ userId: 1 });
module.exports = mongoose.model('Subscription', subscriptionSchema);
