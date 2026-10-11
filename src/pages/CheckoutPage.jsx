import React, { useEffect, useState } from "react";
import { ShoppingCart, ShieldCheck, Tag, Check, AlertCircle, Lock } from "lucide-react";
import QRCode from "qrcode";
import Input from "../components/common/Input";
import Row from "../components/common/Row";
import EmptyState from "../components/common/EmptyState";
import { money } from "../lib/format";
import { api } from "../services/api";
import { STANDARD_SHIPPING_COST } from "../data/products";

export default function CheckoutPage({ ctx, setAuthModal }) {
  const { cart, products, user, goto, loading, showToast, placeOrder } = ctx;
  const [directUpiId, setDirectUpiId] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [directQr, setDirectQr] = useState(null);
  const [transactionReference, setTransactionReference] = useState("");
  const [directSubmitting, setDirectSubmitting] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address?.address || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
  });

  const items = Object.entries(cart)
    .map(([id, value]) => ({ ...value, product: products.find((product) => product.id === id) }))
    .filter((item) => item.product);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const discount = appliedCoupon?.discount || 0;
  const delivery = STANDARD_SHIPPING_COST;
  const total = Math.max(0, subtotal - discount) + delivery;
  const validItems = items.filter((item) => item.product?.id && Number(item.qty) > 0);

  useEffect(() => {
    api.payments.getConfig()
      .then((config) => {
        if (config?.success) {
          setDirectUpiId(config.directUpiId || null);
        }
      })
      .catch((error) => {
        console.error("Unable to load direct UPI payment configuration:", error);
      });
  }, []);

  function validateAddress() {
    if (!form.name || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
      showToast("Please fill all required delivery address fields", "warn");
      return false;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      showToast("Enter a valid 10-digit mobile number", "warn");
      return false;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      showToast("Enter a valid 6-digit pincode", "warn");
      return false;
    }
    return true;
  }

  async function applyCoupon() {
    if (!coupon.trim()) {
      setCouponMsg("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponMsg("");
    try {
      const response = await api.coupons.validate(coupon.trim(), subtotal);
      if (response.success && response.coupon) {
        setAppliedCoupon(response.coupon);
        setCouponMsg(response.message || `Coupon ${response.coupon.code} applied!`);
      }
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMsg(error.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  }

  function getOrderDraft() {
    return {
      items: validItems.map((item) => ({ id: item.product.id, qty: item.qty, color: item.color })),
      couponCode: appliedCoupon?.code || null,
      shippingMethod: "standard",
      address: form,
    };
  }

  async function showDirectPaymentQr() {
    if (!validateAddress()) return;
    if (validItems.length === 0) {
      showToast("Your cart contains an invalid product. Please refresh and try again.", "warn");
      return;
    }
    if (!directUpiId) {
      showToast("Direct UPI QR payment is not configured yet.", "warn");
      return;
    }

    setPaymentProcessing(true);
    try {
      const quote = await api.payments.getDirectQuote({ orderDraft: getOrderDraft() });
      if (!quote.success || !quote.upiUri) throw new Error(quote.message || "Unable to create the payment QR.");
      const dataUrl = await QRCode.toDataURL(quote.upiUri, { width: 240, margin: 2, errorCorrectionLevel: "M" });
      setDirectQr({ dataUrl, upiUri: quote.upiUri, upiId: quote.upiId, total: quote.total });
      setTransactionReference("");
    } catch (error) {
      showToast(error.message || "Unable to create the payment QR.", "warn");
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function submitDirectPayment() {
    const reference = transactionReference.trim();
    if (!/^[A-Za-z0-9-]{6,64}$/.test(reference)) {
      showToast("Enter the UPI transaction reference shown in your payment app.", "warn");
      return;
    }
    if (!validateAddress() || !directQr) return;

    setDirectSubmitting(true);
    try {
      const result = await api.payments.createDirectOrder({
        orderDraft: getOrderDraft(),
        paymentReference: reference,
        expectedTotal: directQr.total,
      });
      if (!result.success || !result.order || result.order.paymentStatus !== "Pending") {
        throw new Error(result.message || "Unable to submit payment for verification.");
      }
      placeOrder({ directOrder: result.order });
    } catch (error) {
      showToast(error.message || "Unable to submit payment for verification.", "warn");
    } finally {
      setDirectSubmitting(false);
    }
  }

  if (items.length === 0) {
    return <EmptyState icon={<ShoppingCart size={40} />} title="Your cart is empty" sub="Add items before checking out" />;
  }

  return (
    <div className="fade-in checkout-shell" style={{ maxWidth: 1040, margin: "20px auto", padding: "0 16px", display: "flex", gap: 24 }}>
      <div className="checkout-main" style={{ flex: 2, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={20} color="#7C3AED" /> Checkout
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={14} /> Direct UPI payment
          </div>
        </div>

        {!user && (
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "12px 16px", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#9A3412", fontWeight: 500 }}>Log in to auto-fill saved addresses and track orders.</span>
            <button onClick={() => setAuthModal("user")} style={{ background: "#F97316", color: "white", border: "none", padding: "6px 14px", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Login
            </button>
          </div>
        )}

        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 14 }}>Delivery Address</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="checkout-grid">
            <Input label="Full Name*" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} placeholder="Receiver's full name" />
            <Input label="Phone Number*" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value.replace(/\D/g, "") }))} maxLength={10} placeholder="10-digit mobile number" />
            <Input label="Email Address (for invoice)" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} full placeholder="name@example.com" />
            <Input label="House / Flat No., Building & Street Address*" value={form.address} onChange={(value) => setForm((prev) => ({ ...prev, address: value }))} full placeholder="Complete physical address" />
            <Input label="City / Town*" value={form.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} placeholder="City" />
            <Input label="State*" value={form.state} onChange={(value) => setForm((prev) => ({ ...prev, state: value }))} placeholder="State" />
            <Input label="Pincode*" value={form.pincode} onChange={(value) => setForm((prev) => ({ ...prev, pincode: value.replace(/\D/g, "") }))} maxLength={6} placeholder="6-digit postal pincode" />
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 6 }}>Step 1: Pay by UPI QR code</div>
          <div style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 14 }}>Standard shipping {money(delivery)} is included in the total.</div>
          <button
            type="button"
            onClick={showDirectPaymentQr}
            disabled={loading || paymentProcessing || !directUpiId}
            style={{ width: "100%", border: "1px solid #245477", borderRadius: 10, background: directUpiId ? "#245477" : "#9CA3AF", color: "white", padding: "14px 16px", fontWeight: 800, fontSize: 15, cursor: loading || paymentProcessing || !directUpiId ? "not-allowed" : "pointer" }}
          >
            {paymentProcessing ? "Preparing QR…" : `Generate payment QR · ${money(total)}`}
          </button>
          {!directUpiId && <div role="status" style={{ color: "#B91C1C", fontSize: 12, marginTop: 8 }}>Direct UPI QR is unavailable. Please try again later.</div>}
          {directQr && (
            <div style={{ marginTop: 16, border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, textAlign: "center", background: "#F9FAFB" }}>
              <div style={{ fontWeight: 800, color: "#111827" }}>Pay {money(directQr.total)} to BLORA</div>
              <img src={directQr.dataUrl} alt="UPI payment QR code" width="240" height="240" style={{ display: "block", maxWidth: "100%", height: "auto", margin: "12px auto", background: "white", borderRadius: 8 }} />
              <div style={{ fontSize: 13, color: "#374151" }}>UPI ID: <strong>{directQr.upiId}</strong></div>
              <a href={directQr.upiUri} style={{ display: "inline-block", marginTop: 8, color: "#245477", fontWeight: 700, fontSize: 13 }}>Open UPI app on this device</a>
              <div style={{ maxWidth: 400, margin: "16px auto 0", paddingTop: 14, borderTop: "1px solid #E5E7EB", textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 10 }}>Step 2: Enter transaction ID</div>
                <label htmlFor="upi-transaction-reference" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>UPI transaction reference / ID</label>
                <input
                  id="upi-transaction-reference"
                  value={transactionReference}
                  onChange={(event) => setTransactionReference(event.target.value.replace(/[^A-Za-z0-9-]/g, "").slice(0, 64))}
                  placeholder="Enter the reference from your payment app"
                  autoComplete="off"
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid #D1D5DB", borderRadius: 8, padding: "11px 12px", fontSize: 14 }}
                />
                <button
                  type="button"
                  onClick={submitDirectPayment}
                  disabled={loading || directSubmitting}
                  style={{ width: "100%", marginTop: 10, border: "none", borderRadius: 8, background: "#245477", color: "white", padding: "12px 14px", fontWeight: 800, fontSize: 14, cursor: loading || directSubmitting ? "not-allowed" : "pointer" }}
                >
                  {directSubmitting ? "Submitting…" : "Submit order for payment verification"}
                </button>
                <div role="status" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5, color: "#92400E" }}>
                  Direct UPI payments are not verified automatically. Your order will remain Pending until an administrator checks the transaction in the payment account.
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
            <Tag size={16} color="#7C3AED" /> Have a Promo Code?
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={coupon}
              onChange={(event) => setCoupon(event.target.value.toUpperCase())}
              placeholder="Try TRIO50, TRIO10, FLAT100"
              style={{ flex: 1, minWidth: 0, border: "1px solid #D1D5DB", borderRadius: 8, padding: "10px 12px", fontSize: 13, textTransform: "uppercase" }}
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading}
              style={{ background: "#111827", color: "white", border: "none", borderRadius: 8, padding: "0 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              {couponLoading ? "Checking…" : "Apply"}
            </button>
          </div>
          {couponMsg && (
            <div style={{ fontSize: 12.5, marginTop: 8, color: appliedCoupon ? "#16A34A" : "#DC2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {appliedCoupon ? <Check size={14} /> : <AlertCircle size={14} />} {couponMsg}
            </div>
          )}
        </div>
      </div>

      <div className="checkout-summary" style={{ flex: 1, minWidth: 290 }}>
        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB", position: "sticky", top: 90, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#111827" }}>
            Order Summary ({items.length} {items.length === 1 ? "item" : "items"})
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 12 }}>
            {items.map((item) => (
              <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "8px 0", color: "#4B5563", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <img src={item.product.images?.[0]} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130, fontWeight: 600, color: "#111827" }}>{item.product.name}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>Qty: {item.qty} {item.color ? `• ${item.color}` : ""}</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: "#111827" }}>{money(item.product.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed #DDD", margin: "10px 0" }} />
          <Row label="Subtotal" value={money(subtotal)} />
          {discount > 0 && <Row label={`Coupon (${appliedCoupon?.code})`} value={`- ${money(discount)}`} green />}
          <Row label="Standard Shipping" value={money(delivery)} />
          <div style={{ borderTop: "1px dashed #DDD", margin: "10px 0" }} />
          <Row label="Total Amount" value={money(total)} bold />
          <div style={{ marginTop: 16, background: "#F9FAFB", borderRadius: 8, padding: 10, border: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 11.5, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <ShieldCheck size={14} /> Payment Instructions
            </div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>Orders stay Pending until an administrator verifies the UPI transaction ID against the payment received.</div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .checkout-shell { flex-direction: column !important; }
          .checkout-main { order: 2; }
          .checkout-summary { order: 1; width: 100% !important; min-width: 0 !important; }
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
