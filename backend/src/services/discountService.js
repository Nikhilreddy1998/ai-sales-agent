/**
 * Deterministic discount management service.
 * Enforces business logic rules that cannot be hallucinated or overridden by the LLM.
 */

export const DISCOUNT_CODES = {
  TECHCHALLENGE10: { code: 'TECHCHALLENGE10', percentage: 10, description: '10% Interview Promo' },
  WELCOME20: { code: 'WELCOME20', percentage: 20, description: '20% Welcome Promo' },
  ENTERPRISE15: { code: 'ENTERPRISE15', percentage: 15, description: '15% Enterprise Tier Promo' },
};

export const VOLUME_TIERS = [
  { minQuantity: 25, discountPercent: 20, label: 'Bulk Tier 3 (25+ units)' },
  { minQuantity: 10, discountPercent: 15, label: 'Bulk Tier 2 (10-24 units)' },
  { minQuantity: 5, discountPercent: 10, label: 'Bulk Tier 1 (5-9 units)' },
];

class DiscountService {
  /**
   * Calculates deterministic pricing, discounts, and final totals.
   * @param {Array<{ price: number, quantity: number }>} items
   * @param {string} [promoCode]
   * @returns {object} Calculated pricing breakdown
   */
  calculateDiscount(items = [], promoCode = '') {
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );

    let highestDiscountPercent = 0;
    const appliedRules = [];

    // 1. Check Volume Tiers
    const volumeMatch = VOLUME_TIERS.find((tier) => totalQuantity >= tier.minQuantity);
    if (volumeMatch) {
      if (volumeMatch.discountPercent > highestDiscountPercent) {
        highestDiscountPercent = volumeMatch.discountPercent;
      }
      appliedRules.push(`${volumeMatch.label}: ${volumeMatch.discountPercent}% off`);
    }

    // 2. Check Promo Code
    if (promoCode) {
      const normalizedCode = promoCode.trim().toUpperCase();
      const promo = DISCOUNT_CODES[normalizedCode];
      if (promo) {
        if (promo.percentage > highestDiscountPercent) {
          highestDiscountPercent = promo.percentage;
        }
        appliedRules.push(`Promo ${promo.code}: ${promo.percentage}% off`);
      } else {
        appliedRules.push(`Invalid Promo Code: ${promoCode}`);
      }
    }

    // Rounding to 2 decimal places for financial accuracy
    const discountAmount = Number(((subtotal * highestDiscountPercent) / 100).toFixed(2));
    const finalPrice = Number(Math.max(0, subtotal - discountAmount).toFixed(2));

    return {
      totalQuantity,
      subtotal: Number(subtotal.toFixed(2)),
      discountPercentage: highestDiscountPercent,
      discountAmount,
      finalPrice,
      appliedRules,
    };
  }
}

export const discountService = new DiscountService();
