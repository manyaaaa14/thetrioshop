import React, { useState } from "react";
import { X, Lock, Mail, User, Phone, ShieldCheck } from "lucide-react";
import Input from "./common/Input";
import { api } from "../services/api";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { firebaseAuth, hasFirebaseConfig, isFirebaseConfigured } from "../lib/firebase";

// Shared login/signup modal for customer and admin login.
// All credentials hints are hidden for a clean production UI.

export default function AuthModal({ type, onClose, ctx }) {
  const { setUser, setIsAdmin, goto, showToast, refreshAuthSession } = ctx;
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  async function submitUser(e) {
    e?.preventDefault();
    setError("");

    if (!form.email || !form.password || (mode === "signup" && !form.name)) {
      setError("Please fill all required fields");
      return;
    }

    if (hasFirebaseConfig && !isFirebaseConfigured) {
      setError("Firebase configuration is incomplete. Check the VITE_FIREBASE_* values in .env.local.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isFirebaseConfigured) {
        let credential;
        if (mode === "signup") {
          try {
            credential = await createUserWithEmailAndPassword(firebaseAuth, form.email, form.password);
            await updateProfile(credential.user, { displayName: form.name });
          } catch (firebaseError) {
            console.warn("Firebase sign up failed, falling back to direct registration:", firebaseError.message);
            res = await api.auth.register({
              name: form.name,
              email: form.email,
              password: form.password,
              phone: form.phone,
            });
          }
        } else {
          try {
            credential = await signInWithEmailAndPassword(firebaseAuth, form.email, form.password);
          } catch (firebaseError) {
            console.warn("Firebase sign in failed, falling back to direct login:", firebaseError.message);
            res = await api.auth.login({ email: form.email, password: form.password });
          }
        }

        if (credential) {
          try {
            res = await api.auth.firebaseSession({
              idToken: await credential.user.getIdToken(),
              name: mode === "signup" ? form.name : credential.user.displayName,
              phone: form.phone,
            });
          } catch (sessionErr) {
            console.warn("Firebase session exchange failed, falling back to direct auth:", sessionErr.message);
            res = mode === "signup"
              ? await api.auth.register({
                name: form.name,
                email: form.email,
                password: form.password,
                phone: form.phone,
              })
              : await api.auth.login({ email: form.email, password: form.password });
          }
        }
      } else {
        res = mode === "signup"
          ? await api.auth.register({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone,
          })
          : await api.auth.login({ email: form.email, password: form.password });
      }

      if (res?.user) {
        setUser(res.user);
        setIsAdmin(res.user.role === "admin");
        await refreshAuthSession();
        showToast(mode === "signup"
          ? "Account created successfully! Welcome to TRIO 🎉"
          : `Welcome back, ${res.user.name}! 👋`, "check");
        onClose();
        goto(res.user.role === "admin" ? "admin-dashboard" : "home");
      }
    } catch (err) {
      if (err.status === 403 && err.message.startsWith("Verify your email") && firebaseAuth?.currentUser) {
        try {
          await sendEmailVerification(firebaseAuth.currentUser);
          await signOut(firebaseAuth);
          setError("We sent a verification link to your email. Verify it, then sign in to link your existing account.");
        } catch (verificationError) {
          setError(verificationError.message || "Could not send the verification email.");
        }
      } else {
        const msg = err.message || "Authentication failed. Please check your credentials.";
        if (msg === "Failed to fetch" || msg.includes("network-request-failed") || msg.includes("Unable to connect")) {
          setError("Unable to connect to the authentication server. Please check your internet connection.");
        } else {
          setError(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitAdmin(e) {
    e?.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter admin email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.adminLogin({
        email: form.email,
        password: form.password,
      });

      if (res.user) {
        setUser(res.user);
        setIsAdmin(true);
        await refreshAuthSession();
        showToast("Welcome back, Administrator 🛡️", "check");
        onClose();
        goto("admin-dashboard");
      }
    } catch (err) {
      const msg = err.message || "Invalid admin email or password";
      if (msg === "Failed to fetch" || msg.includes("Unable to connect")) {
        setError("Unable to connect to the server. Please check your internet connection.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 20, padding: 28, width: 390, maxWidth: "100%", boxShadow: "0 20px 40px rgba(0,0,0,.2)" }} className="fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#111827" }}>
              {type === "admin" ? "Admin Sign In" : mode === "login" ? "Sign In to Your Account" : "Create an Account"}
            </div>
            <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 2 }}>
              {type === "admin" ? "Access store management and inventory" : mode === "login" ? "Enter your credentials to continue" : "Join BLORA to start shopping"}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#F3F4F6", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#666" }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #F87171", color: "#DC2626", padding: "9px 12px", borderRadius: 8, fontSize: 12.5, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {type === "admin" ? (
          <form onSubmit={submitAdmin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Admin Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} full placeholder="Enter admin email address" />
            <Input label="Password" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} full placeholder="Enter admin password" />

            <button type="submit" disabled={loading} style={{ background: "#111827", color: "white", border: "none", padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14, marginTop: 6, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Verifying Credentials…" : "Sign In to Admin Dashboard"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitUser} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <Input label="Full Name*" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} full placeholder="e.g. Aarav Sharma" />
            )}
            <Input label="Email Address*" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} full placeholder="name@example.com" />
            {mode === "signup" && (
              <Input label="Phone Number" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v.replace(/\D/g,"") }))} maxLength={10} full placeholder="10-digit mobile number" />
            )}
            <Input label="Password*" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} full placeholder="••••••••" />

            <button type="submit" disabled={loading} style={{ background: "linear-gradient(90deg,#7C3AED,#DB2777)", color: "white", border: "none", padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14, marginTop: 6, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>

            <div style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              {mode === "login" ? "Don't have an account yet?" : "Already have an account?"}{" "}
              <a onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ color: "#7C3AED", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                {mode === "login" ? "Sign up free" : "Sign in here"}
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
