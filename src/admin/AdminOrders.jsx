import React, { useState, useEffect } from "react";
import { STATUS_FLOW } from "../lib/constants";
import { money } from "../lib/format";
import StatusPill from "../components/common/StatusPill";
import { api } from "../services/api";

export default function AdminOrders({ ctx }) {
  const { orders, setOrders, updateOrderStatus, showToast } = ctx;
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingPayments, setVerifyingPayments] = useState([]);

  useEffect(() => {
    loadAllOrders();
  }, []);

  async function loadAllOrders() {
    try {
      setLoading(true);
      const res = await api.orders.getAllAdmin();
      if (res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.warn("Could not fetch admin orders:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyDirectPayment(orderId) {
    if (!window.confirm("Have you verified this transaction in the UPI account? Only continue if the received amount and reference match.")) return;
    setVerifyingPayments((current) => [...current, orderId]);
    try {
      const response = await api.orders.verifyPayment(orderId);
      if (!response.success || !response.order) throw new Error(response.message || "Unable to verify payment.");
      setOrders((current) => current.map((order) => order.id === orderId ? response.order : order));
      showToast("Payment marked as verified.", "check");
    } catch (error) {
      showToast(error.message || "Unable to verify payment.", "warn");
    } finally {
      setVerifyingPayments((current) => current.filter((id) => id !== orderId));
    }
  }

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.address?.name && o.address.name.toLowerCase().includes(search.toLowerCase())) ||
      (o.userEmail && o.userEmail.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Order ID, customer, email…"
          style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "9px 12px", fontSize: 13, minWidth: 260 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "9px 12px", fontSize: 13, background: "white" }}
        >
          <option value="all">All Order Statuses</option>
          {[...STATUS_FLOW, "Cancelled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div style={{ marginLeft: "auto", fontSize: 12.5, color: "#6B7280" }}>
          Showing {filtered.length} of {orders.length} orders
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: "white", padding: 32, borderRadius: 12, border: "1px solid #E5E7EB", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
          No matching customer orders found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((o) => (
            <div key={o.id} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#7C3AED" }}>#{o.id}</span>
                    <StatusPill status={o.status} />
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                    Customer: <strong>{o.address?.name || "Guest"}</strong> ({o.address?.phone}) • {o.userEmail}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 1 }}>
                    Ordered on {new Date(o.date || o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>{money(o.total)}</div>
                  <div style={{ fontSize: 11.5, color: "#6B7280", textTransform: "uppercase", fontWeight: 600 }}>
                    {o.payment === "upi-direct" ? "📷 Direct UPI QR" :
                     o.payment === "upi" ? "📱 UPI" :
                     o.payment === "googlepay" ? "📱 GPay" :
                     o.payment === "phonepe" ? "🟣 PhonePe" :
                     o.payment === "paytm" ? "🔷 Paytm" :
                     o.payment === "bhim" ? "📲 BHIM UPI" :
                     o.payment === "qr" ? "📷 UPI QR" :
                     o.payment === "cod" ? "💵 COD" : "Prepaid"}
                  </div>
                  <div style={{ fontSize: 11, color: o.paymentStatus === "Paid" ? "#15803D" : "#B45309", fontWeight: 700, marginTop: 3 }}>
                    Payment: {o.paymentStatus || "Pending"}
                  </div>
                  {o.paymentReference && (
                    <div style={{ fontSize: 11, color: "#7C3AED", fontFamily: "monospace", fontWeight: 700 }}>
                      Payment reference: {o.paymentReference}
                    </div>
                  )}
                </div>
              </div>

              {/* Items summary */}
              <div style={{ background: "#F9FAFB", padding: "8px 12px", borderRadius: 8, marginTop: 10, fontSize: 12.5, color: "#4B5563" }}>
                <strong>Ordered Items:</strong>{" "}
                {o.items?.map((it) => `${it.name} (Qty: ${it.qty}${it.color ? `, ${it.color}` : ""})`).join(" • ")}
              </div>

              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
                <strong>{o.shippingMethod === "express" ? "Express shipping" : "Standard shipping"}:</strong> {o.address?.address}, {o.address?.city}, {o.address?.state} - {o.address?.pincode}
              </div>

              {o.payment === "upi-direct" && o.paymentStatus === "Pending" && o.paymentReference && (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 12, color: "#92400E" }}>
                  Check the UPI account for {money(o.total)} and match reference <strong style={{ fontFamily: "monospace" }}>{o.paymentReference}</strong> before marking this payment verified.
                  <button
                    type="button"
                    onClick={() => verifyDirectPayment(o.id)}
                    disabled={verifyingPayments.includes(o.id)}
                    style={{ display: "block", marginTop: 8, border: "none", borderRadius: 6, background: "#15803D", color: "white", padding: "7px 11px", fontSize: 12, fontWeight: 700, cursor: verifyingPayments.includes(o.id) ? "not-allowed" : "pointer" }}
                  >
                    {verifyingPayments.includes(o.id) ? "Verifying…" : "Mark payment verified"}
                  </button>
                </div>
              )}

              {/* Status change actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Update Status:</span>
                <select
                  value={o.status}
                  onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                  style={{ border: "1px solid #D1D5DB", borderRadius: 6, padding: "5px 10px", fontSize: 12, background: "white", fontWeight: 600 }}
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Cancelled">Cancelled</option>
                </select>

                {o.status !== "Cancelled" && (
                  <button
                    onClick={() => updateOrderStatus(o.id, "Cancelled", "Cancelled by Store Administrator")}
                    style={{ border: "1px solid #FECACA", color: "#DC2626", background: "#FEF2F2", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
