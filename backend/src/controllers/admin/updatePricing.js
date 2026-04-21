/**
 * Update subscription pricing (Admin only)
 * PUT /api/v1/admin/pricing
 * 
 * Updates pricing in memory and optionally syncs with Stripe
 */

const { SUBSCRIPTION_PLANS } = require('../../config/constants');
const logger = require('../../config/logger');

// In-memory cache for pricing (could be stored in Redis or DB for persistence)
let currentPricing = { ...SUBSCRIPTION_PLANS };

const updatePricing = async (req, res) => {
  try {
    const { basic, premium, family } = req.body;
    
    // Validate input
    const updates = {};
    const errors = [];

    if (basic !== undefined) {
      if (typeof basic !== 'number' || basic < 0.5 || basic > 999.99) {
        errors.push('Basic plan price must be between 0.50 and 999.99 USD');
      } else {
        updates.basic = basic;
      }
    }

    if (premium !== undefined) {
      if (typeof premium !== 'number' || premium < 0.5 || premium > 999.99) {
        errors.push('Premium plan price must be between 0.50 and 999.99 USD');
      } else {
        updates.premium = premium;
      }
    }

    if (family !== undefined) {
      if (typeof family !== 'number' || family < 0.5 || family > 999.99) {
        errors.push('Family plan price must be between 0.50 and 999.99 USD');
      } else {
        updates.family = family;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    // Apply updates to in-memory pricing
    if (updates.basic) currentPricing.BASIC.price = updates.basic;
    if (updates.premium) currentPricing.PREMIUM.price = updates.premium;
    if (updates.family) currentPricing.FAMILY.price = updates.family;

    // In production, also update Stripe products/prices
    // await updateStripePrices(updates);

    // Optionally persist to database or Redis
    // await PricingModel.findOneAndUpdate({}, { pricing: currentPricing }, { upsert: true });

    logger.info(`Admin ${req.user._id} updated pricing: ${JSON.stringify(updates)}`);

    res.json({
      message: 'Pricing updated successfully',
      pricing: {
        basic: currentPricing.BASIC.price,
        premium: currentPricing.PREMIUM.price,
        family: currentPricing.FAMILY.price,
        currency: 'USD'
      },
      updatedFields: Object.keys(updates)
    });
  } catch (error) {
    logger.error(`Error in updatePricing: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to update pricing' });
  }
};

// Helper to get current pricing (can be used by other controllers)
const getCurrentPricing = () => {
  return {
    basic: currentPricing.BASIC.price,
    premium: currentPricing.PREMIUM.price,
    family: currentPricing.FAMILY.price,
    currency: 'USD'
  };
};

module.exports = updatePricing;
module.exports.getCurrentPricing = getCurrentPricing;