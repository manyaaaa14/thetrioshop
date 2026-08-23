import React, { useState } from "react";
import { User, Package, Heart, LogOut, MapPin, Phone, Mail, Edit3, Save } from "lucide-react";
import Input from "../components/common/Input";
import EmptyState from "../components/common/EmptyState";
import { api } from "../services/api";

export default function ProfilePage({ ctx, setAuthModal }) {
  const { user, setUser, orders, wishlist, goto, showToast, logout } = ctx;
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address?.address || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
  });

  if (!user) {
    return (
      <EmptyState
        icon={<User size={40} />}
        title="You're not signed in"
        sub="Sign in to view your profile, manage saved addresses, and track your orders"
        action={
          <button
            onClick={() => setAuthModal("user")}
            style={{ marginTop: 14, background: "linear-gradient(90deg,#7C3AED,#DB2777)", color: "white", border: "none", padding: "10px 24px", borderRadius: 999, fontWeight: 700, cursor: "pointer" }}
          >
            Login / Sign Up
          </button>
        }
      />
    );
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const updates = {
        name: form.name,
        phone: form.phone,
        address: {
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
      };
      const res = await api.auth.updateProfile(updates);
      if (res.user) {
        setUser(res.user);
        setEdit(false);
        showToast("Profile updated successfully! ✨", "check");
      }
    } catch (err) {
      showToast(err.message || "Failed to update profile", "warn");
    } finally {
      setLoading(false);
    }
  }

  const wishlistCount = Object.keys(wishlist || {}).length;

  return (
    <div className="fade-in" style={{ maxWidth: 580, margin: "20px auto", padding: "0 14px" }}>
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: 22, boxShadow: "0 2px 6px rgba(0,0,0,.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#EC4899)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, boxShadow: "0 4px 10px rgba(124,58,237,.3)" }}>
            {user.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#111827" }}>{user.name}</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>{user.email}</div>
          </div>
        </div>

        {!edit ? (
          <div style={{ marginTop: 20 }}>
            <ProfileRow label="Mobile Phone" value={user.phone || "Not provided"} icon={<Phone size={14} color="#7C3AED" />} />
            <ProfileRow
              label="Saved Address"
              value={
                user.address && user.address.address
                  ? `${user.address.address}, ${user.address.city}, ${user.address.state} - ${user.address.pincode}`
                  : "No address saved yet"
              }
              icon={<MapPin size={14} color="#7C3AED" />}
            />
            
            <button
              onClick={() => {
                setForm({
                  name: user.name || "",
                  phone: user.phone || "",
                  address: user.address?.address || "",
                  city: user.address?.city || "",
                  state: user.address?.state || "",
                  pincode: user.address?.pincode || "",
                });
                setEdit(true);
              }}
              style={{ marginTop: 16, border: "1px solid #D1D5DB", background: "white", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#374151" }}
            >
              <Edit3 size={14} /> Edit Profile & Address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Full Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} full />
            <Input label="Phone Number" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v.replace(/\D/g, "") }))} maxLength={10} full />
            <Input label="Street Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} full />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
              <Input label="State" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} />
            </div>
            <Input label="Pincode" value={form.pincode} onChange={(v) => setForm((f) => ({ ...f, pincode: v.replace(/\D/g, "") }))} maxLength={6} full />

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setEdit(false)}
                style={{ flex: 1, background: "#F3F4F6", border: "none", padding: "10px 0", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{ flex: 1, background: "#7C3AED", color: "white", border: "none", padding: "10px 0", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Save size={14} /> {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        <ProfileLink icon={<Package size={17} color="#7C3AED" />} label={`My Orders (${orders.length})`} onClick={() => goto("orders")} />
        <ProfileLink icon={<Heart size={17} color="#EC4899" />} label={`My Wishlist (${wishlistCount})`} onClick={() => goto("wishlist")} />
        <ProfileLink icon={<LogOut size={17} color="#DC2626" />} label="Sign Out of My Account" onClick={logout} danger />
      </div>
    </div>
  );
}

function ProfileRow({ label, value, icon }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>{icon} {label}</span>
      <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%", color: "#1F2937" }}>{value}</span>
    </div>
  );
}

function ProfileLink({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "13px 16px", fontSize: 14, fontWeight: 600, color: danger ? "#DC2626" : "#1F2937", textAlign: "left", cursor: "pointer", transition: "background .15s" }}
    >
      {icon} <span>{label}</span>
    </button>
  );
}
