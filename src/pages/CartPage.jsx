import React from "react";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import Row from "../components/common/Row";
import EmptyState from "../components/common/EmptyState";
import { money } from "../lib/format";

export default function CartPage({ ctx }) {
  const { cart, products, updateCartQty, removeFromCart, goto } = ctx;
  const items = Object.entries(cart).map(([id, v]) => ({ ...v, product: products.find((p) => p.id === id) })).filter((i) => i.product);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const mrpTotal = items.reduce((s, i) => s + i.product.mrp * i.qty, 0);
  const savings = mrpTotal - subtotal;
  const delivery = subtotal >= 499 || subtotal === 0 ? 0 : 49;

  if (items.length === 0) {
    return <EmptyState icon={<ShoppingCart size={40} />} title="Your cart is empty" sub="Looks like you haven't added anything yet"
      action={<button onClick={() => goto("shop")} style={{ marginTop: 14, background: "#7C3AED", color: "white", border: "none", padding: "10px 22px", borderRadius: 999, fontWeight: 700 }}>Start Shopping</button>} />;
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: "16px auto", padding: "0 14px" }}>
      <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 12 }}>My Cart ({items.length})</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((i) => (
            <div key={i.product.id} style={{ background: "white", borderRadius: 12, padding: 12, display: "flex", gap: 12, border: "1px solid #eee" }}>
              <img src={i.product.images[0]} style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", cursor: "pointer" }} onClick={() => goto("product", { productId: i.product.id })} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{i.product.name}</div>
                {i.color && <div style={{ fontSize: 11.5, color: "#888" }}>Color: {i.color}</div>}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 14.5 }}>{money(i.product.price)}</span>
                  <span style={{ fontSize: 11.5, color: "#999", textDecoration: "line-through" }}>{money(i.product.mrp)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 8 }}>
                    <button onClick={() => updateCartQty(i.product.id, i.qty - 1)} style={{ border: "none", background: "none", padding: "4px 9px" }}><Minus size={12} /></button>
                    <span style={{ padding: "0 8px", fontSize: 12.5, fontWeight: 700 }}>{i.qty}</span>
                    <button onClick={() => updateCartQty(i.product.id, i.qty + 1)} style={{ border: "none", background: "none", padding: "4px 9px" }}><Plus size={12} /></button>
                  </div>
                  <button onClick={() => removeFromCart(i.product.id)} style={{ border: "none", background: "none", color: "#DC2626", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><Trash2 size={13} /> Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #eee" }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Price Details</div>
          <Row label={`Subtotal (${items.length} items)`} value={money(subtotal)} />
          <Row label="Discount" value={`- ${money(savings)}`} green />
          <Row label="Delivery" value={delivery === 0 ? "FREE" : money(delivery)} green={delivery === 0} />
          <div style={{ borderTop: "1px dashed #ddd", margin: "10px 0" }} />
          <Row label="Total Amount" value={money(subtotal + delivery)} bold />
          {savings > 0 && <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 700, marginTop: 6 }}>You will save {money(savings)} on this order</div>}
          <button onClick={() => goto("checkout")} style={{ marginTop: 14, width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#7C3AED,#DB2777)", color: "white", fontWeight: 700, fontSize: 14 }}>Proceed to Checkout</button>
        </div>

        <a onClick={() => goto("shop")} style={{ display: "inline-block", fontSize: 13, color: "#7C3AED", fontWeight: 600, cursor: "pointer" }}>+ Continue Shopping</a>
      </div>
    </div>
  );
}
