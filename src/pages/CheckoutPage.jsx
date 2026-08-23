import React, { useState } from "react";
import { ShoppingCart, ShieldCheck, Tag, Check, AlertCircle } from "lucide-react";
import Input from "../components/common/Input";
import Row from "../components/common/Row";
import EmptyState from "../components/common/EmptyState";
import { money } from "../lib/format";
import { api } from "../services/api";

export default function CheckoutPage({ ctx, setAuthModal }) {
  const { cart, products, user, goto, loading, setLoading, showToast } = ctx;
  const paymentUpiId = import.meta.env.VITE_PAYMENT_UPI_ID || "9729794568@fam";
  const [payment, setPayment] = useState("googlepay");
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const items = Object.entries(cart)
    .map(([id, v]) => ({ ...v, product: products.find((p) => p.id === id) }))
    .filter((i) => i.product);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
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

  const paymentOptions = {
    googlepay: { label: "Google Pay", scheme: "tez://upi/pay" },
    phonepe: { label: "PhonePe", scheme: "phonepe://pay" },
    paytm: { label: "Paytm", scheme: "paytmmp://pay" },
    upi: { label: "UPI", scheme: "upi://pay" },
  };

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
      const res = await api.coupons.validate(coupon.trim(), subtotal);
      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponMsg(res.message || `Coupon ${res.coupon.code} applied!`);
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMsg(err.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  }

  const discount = appliedCoupon?.discount || 0;
  const delivery = Math.max(0, subtotal - discount) >= 499 ? 0 : 49;
  const total = Math.max(0, subtotal - discount) + delivery;

  if (items.length === 0) {
    return <EmptyState icon={<ShoppingCart size={40} />} title="Your cart is empty" sub="Add items before checking out" />;
  }

  function handlePayNow() {
    if (!validateAddress()) return;

    const safeTotal = Number(total).toFixed(2);
    const params = new URLSearchParams({
      pa: paymentUpiId,
      pn: "THE TRIO SHOP",
      am: safeTotal,
      cu: "INR",
      tn: `The Trio Shop Order`,
    });

    let url = `${paymentOptions[payment].scheme}?${params.toString()}`;
    if (payment === "googlepay") {
      url = `tez://upi/pay?${params.toString()}`;
    }
    if (payment === "phonepe") {
      url = `phonepe://pay?${params.toString()}`;
    }
    if (payment === "paytm") {
      url = `paytmmp://pay?${params.toString()}`;
    }
    if (payment === "upi") {
      url = `upi://pay?${params.toString()}`;
    }

    window.location.href = url;
    setPaymentVerified(true);
    showToast(`Opening ${paymentOptions[payment].label}. Complete payment and return here.`, "cart");
  }

  function submit() {
    if (!validateAddress()) return;
    if (!paymentVerified) {
      showToast("Please complete the payment using your selected method before placing the order.", "warn");
      return;
    }

    const validItems = items.filter((i) => i.product && i.product.id && Number(i.qty) > 0);
    if (validItems.length === 0) {
      showToast("Your cart contains an invalid product. Please refresh and try again.", "warn");
      return;
    }

    ctx.placeOrder({
      items: validItems.map((i) => ({ id: i.product.id, qty: i.qty, color: i.color })),
      discount,
      couponCode: appliedCoupon?.code || null,
      payment,
      paymentVerified: true,
      upiId: paymentUpiId,
      address: form,
    });
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: "16px auto", padding: "0 14px", display: "flex", gap: 20 }}>
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 14, color: "#111827" }}>Secure Checkout</div>

        {!user && (
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9A3412" }}>👋 Log in to auto-fill saved address and track your order timeline</span>
            <button onClick={() => setAuthModal("user")} style={{ background: "#F97316", color: "white", border: "none", padding: "6px 14px", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Login
            </button>
          </div>
        )}

        {/* Delivery Address Form */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #E5E7EB", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#111827" }}>1. Delivery Address</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="checkout-grid">
            <Input label="Full Name*" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Receiver's name" />
            <Input label="Phone Number*" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v.replace(/\D/g, "") }))} maxLength={10} placeholder="10-digit mobile" />
            <Input label="Email Address (for order updates)" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} full placeholder="name@example.com" />
            <Input label="House No. / Street / Area*" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} full placeholder="Full street address" />
            <Input label="City / Town*" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} placeholder="City" />
            <Input label="State*" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} placeholder="State" />
            <Input label="Pincode*" value={form.pincode} onChange={(v) => setForm((f) => ({ ...f, pincode: v.replace(/\D/g, "") }))} maxLength={6} placeholder="6-digit pincode" />
          </div>
          <button
            type="button"
            onClick={() => {
              if (validateAddress()) setShowPaymentStep(true);
            }}
            style={{ marginTop: 16, width: "100%", border: "none", borderRadius: 8, background: "#111827", color: "white", padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Continue
          </button>
        </div>

        {showPaymentStep && (
          <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #E5E7EB", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#111827" }}>2. Select Payment Method</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(paymentOptions).map(([v, data]) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: payment === v ? "1.5px solid #7C3AED" : "1px solid #E5E7EB", background: payment === v ? "#FAF5FF" : "white", fontSize: 13.5, cursor: "pointer" }}>
                  <input type="radio" name="payment" checked={payment === v} onChange={() => setPayment(v)} />
                  <span style={{ fontWeight: payment === v ? 700 : 500, color: payment === v ? "#6B21A8" : "#374151" }}>{data.label}</span>
                </label>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#374151" }}>Selected payment method</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{paymentOptions[payment].label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", letterSpacing: 0.2 }}>UPI ID: {paymentUpiId}</div>
              <button
                type="button"
                onClick={handlePayNow}
                style={{ width: "100%", border: "none", borderRadius: 8, background: "linear-gradient(90deg,#7C3AED,#DB2777)", color: "white", padding: "10px 0", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
              >
                Pay Now • {money(total)}
              </button>
              {paymentVerified && (
                <div style={{ fontSize: 12.5, color: "#166534", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "7px 10px", width: "100%", textAlign: "center", fontWeight: 700 }}>
                  Payment completed. You can now place the order.
                </div>
              )}
            </div>

            <div style={{ marginTop: 10, fontSize: 12.5, color: "#7C2D12", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>
              Only prepaid orders are accepted. No returns or replacements.
            </div>
          </div>
        )}

        {/* Coupons */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #E5E7EB" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
            <Tag size={16} color="#7C3AED" /> Have a Promo Code?
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Try TRIO50, TRIO10, FLAT100"
              style={{ flex: 1, border: "1px solid #D1D5DB", borderRadius: 8, padding: "10px 12px", fontSize: 13, textTransform: "uppercase" }}
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

      {/* Summary sidebar */}
      <div style={{ flex: 1, minWidth: 280 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #E5E7EB", position: "sticky", top: 90 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#111827" }}>Order Summary ({items.length} items)</div>
          
          <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 10 }}>
            {items.map((i) => (
              <div key={i.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "6px 0", color: "#4B5563", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <img src={i.product.images[0]} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{i.product.name} × {i.qty}</span>
                </div>
                <span style={{ fontWeight: 600, color: "#111827" }}>{money(i.product.price * i.qty)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed #DDD", margin: "10px 0" }} />
          <Row label="Subtotal" value={money(subtotal)} />
          {discount > 0 && <Row label={`Coupon (${appliedCoupon.code})`} value={`- ${money(discount)}`} green />}
          <Row label="Delivery" value={delivery === 0 ? "FREE" : money(delivery)} green={delivery === 0} />
          <div style={{ borderTop: "1px dashed #DDD", margin: "10px 0" }} />
          <Row label="Total Amount" value={money(total)} bold />

          <button
            onClick={submit}
            disabled={loading}
            style={{ marginTop: 16, width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#7C3AED,#DB2777)", color: "white", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Confirming Order…" : `Place Order • ${money(total)}`}
          </button>

          <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 10, display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
            <ShieldCheck size={14} color="#16A34A" /> 100% Safe & Secure Checkout
          </div>
        </div>
      </div>
      <style>{`@media (max-width:820px){ .checkout-grid{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}
