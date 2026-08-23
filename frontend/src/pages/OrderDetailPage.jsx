import React, { useState } from "react";
import { Package, Check, ArrowLeft, XCircle, AlertTriangle, Truck, Clock } from "lucide-react";
import { money } from "../lib/format";
import { STATUS_FLOW } from "../lib/constants";
import EmptyState from "../components/common/EmptyState";
import StatusPill from "../components/common/StatusPill";
import Row from "../components/common/Row";

export default function OrderDetailPage({ ctx }) {
  const { view, orders, goto, cancelOrder, showToast } = ctx;
  const order = orders.find((o) => o.id === view.orderId);
  const [cancelling, setCancelling] = useState(false);

  if (!order) return <EmptyState icon={<Package size={38} />} title="Order not found" sub="Check your order ID or go back to Orders" />;
  
  const stepIdx = STATUS_FLOW.indexOf(order.status);
  const canCancel = !order.cancelled && order.status !== "Cancelled" && order.status !== "Delivered";

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "16px auto", padding: "0 14px" }}>
      <a onClick={() => goto("orders")} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#7C3AED", fontWeight: 600, marginBottom: 12, cursor: "pointer" }}>
        <ArrowLeft size={14} /> Back to My Orders
      </a>
      
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: 20, boxShadow: "0 2px 4px rgba(0,0,0,.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#111827" }}>Order #{order.id}</div>
            <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 2 }}>
              Placed on {new Date(order.date || order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <StatusPill status={order.status} />
        </div>

        {/* Dynamic Order Status Stepper */}
        {!order.cancelled ? (
          <div style={{ margin: "28px 0 16px", padding: "0 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
              <div style={{ position: "absolute", top: 11, left: 16, right: 16, height: 3, background: "#E5E7EB", zIndex: 0 }} />
              <div
                style={{
                  position: "absolute",
                  top: 11,
                  left: 16,
                  width: `${Math.max(0, (stepIdx / (STATUS_FLOW.length - 1)) * 92)}%`,
                  height: 3,
                  background: "#16A34A",
                  zIndex: 1,
                  transition: "width .4s ease",
                }}
              />
              {STATUS_FLOW.map((s, i) => (
                <div key={s} style={{ zIndex: 2, textAlign: "center", flex: 1 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: i <= stepIdx ? "#16A34A" : "#F3F4F6",
                      border: i <= stepIdx ? "2px solid #16A34A" : "2px solid #D1D5DB",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                    }}
                  >
                    {i <= stepIdx ? <Check size={13} strokeWidth={3} /> : <span style={{ fontSize: 10, color: "#9CA3AF" }}>{i + 1}</span>}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 6, color: i <= stepIdx ? "#15803D" : "#9CA3AF", fontWeight: i === stepIdx ? 800 : 600, maxWidth: 64, marginInline: "auto", lineHeight: 1.2 }}>
                    {s}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, margin: "18px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <XCircle size={18} /> This order has been cancelled and stock has been restored.
          </div>
        )}

        {/* Ordered items list */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Items in this order</div>
          {order.items.map((it, idx) => (
            <div key={it.id || idx} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: "1px solid #F3F4F6", alignItems: "center" }}>
              <img src={it.image} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid #E5E7EB" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{it.name}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  Qty: {it.qty} {it.color ? `• Color: ${it.color}` : ""}
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{money(it.price * it.qty)}</div>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div style={{ marginTop: 18, borderTop: "1px dashed #E5E7EB", paddingTop: 12 }}>
          <Row label="Subtotal" value={money(order.subtotal)} />
          {order.discount > 0 && <Row label={`Discount ${order.appliedCoupon ? `(${order.appliedCoupon})` : ""}`} value={`- ${money(order.discount)}`} green />}
          <Row label="Shipping / Delivery" value={order.delivery === 0 ? "FREE" : money(order.delivery)} green={order.delivery === 0} />
          <div style={{ borderTop: "1px solid #F3F4F6", margin: "8px 0" }} />
          <Row label="Total Amount Paid" value={money(order.total)} bold />
        </div>

        {/* Delivery Details */}
        <div style={{ marginTop: 20, background: "#F9FAFB", padding: 14, borderRadius: 10, border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Shipping Address:</div>
          <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5 }}>
            <strong>{order.address.name}</strong><br />
            {order.address.address}, {order.address.city}, {order.address.state} - {order.address.pincode}<br />
            Phone: {order.address.phone} {order.address.email ? `• Email: ${order.address.email}` : ""}
          </div>
          <div style={{ fontSize: 12.5, color: "#4B5563", marginTop: 8 }}>
            <strong>Payment Method:</strong> {order.payment === "cod" ? "Cash on Delivery" : "Online Payment (UPI/Card)"}
          </div>
        </div>

        {/* Actions */}
        {canCancel && (
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {cancelling ? "Cancelling…" : "Cancel Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
