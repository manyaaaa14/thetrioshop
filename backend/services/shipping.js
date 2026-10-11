export const STANDARD_SHIPPING_METHOD = "standard";
export const STANDARD_SHIPPING_COST = 100;

export function getStandardShipping(method) {
  if (method !== STANDARD_SHIPPING_METHOD) {
    throw new Error("Only standard shipping is available.");
  }
  return {
    shippingMethod: STANDARD_SHIPPING_METHOD,
    delivery: STANDARD_SHIPPING_COST,
  };
}
