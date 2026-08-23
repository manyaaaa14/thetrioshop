import React, { useState, useEffect } from "react";
import { Star, Trash2, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

export default function AdminReviews({ ctx }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllReviews();
  }, []);

  async function loadAllReviews() {
    try {
      setLoading(true);
      const res = await api.reviews.getAllAdmin();
      if (res.reviews) {
        setReviews(res.reviews);
      }
    } catch (err) {
      console.warn("Could not load admin reviews");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this customer review?")) return;
    try {
      await api.reviews.delete(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (ctx?.showToast) ctx.showToast("Review deleted", "check");
    } catch (err) {
      if (ctx?.showToast) ctx.showToast("Failed to delete review", "warn");
    }
  }

  return (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Customer Reviews & Ratings Moderation</div>
        <div style={{ fontSize: 12.5, color: "#6B7280" }}>Manage customer feedback across all catalog products</div>
      </div>

      {reviews.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>No reviews found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid #F3F4F6", borderRadius: 10, background: "#F9FAFB" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>{r.userName || "Customer"}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={13} fill={j < r.rating ? "#F59E0B" : "none"} color="#F59E0B" />
                    ))}
                  </div>
                  {r.verified && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#16A34A", fontWeight: 600 }}>
                      <CheckCircle2 size={11} /> Verified Buyer
                    </span>
                  )}
                  <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>• Product #{r.productId}</span>
                </div>
                <div style={{ fontSize: 13, color: "#4B5563", marginTop: 4 }}>{r.comment}</div>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                style={{ border: "1px solid #FECACA", color: "#DC2626", background: "white", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
