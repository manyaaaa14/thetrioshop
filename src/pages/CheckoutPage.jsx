import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, ShieldCheck, Tag, Check, AlertCircle, 
  CreditCard, Smartphone, Copy, ExternalLink, 
  CheckCircle2, Info, ArrowRight, Lock
} from "lucide-react";
import Input from "../components/common/Input";
import Row from "../components/common/Row";
import EmptyState from "../components/common/EmptyState";
import { money } from "../lib/format";
import { api } from "../services/api";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage({ ctx, setAuthModal }) {
  const { cart, products, user, goto, loading, setLoading, showToast, placeOrder } = ctx;
  
  const [paymentMode, setPaymentMode] = useState("razorpay"); // 'razorpay' | 'direct_upi'
  const [selectedUpiApp, setSelectedUpiApp] = useState("googlepay"); // 'googlepay' | 'phonepe' | 'paytm' | 'bhim' | 'qr'
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({
    razorpayKeyId: null,
    isRazorpayConfigured: false,
    paymentUpiId: "9729794568@fam",
  });
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [razorpayProcessing, setRazorpayProcessing] = useState(false);

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

  useEffect(() => {
    // Load dynamic payment config
    api.payments.getConfig()
      .then((cfg) => {
        if (cfg && cfg.success) {
          setPaymentConfig({
            razorpayKeyId: cfg.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || null,
            isRazorpayConfigured: cfg.isRazorpayConfigured || Boolean(cfg.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID),
            paymentUpiId: cfg.paymentUpiId || import.meta.env.VITE_PAYMENT_UPI_ID || "9729794568@fam",
          });
        }
      })
      .catch(() => {
        setPaymentConfig({
          razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || null,
          isRazorpayConfigured: Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID),
          paymentUpiId: import.meta.env.VITE_PAYMENT_UPI_ID || "9729794568@fam",
        });
      });
  }, []);

  const upiAppOptions = {
    googlepay: { 
      id: "googlepay", 
      label: "Google Pay", 
      color: "#EA4335",
      badge: "GPay", 
      scheme: "tez://upi/pay" 
    },
    phonepe: { 
      id: "phonepe", 
      label: "PhonePe", 
      color: "#5F259F",
      badge: "PhonePe", 
      scheme: "phonepe://pay" 
    },
    paytm: { 
      id: "paytm", 
      label: "Paytm", 
      color: "#00BAF2",
      badge: "Paytm", 
      scheme: "paytmmp://pay" 
    },
    bhim: { 
      id: "bhim", 
      label: "BHIM / Other UPI", 
      color: "#00796B",
      badge: "UPI", 
      scheme: "upi://pay" 
    },
    qr: { 
      id: "qr", 
      label: "Scan QR Code", 
      color: "#7C3AED",
      badge: "QR", 
      scheme: "upi://pay" 
    },
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

  const safeTotal = Number(total).toFixed(2);
  const upiParams = new URLSearchParams({
    pa: paymentConfig.paymentUpiId,
    pn: "THE TRIO SHOP",
    am: safeTotal,
    cu: "INR",
    tn: `Order Payment TRIO SHOP`,
  });
  const genericUpiUri = `upi://pay?${upiParams.toString()}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(genericUpiUri)}`;

  function handleOpenUpiApp() {
    if (!validateAddress()) return;

    const opt = upiAppOptions[selectedUpiApp] || upiAppOptions.bhim;
    let url = `${opt.scheme}?${upiParams.toString()}`;
    window.location.href = url;
    showToast(`Opening ${opt.label}. Complete the payment and enter your 12-digit UTR below.`, "cart");
  }

  function handleCopyUpi() {
    navigator.clipboard.writeText(paymentConfig.paymentUpiId);
    setCopiedUpi(true);
    showToast("UPI ID copied to clipboard!", "check");
    setTimeout(() => setCopiedUpi(false), 3000);
  }

  // Handle Razorpay Online Gateway Checkout
  async function handleRazorpayPayment() {
    if (!validateAddress()) return;

    const validItems = items.filter((i) => i.product && i.product.id && Number(i.qty) > 0);
    if (validItems.length === 0) {
      showToast("Your cart contains an invalid product. Please refresh and try again.", "warn");
      return;
    }

    setRazorpayProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay payment gateway. Please check your internet connection or use Direct UPI.");
      }

      // Create order draft payload
      const orderDraft = {
        items: validItems.map((i) => ({ id: i.product.id, qty: i.qty, color: i.color })),
        discount,
        couponCode: appliedCoupon?.code || null,
        address: form,
      };

      // Call backend to create Razorpay Order
      const res = await api.payments.createOrder({
        amount: total,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      if (!res.success || !res.order) {
        throw new Error(res.message || "Failed to initiate Razorpay payment");
      }

      const razorpayKey = res.keyId || paymentConfig.razorpayKeyId || "rzp_test_placeholder";

      const rzpOptions = {
        key: razorpayKey,
        amount: res.order.amount,
        currency: res.order.currency || "INR",
        name: "THE TRIO SHOP",
        description: `Order Payment (${items.length} items)`,
        image: "https://thetrioshopp.onrender.com/favicon.ico",
        order_id: res.order.id,
        prefill: {
          name: form.name,
          email: form.email || (user ? user.email : ""),
          contact: form.phone,
        },
        theme: {
          color: "#7C3AED",
        },
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyRes = await api.payments.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderDraft,
            });

            if (verifyRes.success && verifyRes.order) {
              placeOrder({ directOrder: verifyRes.order });
            } else {
              throw new Error(verifyRes.message || "Payment verification failed on server.");
            }
          } catch (vErr) {
            showToast(vErr.message || "Payment verification failed", "warn");
          } finally {
            setLoading(false);
            setRazorpayProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRazorpayProcessing(false);
            showToast("Payment window closed", "warn");
          },
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on("payment.failed", function (resp) {
        setRazorpayProcessing(false);
        showToast(resp.error?.description || "Payment failed. Please try again.", "warn");
      });
      rzp.open();
    } catch (err) {
      setRazorpayProcessing(false);
      showToast(err.message || "Razorpay initialization error. You can also use Direct UPI payment below.", "warn");
    }
  }

  // Handle Direct UPI Order Submission with UTR
  function submitDirectUpiOrder() {
    if (!validateAddress()) return;

    const cleanedUtr = utrNumber.trim();
    if (!cleanedUtr) {
      showToast("Please enter the 12-digit UTR / UPI Transaction Reference ID after making payment.", "warn");
      return;
    }

    if (!/^[A-Za-z0-9]{8,25}$/.test(cleanedUtr)) {
      showToast("Please enter a valid 8 to 25 digit UTR / Transaction ID from your payment app.", "warn");
      return;
    }

    const validItems = items.filter((i) => i.product && i.product.id && Number(i.qty) > 0);
    if (validItems.length === 0) {
      showToast("Your cart contains an invalid product. Please refresh and try again.", "warn");
      return;
    }

    placeOrder({
      items: validItems.map((i) => ({ id: i.product.id, qty: i.qty, color: i.color })),
      discount,
      couponCode: appliedCoupon?.code || null,
      payment: selectedUpiApp,
      paymentVerified: true,
      utr: cleanedUtr,
      upiId: paymentConfig.paymentUpiId,
      address: form,
    });
  }

  return (
    <div className="fade-in checkout-shell" style={{ maxWidth: 1040, margin: "20px auto", padding: "0 16px", display: "flex", gap: 24 }}>
      <div className="checkout-main" style={{ flex: 2, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={20} color="#7C3AED" /> Secure Checkout
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={14} /> 256-Bit SSL Encrypted
          </div>
        </div>

        {!user && (
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "12px 16px", fontSize: 13, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9A3412", fontWeight: 500 }}>👋 Log in to auto-fill saved addresses and track orders in your account</span>
            <button onClick={() => setAuthModal("user")} style={{ background: "#F97316", color: "white", border: "none", padding: "6px 14px", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Login
            </button>
          </div>
        )}

        {/* 1. Delivery Address Form */}
        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#7C3AED", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>1</span>
              Delivery Address
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="checkout-grid">
            <Input label="Full Name*" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Receiver's full name" />
            <Input label="Phone Number*" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v.replace(/\D/g, "") }))} maxLength={10} placeholder="10-digit mobile number" />
            <Input label="Email Address (for invoice & tracking updates)" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} full placeholder="name@example.com" />
            <Input label="House / Flat No., Building & Street Address*" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} full placeholder="Complete physical address" />
            <Input label="City / Town*" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} placeholder="City" />
            <Input label="State*" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} placeholder="State" />
            <Input label="Pincode*" value={form.pincode} onChange={(v) => setForm((f) => ({ ...f, pincode: v.replace(/\D/g, "") }))} maxLength={6} placeholder="6-digit postal pincode" />
          </div>

          {!showPaymentStep && (
            <button
              type="button"
              onClick={() => {
                if (validateAddress()) setShowPaymentStep(true);
              }}
              style={{ marginTop: 18, width: "100%", border: "none", borderRadius: 10, background: "#111827", color: "white", padding: "12px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              Proceed to Payment <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* 2. Payment Method Section */}
        {showPaymentStep && (
          <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#7C3AED", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>2</span>
                Choose Payment Method
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {/* Option 1: Razorpay */}
              <div
                onClick={() => setPaymentMode("razorpay")}
                style={{
                  border: paymentMode === "razorpay" ? "2px solid #7C3AED" : "1.5px solid #E5E7EB",
                  background: paymentMode === "razorpay" ? "#FAF5FF" : "white",
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "#7C3AED", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: paymentMode === "razorpay" ? "#6B21A8" : "#111827" }}>
                        Online Gateway
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7280" }}>Cards, UPI, NetBanking</div>
                    </div>
                  </div>
                  <input type="radio" checked={paymentMode === "razorpay"} onChange={() => setPaymentMode("razorpay")} />
                </div>
                <div style={{ marginTop: 6, display: "inline-block", background: "#ECFDF5", color: "#047857", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                  ⚡ Instant Auto-Confirm
                </div>
              </div>

              {/* Option 2: Direct UPI / QR */}
              <div
                onClick={() => setPaymentMode("direct_upi")}
                style={{
                  border: paymentMode === "direct_upi" ? "2px solid #7C3AED" : "1.5px solid #E5E7EB",
                  background: paymentMode === "direct_upi" ? "#FAF5FF" : "white",
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "#059669", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: paymentMode === "direct_upi" ? "#065F46" : "#111827" }}>
                        Direct UPI / QR
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7280" }}>GPay, PhonePe, Paytm, QR</div>
                    </div>
                  </div>
                  <input type="radio" checked={paymentMode === "direct_upi"} onChange={() => setPaymentMode("direct_upi")} />
                </div>
                <div style={{ marginTop: 6, display: "inline-block", background: "#EFF6FF", color: "#1D4ED8", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                  📲 0% Transaction Fees
                </div>
              </div>
            </div>

            {/* TAB CONTENT 1: RAZORPAY GATEWAY */}
            {paymentMode === "razorpay" && (
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <CreditCard size={18} color="#7C3AED" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Razorpay Payment Gateway</span>
                </div>
                
                <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5, marginBottom: 16 }}>
                  Pay securely using any <strong>Credit / Debit Card (Visa, Mastercard, RuPay), NetBanking (SBI, HDFC, ICICI, etc.), UPI (Google Pay, PhonePe), or Digital Wallets</strong>. Your order is confirmed instantly!
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                  {["Visa", "Mastercard", "RuPay", "Google Pay", "PhonePe", "Paytm UPI", "50+ NetBanking"].map((badge) => (
                    <span key={badge} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, color: "#374151" }}>
                      ✓ {badge}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={razorpayProcessing || loading}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 10,
                    background: "linear-gradient(90deg, #7C3AED, #DB2777)",
                    color: "white",
                    padding: "14px 0",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: razorpayProcessing || loading ? "wait" : "pointer",
                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Lock size={16} />
                  {razorpayProcessing ? "Opening Gateway…" : `Pay Securely • ${money(total)}`}
                </button>
              </div>
            )}

            {/* TAB CONTENT 2: DIRECT UPI & QR CODE */}
            {paymentMode === "direct_upi" && (
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 12 }}>
                  Step 1: Choose UPI App or Scan QR
                </div>

                {/* UPI App Selection Chips */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 16 }}>
                  {Object.values(upiAppOptions).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id)}
                      style={{
                        padding: "10px 8px",
                        borderRadius: 8,
                        border: selectedUpiApp === app.id ? `2px solid ${app.color}` : "1px solid #D1D5DB",
                        background: selectedUpiApp === app.id ? "#FFFFFF" : "#F3F4F6",
                        color: selectedUpiApp === app.id ? app.color : "#374151",
                        fontWeight: selectedUpiApp === app.id ? 700 : 500,
                        fontSize: 12.5,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>{app.label}</span>
                    </button>
                  ))}
                </div>

                {/* QR Code & Pay via App Box */}
                <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 4 }}>
                    Scan QR to Pay {money(total)}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>
                    Open any UPI App on your phone and scan the QR code below
                  </div>

                  <div style={{ background: "white", padding: 8, borderRadius: 12, border: "2px solid #7C3AED", marginBottom: 12, display: "inline-block" }}>
                    <img 
                      src={qrCodeUrl} 
                      alt="Payment QR Code" 
                      style={{ width: 170, height: 170, display: "block" }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/payment-qr.jpe";
                      }}
                    />
                  </div>

                  {/* Merchant UPI ID Copy Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F3F4F6", padding: "6px 12px", borderRadius: 8, maxWidth: "100%", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "#4B5563" }}>UPI ID:</span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: "#111827", fontFamily: "monospace" }}>{paymentConfig.paymentUpiId}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      style={{ border: "none", background: "none", color: "#7C3AED", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                    >
                      {copiedUpi ? <Check size={14} color="#16A34A" /> : <Copy size={14} />} {copiedUpi ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {/* Open in Mobile App button */}
                  <button
                    type="button"
                    onClick={handleOpenUpiApp}
                    style={{
                      width: "100%",
                      maxWidth: 320,
                      border: "none",
                      borderRadius: 8,
                      background: upiAppOptions[selectedUpiApp]?.color || "#7C3AED",
                      color: "white",
                      padding: "10px 16px",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <ExternalLink size={15} /> Pay with {upiAppOptions[selectedUpiApp]?.label || "UPI App"}
                  </button>
                </div>

                {/* Step 2: UTR Number Input */}
                <div style={{ background: "#FAF5FF", border: "1.5px solid #D8B4FE", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#581C87", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={16} color="#7C3AED" /> Step 2: Enter UPI Transaction ID / UTR Number*
                  </div>
                  <p style={{ fontSize: 12, color: "#6B21A8", lineHeight: 1.4, marginBottom: 10 }}>
                    After paying in your UPI app, enter the <strong>12-digit UPI Reference Number / UTR / Transaction ID</strong> shown on your payment receipt:
                  </p>

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
                      placeholder="e.g. 423589123456"
                      maxLength={25}
                      style={{
                        flex: 1,
                        border: "1.5px solid #C084FC",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        background: "white",
                      }}
                    />
                  </div>
                  {utrNumber && utrNumber.length >= 8 && (
                    <div style={{ fontSize: 11.5, color: "#166534", marginTop: 6, fontWeight: 600 }}>
                      ✓ Valid transaction reference entered. Click "Place Order" below to confirm.
                    </div>
                  )}
                </div>

                {/* Submit Order button for Direct UPI */}
                <button
                  type="button"
                  onClick={submitDirectUpiOrder}
                  disabled={loading || !utrNumber.trim()}
                  style={{
                    marginTop: 16,
                    width: "100%",
                    border: "none",
                    borderRadius: 10,
                    background: utrNumber.trim() ? "linear-gradient(90deg, #7C3AED, #DB2777)" : "#9CA3AF",
                    color: "white",
                    padding: "14px 0",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: utrNumber.trim() && !loading ? "pointer" : "not-allowed",
                    boxShadow: utrNumber.trim() ? "0 4px 12px rgba(124, 58, 237, 0.25)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ShieldCheck size={18} />
                  {loading ? "Confirming Order…" : `Confirm Order with UTR • ${money(total)}`}
                </button>
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 12, color: "#7C2D12", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <Info size={14} color="#C2410C" /> Only prepaid orders are accepted. Orders are processed immediately upon confirmation.
            </div>
          </div>
        )}

        {/* 3. Promo Codes */}
        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
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
      <div className="checkout-summary" style={{ flex: 1, minWidth: 290 }}>
        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB", position: "sticky", top: 90, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#111827" }}>
            Order Summary ({items.length} {items.length === 1 ? "item" : "items"})
          </div>
          
          <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 12 }}>
            {items.map((i) => (
              <div key={i.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "8px 0", color: "#4B5563", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <img src={i.product.images?.[0]} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130, fontWeight: 600, color: "#111827" }}>{i.product.name}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>Qty: {i.qty} {i.color ? `• ${i.color}` : ""}</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: "#111827" }}>{money(i.product.price * i.qty)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed #DDD", margin: "10px 0" }} />
          <Row label="Subtotal" value={money(subtotal)} />
          {discount > 0 && <Row label={`Coupon (${appliedCoupon?.code})`} value={`- ${money(discount)}`} green />}
          <Row label="Delivery Charges" value={delivery === 0 ? "FREE" : money(delivery)} green={delivery === 0} />
          {delivery > 0 && (
            <div style={{ fontSize: 11, color: "#7C3AED", marginTop: 2, marginBottom: 6 }}>
              💡 Add {money(499 - (subtotal - discount))} more for Free Delivery
            </div>
          )}
          <div style={{ borderTop: "1px dashed #DDD", margin: "10px 0" }} />
          <Row label="Total Amount" value={money(total)} bold />

          <div style={{ marginTop: 16, background: "#F9FAFB", borderRadius: 8, padding: 10, border: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 11.5, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <ShieldCheck size={14} /> 100% Payment Protection
            </div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>
              Prepaid orders enjoy priority dispatch & tracking updates via SMS / Email.
            </div>
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
