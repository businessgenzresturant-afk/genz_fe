/** Cart / item total (₹) at or above which delivery is free. */
export const FREE_DELIVERY_THRESHOLD = 300;

/** Delivery fee (₹) when below FREE_DELIVERY_THRESHOLD. */
export const DELIVERY_FEE = 50;

/**
 * @param {'delivery' | 'takeaway'} orderType
 * @param {number} orderValueForThreshold - Subtotal or post-discount amount used for the free-delivery rule
 */
export function getDeliveryCharge(orderType, orderValueForThreshold) {
  if (orderType !== 'delivery') return 0;
  if (orderValueForThreshold <= 0) return 0;
  return orderValueForThreshold < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
}
