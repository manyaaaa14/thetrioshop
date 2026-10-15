import React, { useState } from "react";
import {
  LayoutDashboard, Boxes, Tags, ClipboardList, Users, Package, Percent,
  MessageSquareText, Settings, LogOut, Menu,
} from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import AdminProducts from "./AdminProducts";
import AdminCategories from "./AdminCategories";
import AdminOrders from "./AdminOrders";
import AdminCustomers from "./AdminCustomers";
import AdminInventory from "./AdminInventory";
import AdminCoupons from "./AdminCoupons";
import AdminReviews from "./AdminReviews";
import AdminContent from "./AdminContent";
import { GLOBAL_CSS } from "../styles/globalStyles";

// Root shell for the admin dashboard: sidebar nav + routes to each admin section.

export default function AdminApp({ ctx }) {
  const { view, goto, logout, showToast } = ctx;
  const page = view.page.replace("admin-", "") || "dashboard";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NAV = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["products", "Products", Boxes],
    ["categories", "Categories", Tags],
    ["orders", "Orders", ClipboardList],
    ["customers", "Customers", Users],
    ["inventory", "Inventory", Package],
    ["coupons", "Coupons", Percent],
    ["reviews", "Reviews", MessageSquareText],
    ["content", "Website Content", Settings],
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", background: "#F4F5F7", display: "flex" }}>
      <style>{GLOBAL_CSS}</style>
      <aside className={sidebarOpen ? "admin-sidebar open" : "admin-sidebar"} style={{ width: 220, background: "#111827", color: "white", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto", padding: "18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>T3</div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>TRIO ADMIN</div>
        </div>
        {NAV.map(([id, label, Icon]) => (
          <a key={id} onClick={() => { goto("admin-" + id); setSidebarOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 2, background: page === id ? "#7C3AED" : "transparent", color: page === id ? "white" : "#cbd5e1" }}>
            <Icon size={16} /> {label}
          </a>
        ))}
        <div style={{ borderTop: "1px solid #333", marginTop: 14, paddingTop: 14 }}>
          <a onClick={logout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#f87171" }}>
            <LogOut size={16} /> Logout
          </a>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)} style={{ border: "none", background: "none", display: "none" }}><Menu size={20} /></button>
          <div style={{ fontWeight: 800, fontSize: 16, textTransform: "capitalize" }}>{page.replace(/-/g, " ")}</div>
          <div style={{ marginLeft: "auto", fontSize: 12.5, color: "#64748B", fontWeight: 600 }}>{ctx.user?.email || "admin97297@gmail.com"}</div>
        </div>
        <div style={{ padding: 20 }}>
          {page === "dashboard" && <AdminDashboard ctx={ctx} />}
          {page === "products" && <AdminProducts ctx={ctx} />}
          {page === "categories" && <AdminCategories ctx={ctx} />}
          {page === "orders" && <AdminOrders ctx={ctx} />}
          {page === "customers" && <AdminCustomers ctx={ctx} />}
          {page === "inventory" && <AdminInventory ctx={ctx} />}
          {page === "coupons" && <AdminCoupons ctx={ctx} />}
          {page === "reviews" && <AdminReviews />}
          {page === "content" && <AdminContent ctx={ctx} />}
        </div>
      </div>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 30 }} />}
      <style>{`
        @media (max-width: 900px){
          .admin-sidebar{ position:fixed !important; left:-240px; transition:left .25s; z-index:40; }
          .admin-sidebar.open{ left:0; }
          .admin-menu-btn{ display:flex !important; }
        }
      `}</style>
    </div>
  );
}
