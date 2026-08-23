import React, { useRef } from "react";
import ProductCard from "./ProductCard";

// Horizontal scrollable row of ProductCards, used on the homepage.

export default function ProductRow({ products, ctx }) {
  const ref = useRef(null);
  return (
    <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto 28px" }}>
      <div ref={ref} style={{ display: "flex", gap: 12, overflowX: "auto", padding: "2px 14px 6px" }} className="scrollbar-none">
        {products.map((p) => <div key={p.id} style={{ flexShrink: 0, width: 190 }}><ProductCard p={p} ctx={ctx} /></div>)}
      </div>
    </div>
  );
}

