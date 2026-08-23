// Small formatting/utility helpers shared across the app.

export const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
export const pctOff = (price, mrp) => Math.round(((mrp - price) / mrp) * 100);
export const uid = () => Math.random().toString(36).slice(2, 10);
