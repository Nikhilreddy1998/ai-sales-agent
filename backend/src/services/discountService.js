import { randomUUID } from 'crypto';
import { catalogService } from './catalogService.js';

/**
 * Deterministic discount management service enforcing mandatory interview progression:
 * - Initial price: 0%, promo_code: null
 * - First price objection: SAVE10, 10%
 * - Second price objection: CLOSENOW15, 15%
 * - Never exceed 15%
 */

export const DISCOUNT_PROGRESSION = [
  { level: 0, promoCode: null, discountPercent: 0, label: 'Initial Quotation (0% discount)' },
  { level: 1, promoCode: 'SAVE10', discountPercent: 10, label: 'First Objection Discount (10% off)' },
  { level: 2, promoCode: 'CLOSENOW15', discountPercent: 15, label: 'Closing Discount (15% off)' },
];

export const VALID_PROMO_CODES = {
  SAVE10: { code: 'SAVE10', percentage: 10, minLevel: 1 },
  CLOSENOW15: { code: 'CLOSENOW15', percentage: 15, minLevel: 2 },
};

class DiscountService {
  /**
   * Resolves deterministic discount based on objection count and/or promo code.
   * Strict invariant: Never exceed 15%.
   *
   * @param {number} objectionCount - Number of price objections registered (0, 1, 2+)
   * @param {string} [promoCode] - Optional explicitly entered promo code
   * @returns {{ discountPercent: number, promoCode: string | null, label: string }}
   */
  resolveDiscount(objectionCount = 0, promoCode = '') {
    const level = Math.min(2, Math.max(0, Number(objectionCount) || 0));
    let progressionRule = DISCOUNT_PROGRESSION[level];

    // If customer supplies a valid promo code matching their progression level
    if (promoCode) {
      const normalizedCode = promoCode.trim().toUpperCase();
      const matchedPromo = VALID_PROMO_CODES[normalizedCode];
      if (matchedPromo) {
        // Enforce progression: promo code percentage capped at 15%
        const effectivePercent = Math.min(15, matchedPromo.percentage);
        return {
          discountPercent: effectivePercent,
          promoCode: matchedPromo.code,
          label: `Applied Promo: ${matchedPromo.code} (${effectivePercent}% off)`,
        };
      }
    }

    return {
      discountPercent: progressionRule.discountPercent,
      promoCode: progressionRule.promoCode,
      label: progressionRule.label,
    };
  }

  /**
   * Calculates an authoritative quotation for a product, tier, and required capacity.
   * Uses Math.ceil(requiredCapacity / max_capacity_per_unit).
   *
   * @param {object} params
   * @param {string} params.sku - Target product SKU (e.g., 'SKU_AIRPODS_PRO2')
   * @param {'STD' | 'CARE' | 'PRO'} [params.tier='STD'] - Pricing tier
   * @param {number} params.requiredCapacity - Total capacity units needed by customer
   * @param {number} [params.objectionCount=0] - Current objection counter (0, 1, 2)
   * @param {string} [params.promoCode=''] - Optional promo code
   * @returns {object} Authoritative Quotation
   */
  calculateQuotation({ sku, tier = 'STD', requiredCapacity = 1, objectionCount = 0, promoCode = '' }) {
    const product = catalogService.getProductBySku(sku);
    if (!product) {
      throw new Error(`Product SKU "${sku}" was not found in catalog.`);
    }

    // Validate tier
    const validTiers = Object.keys(product.pricing);
    const selectedTier = validTiers.includes(tier?.toUpperCase()) ? tier.toUpperCase() : 'STD';
    const unitPrice = product.pricing[selectedTier];

    // Calculate required units: Math.ceil(requiredCapacity / max_capacity_per_unit)
    const { units, capacityPerUnit, requiredCapacity: sanitizedCap } = catalogService.calculateUnits(
      product.sku,
      requiredCapacity
    );

    const subtotal = Number((units * unitPrice).toFixed(2));

    // Resolve deterministic discount progression
    const discountInfo = this.resolveDiscount(objectionCount, promoCode);
    const discountAmount = Number(((subtotal * discountInfo.discountPercent) / 100).toFixed(2));
    const finalPrice = Number(Math.max(0, subtotal - discountAmount).toFixed(2));

    const quotationId = `QTE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return {
      quotationId,
      sku: product.sku,
      productName: product.name,
      tier: selectedTier,
      unitPrice,
      requiredCapacity: sanitizedCap,
      capacityPerUnit,
      units,
      formula: `Math.ceil(${sanitizedCap} / ${capacityPerUnit}) = ${units} units`,
      subtotal,
      discountPercent: discountInfo.discountPercent,
      discountAmount,
      promoCode: discountInfo.promoCode,
      discountLabel: discountInfo.label,
      finalPrice,
      objectionLevel: Math.min(2, Math.max(0, Number(objectionCount) || 0)),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Backward-compatible helper for arbitrary items calculation.
   */
  calculateDiscount(items = [], promoCode = '') {
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );

    let discountPercent = 0;
    let code = null;

    if (promoCode) {
      const normalized = promoCode.trim().toUpperCase();
      if (VALID_PROMO_CODES[normalized]) {
        discountPercent = VALID_PROMO_CODES[normalized].percentage;
        code = VALID_PROMO_CODES[normalized].code;
      }
    }

    // Strict ceiling: never exceed 15%
    discountPercent = Math.min(15, discountPercent);
    const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
    const finalPrice = Number(Math.max(0, subtotal - discountAmount).toFixed(2));

    return {
      totalQuantity,
      subtotal: Number(subtotal.toFixed(2)),
      discountPercentage: discountPercent,
      discountAmount,
      finalPrice,
      appliedRules: discountPercent > 0 ? [`${code}: ${discountPercent}% off`] : ['Standard Rate (0%)'],
    };
  }
}

export const discountService = new DiscountService();
