import React, { useEffect } from "react";
import { Check, Package, ArrowRight, ShoppingBag } from "lucide-react";
import Row from "../components/common/Row";
import EmptyState from "../components/common/EmptyState";
import { money } from "../lib/format";
import confetti from "canvas-confetti";

export default function ConfirmationPage({ ctx }) {
  const { view, orders, goto } = ctx;
  const order = orders.find((o) => o.id === view.orderId) || view.order;

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#7C3AED", "#EC4899", "#10B981", "#F59E0B", "#3B82F6"],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  if (!order) return <EmptyState icon={<Package size={38} />} title="Order not found" sub="Check your order ID in My Orders" />;

  return (
    <div className="fade-in" style={{ maxWidth: 580, margin: "36px auto", padding: "0 14px", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 20px rgba(22,163,74,.2)" }}>
        <Check size={42} color="#16A34A" strokeWidth={3} />
      </div>
      
      <div style={{ fontWeight: 800, fontSize: 24, color: "#111827" }}>Order Placed Successfully! 🎉</div>
      <div style={{ fontSize: 13.5, color: "#6B7280", marginTop: 4 }}>
        Thank you for shopping with <strong>THE TRIO SHOP</strong>. We're preparing your package for dispatch!
      </div>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: 20, marginTop: 22, textAlign: "left", boxShadow: "0 2px 6px rgba(0,0,0,.02)" }}>
        <Row label="Order Reference" value={`#${order.id}`} bold />
        <Row label="Products Ordered" value={`${order.items?.length || 1} item(s)`} />
        <Row label="Total Paid" value={money(order.total)} />
        <Row label="Delivery Address" value={`${order.address?.city}, ${order.address?.state} - ${order.address?.pincode}`} />
        <Row label="Current Status" value={order.status || "Confirmed"} green />
        <Row label="Payment Mode" value={order.payment === "cod" ? "Cash on Delivery" : "Prepaid (Online)"} />
        <Row label="Payment Status" value={order.paymentStatus || "Paid"} green />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 22, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => goto("shop")}
          style={{ border: "2px solid #7C3AED", background: "white", color: "#7C3AED", padding: "11px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <ShoppingBag size={16} /> Continue Shopping
        </button>
        <button
          onClick={() => goto("orderdetail", { orderId: order.id })}
          style={{ border: "none", background: "linear-gradient(90deg,#7C3AED,#DB2777)", color: "white", padding: "11px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(124,58,237,.3)" }}
        >
          Track My Order <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
