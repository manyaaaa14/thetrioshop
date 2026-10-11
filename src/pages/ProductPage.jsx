import React, { useState, useEffect } from "react";
import { Star, Package, Minus, Plus, Truck, RotateCcw, ShieldCheck, Heart, ArrowLeft, MessageSquarePlus, CheckCircle2 } from "lucide-react";
import { money, pctOff } from "../lib/format";
import { DEMO_REVIEWS } from "../data/reviews";
import ProductCard, { Badge } from "../components/common/ProductCard";
import ProductRow from "../components/common/ProductRow";
import EmptyState from "../components/common/EmptyState";
import SectionHeader from "../components/common/SectionHeader";
import { api } from "../services/api";

export default function ProductPage({ ctx }) {
  const { view, products, goto, addToCart, wishlist, toggleWishlist, user, showToast, refreshCatalog } = ctx;
  const p = products.find((pp) => pp.id === view.productId);
  const [imgIdx, setImgIdx] = useState(0);
  const [color, setColor] = useState(p?.variants?.color?.[0] || null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setImgIdx(0);
    setQty(1);
    setColor(p?.variants?.color?.[0] || null);
  }, [view.productId]);

  if (!p) return <EmptyState icon={<Package size={38} />} title="Product not found" sub="It may have been removed" />;
  
  const off = pctOff(p.price, p.mrp);
  const related = products.filter((r) => r.category === p.category && r.id !== p.id).slice(0, 4);
  const isWished = !!wishlist[p.id];

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: "16px auto", padding: "0 14px" }}>
      <a onClick={() => goto("shop")} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#7C3AED", fontWeight: 600, marginBottom: 12, cursor: "pointer" }}>
        <ArrowLeft size={14} /> Back to shop
      </a>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }} className="product-grid-detail">
        <div>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #eee", background: "white" }}>
            <img src={p.images[imgIdx] || p.images[0]} alt={p.name} style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }} />
          </div>
          {p.images.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {p.images.map((im, i) => (
                <img
                  key={i}
                  src={im}
                  alt=""
                  onClick={() => setImgIdx(i)}
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: i === imgIdx ? "2px solid #7C3AED" : "2px solid transparent" }}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {p.badges?.includes("bestseller") && <Badge text="BESTSELLER" bg="#F97316" />}
            {p.badges?.includes("new") && <Badge text="NEW" bg="#2563EB" />}
            {p.badges?.includes("sale") && <Badge text="SALE" bg="#DC2626" />}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#111827" }}>{p.name}</h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ background: "#16A34A", color: "white", fontSize: 11.5, fontWeight: 700, padding: "2px 7px", borderRadius: 5, display: "flex", alignItems: "center", gap: 3 }}>
              {p.rating || 4.5} <Star size={10} fill="white" />
            </span>
            <span style={{ fontSize: 12.5, color: "#6B7280" }}>{p.ratingCount || 1} verified ratings</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 14 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>{money(p.price)}</span>
            {off > 0 && (
              <>
                <span style={{ fontSize: 15, color: "#9CA3AF", textDecoration: "line-through" }}>{money(p.mrp)}</span>
                <span style={{ color: "#16A34A", fontWeight: 700, fontSize: 14 }}>{off}% off</span>
              </>
            )}
          </div>

          <div style={{ fontSize: 12.5, marginTop: 6, color: p.stock === 0 ? "#DC2626" : p.stock < 10 ? "#F59E0B" : "#16A34A", fontWeight: 700 }}>
            {p.stock === 0 ? "OUT OF STOCK" : p.stock < 10 ? `Only ${p.stock} left in stock!` : "In Stock (Ready to Ship)"}
          </div>

          {p.variants?.color?.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Color: <span style={{ fontWeight: 400 }}>{color}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {p.variants.color.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: color === c ? "2px solid #7C3AED" : "1px solid #ddd", background: color === c ? "#F8F5FF" : "white", cursor: "pointer" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>Qty:</div>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 8, background: "white" }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ border: "none", background: "none", padding: "6px 12px", cursor: "pointer" }}><Minus size={13} /></button>
              <span style={{ padding: "0 10px", fontSize: 13, fontWeight: 700 }}>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))} style={{ border: "none", background: "none", padding: "6px 12px", cursor: "pointer" }}><Plus size={13} /></button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => addToCart(p, { qty, color })}
              disabled={p.stock === 0}
              style={{ flex: 1, padding: "13px 0", borderRadius: 10, border: "2px solid #7C3AED", background: "white", color: "#7C3AED", fontWeight: 700, fontSize: 14, cursor: p.stock === 0 ? "not-allowed" : "pointer" }}
            >
              Add to Cart
            </button>
            <button
              onClick={() => { addToCart(p, { qty, color }); goto("checkout"); }}
              disabled={p.stock === 0}
              style={{ flex: 1, padding: "13px 0", borderRadius: 10, border: "none", background: p.stock === 0 ? "#E5E7EB" : "linear-gradient(90deg,#7C3AED,#DB2777)", color: p.stock === 0 ? "#9CA3AF" : "white", fontWeight: 700, fontSize: 14, cursor: p.stock === 0 ? "not-allowed" : "pointer" }}
            >
              Buy Now
            </button>
            <button
              onClick={() => toggleWishlist(p.id)}
              style={{ width: 48, borderRadius: 10, border: "1px solid #ddd", background: "white", cursor: "pointer" }}
              title="Add to Wishlist"
            >
              <Heart size={18} style={{ margin: "0 auto" }} fill={isWished ? "#EC4899" : "none"} color={isWished ? "#EC4899" : "#888"} />
            </button>
          </div>

          <p style={{ fontSize: 13.5, color: "#4B5563", lineHeight: 1.6, marginTop: 20 }}>{p.desc}</p>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: "#4B5563" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Truck size={15} color="#7C3AED" /> Standard shipping ₹100</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}><RotateCcw size={15} color="#7C3AED" /> 7-day easy return policy</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}><ShieldCheck size={15} color="#7C3AED" /> 100% verified authentic product</div>
          </div>
        </div>
      </div>

      <ReviewsSection product={p} user={user} showToast={showToast} refreshCatalog={refreshCatalog} />

      {related.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <SectionHeader title="You may also like" />
          <ProductRow products={related} ctx={ctx} />
        </div>
      )}
      <style>{`@media (max-width:820px){ .product-grid-detail{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

function ReviewsSection({ product, user, showToast, refreshCatalog }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [product.id]);

  async function loadReviews() {
    try {
      setLoading(true);
      const res = await api.reviews.getByProduct(product.id);
      if (res.reviews && res.reviews.length > 0) {
        setReviews(res.reviews);
      } else {
        setReviews(DEMO_REVIEWS[product.id] || [
          { userName: "Riya Sen", rating: 5, comment: "Loved the quality for the price, will order again!", date: "3 weeks ago", verified: true }
        ]);
      }
    } catch (err) {
      setReviews(DEMO_REVIEWS[product.id] || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!comment.trim()) {
      showToast("Please write a short review", "warn");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.reviews.submit({
        productId: product.id,
        rating,
        comment,
        userName: user?.name || "Verified Customer",
      });

      if (res.review) {
        setReviews((prev) => [res.review, ...prev]);
        setComment("");
        setShowForm(false);
        showToast("Review submitted successfully! ⭐", "check");
        if (refreshCatalog) refreshCatalog();
      }
    } catch (err) {
      showToast(err.message || "Failed to submit review", "warn");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: 40, borderTop: "1px solid #E5E7EB", paddingTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#111827" }}>Customer Reviews & Ratings</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>{reviews.length} reviews from verified customers</div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{ background: "#7C3AED", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        >
          <MessageSquarePlus size={14} /> Write a Review
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmitReview} style={{ background: "white", border: "1px solid #E9D5FF", borderRadius: 12, padding: 16, marginBottom: 20, maxWidth: 640 }} className="fade-in">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Share your experience</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Rating:</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={20}
                  fill={s <= rating ? "#F59E0B" : "none"}
                  color="#F59E0B"
                  onClick={() => setRating(s)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#F59E0B" }}>{rating} / 5</span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked about this product..."
            rows={3}
            style={{ width: "100%", border: "1px solid #DDD", borderRadius: 8, padding: 10, fontSize: 13, fontFamily: "inherit" }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: "#F3F4F6", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ background: "#7C3AED", color: "white", border: "none", padding: "7px 16px", borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              {submitting ? "Submitting…" : "Post Review"}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
        {reviews.map((r, i) => (
          <div key={r.id || i} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{r.userName || r.name}</div>
                {r.verified && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#16A34A", fontWeight: 600 }}>
                    <CheckCircle2 size={11} /> Verified Buyer
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: "#9CA3AF" }}>{r.date}</div>
            </div>
            <div style={{ display: "flex", gap: 2, margin: "6px 0" }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={13} fill={j < r.rating ? "#F59E0B" : "none"} color="#F59E0B" />
              ))}
            </div>
            <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5 }}>{r.comment || r.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
