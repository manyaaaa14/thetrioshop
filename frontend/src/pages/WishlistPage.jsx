import React from "react";
import { Heart } from "lucide-react";
import ProductCard from "../components/common/ProductCard";
import EmptyState from "../components/common/EmptyState";

export default function WishlistPage({ ctx }) {
  const { wishlist, products, goto, addToCart, toggleWishlist } = ctx;
  const items = products.filter((p) => wishlist[p.id]);
  if (items.length === 0) {
    return <EmptyState icon={<Heart size={40} />} title="Your wishlist is empty" sub="Save items you love for later"
      action={<button onClick={() => goto("shop")} style={{ marginTop: 14, background: "#7C3AED", color: "white", border: "none", padding: "10px 22px", borderRadius: 999, fontWeight: 700 }}>Browse Products</button>} />;
  }
  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: "16px auto", padding: "0 14px" }}>
      <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 12 }}>My Wishlist ({items.length})</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12 }}>
        {items.map((p) => <ProductCard key={p.id} p={p} ctx={ctx} />)}
      </div>
    </div>
  );
}

