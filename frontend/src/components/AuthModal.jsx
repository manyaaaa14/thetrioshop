import React, { useState } from "react";
import { X, Lock, Mail, User, Phone, ShieldCheck, KeyRound, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import Input from "./common/Input";
import { api } from "../services/api";

// Shared login/signup/forgot-password modal for customer and admin login with attempt rate-limiting.

export default function AuthModal({ type, onClose, ctx }) {
  const { setUser, setIsAdmin, goto, showToast, refreshAuthSession } = ctx;
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot" | "reset"
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    resetCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [resetNotice, setResetNotice] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [isLockedOut, setIsLockedOut] = useState(false);

  // Request 6-digit password reset code
  async function submitPasswordResetRequest(e) {
    e?.preventDefault();
    setError("");
    setResetNotice("");

    const email = form.email.trim();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.requestPasswordReset(email);

      if (res?.devResetCode) {
        setForm((f) => ({ ...f, resetCode: res.devResetCode }));
        setResetNotice(`Password reset code generated: ${res.devResetCode}. Enter your new password below.`);
      } else {
        setResetNotice("If an account exists for this email, a 6-digit reset code has been sent. Please enter it below.");
      }

      setMode("reset");
    } catch (err) {
      if (err.status === 429) {
        setError(err.message || "Too many password reset requests. Please wait a few minutes and try again.");
      } else {
        setError(err.message || "Unable to send a password reset code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Confirm password reset with 6-digit code
  async function submitPasswordResetConfirm(e) {
    e?.preventDefault();
    setError("");
    setResetNotice("");

    const email = form.email.trim();
    const code = form.resetCode.trim();
    const newPassword = form.newPassword;
    const confirmPassword = form.confirmPassword;

    if (!code) {
      setError("Please enter the 6-digit reset code.");
      return;
    }
    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.confirmPasswordReset({
        email,
        code,
        newPassword,
      });

      if (res?.user) {
        setUser(res.user);
        setIsAdmin(res.user.role === "admin");
        await refreshAuthSession();
        showToast("Password updated successfully! Welcome back 👋", "check");
        onClose();
        goto(res.user.role === "admin" ? "admin-dashboard" : "home");
      } else {
        showToast("Password updated successfully! Please sign in with your new password.", "check");
        setMode("login");
        setForm((f) => ({ ...f, password: newPassword }));
      }
    } catch (err) {
      setError(err.message || "Failed to reset password. Please check your reset code.");
    } finally {
      setLoading(false);
    }
  }

  // Handle customer login & registration
  async function submitUser(e) {
    e?.preventDefault();
    setError("");
    setRemainingAttempts(null);
    setIsLockedOut(false);

    if (!form.email || !form.password || (mode === "signup" && !form.name)) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = mode === "signup"
        ? await api.auth.register({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone,
          })
        : await api.auth.login({ email: form.email, password: form.password });

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
      if (err.status === 429) {
        setIsLockedOut(true);
        setError(err.message || "Too many failed sign-in attempts. Account temporarily locked for 15 minutes.");
      } else {
        if (err.data?.remainingAttempts !== undefined) {
          setRemainingAttempts(err.data.remainingAttempts);
        }
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle admin login
  async function submitAdmin(e) {
    e?.preventDefault();
    setError("");
    setRemainingAttempts(null);
    setIsLockedOut(false);

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
        showToast("Welcome back, Administrator 🛡️", "check");
        onClose();
        goto("admin-dashboard");
      }
    } catch (err) {
      if (err.status === 429) {
        setIsLockedOut(true);
        setError(err.message || "Too many failed admin login attempts. Account temporarily locked for 15 minutes.");
      } else {
        if (err.data?.remainingAttempts !== undefined) {
          setRemainingAttempts(err.data.remainingAttempts);
        }
        setError(err.message || "Invalid admin email or password");
      }
    } finally {
      setLoading(false);
    }
  }

  const modalTitle =
    mode === "reset"
      ? "Create New Password"
      : mode === "forgot"
      ? "Reset Your Password"
      : type === "admin"
      ? "Admin Sign In"
      : mode === "login"
      ? "Sign In to Your Account"
      : "Create an Account";

  const modalSubtitle =
    mode === "reset"
      ? "Enter your 6-digit code and choose a new password"
      : mode === "forgot"
      ? "Enter your email to receive a password reset code"
      : type === "admin"
      ? "Access store management and inventory"
      : mode === "login"
      ? "Enter your credentials to continue"
      : "Join BLORA to start shopping";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 20,
          padding: 28,
          width: 400,
          maxWidth: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,.2)",
        }}
        className="fade-in"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#111827" }}>
              {modalTitle}
            </div>
            <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 2 }}>
              {modalSubtitle}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              border: "none",
              background: "#F3F4F6",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#666",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #F87171", color: "#DC2626", padding: "10px 12px", borderRadius: 8, fontSize: 12.5, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {isLockedOut && mode !== "forgot" && mode !== "reset" && (
          <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", color: "#92400E", padding: "10px 12px", borderRadius: 8, fontSize: 12.5, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Account Temporarily Locked</div>
            <div>Too many failed attempts. You can wait for the cooldown or reset your password right now:</div>
            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(""); setResetNotice(""); setIsLockedOut(false); }}
              style={{
                marginTop: 8,
                background: "#7C3AED",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reset Password Now
            </button>
          </div>
        )}

        {resetNotice && (
          <div role="status" style={{ background: "#F0FDF4", border: "1px solid #86EFAC", color: "#15803D", padding: "10px 12px", borderRadius: 8, fontSize: 12.5, marginBottom: 14 }}>
            {resetNotice}
          </div>
        )}

        {/* FORGOT PASSWORD: STEP 2 (RESET FORM) */}
        {mode === "reset" ? (
          <form onSubmit={submitPasswordResetConfirm} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12.5, color: "#4B5563", background: "#F3F4F6", padding: "8px 12px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Resetting password for: <strong>{form.email}</strong></span>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); setResetNotice(""); }}
                style={{ border: "none", background: "none", color: "#7C3AED", fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
              >
                Change
              </button>
            </div>

            <Input
              label="6-Digit Reset Code*"
              value={form.resetCode}
              onChange={(v) => setForm((f) => ({ ...f, resetCode: v.replace(/\D/g, "").slice(0, 6) }))}
              maxLength={6}
              full
              placeholder="e.g. 123456"
            />
            <Input
              label="New Password*"
              type="password"
              value={form.newPassword}
              onChange={(v) => setForm((f) => ({ ...f, newPassword: v }))}
              full
              placeholder="At least 6 characters"
            />
            <Input
              label="Confirm New Password*"
              type="password"
              value={form.confirmPassword}
              onChange={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
              full
              placeholder="Re-enter new password"
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(90deg,#7C3AED,#DB2777)",
                color: "white",
                border: "none",
                padding: "12px 0",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                marginTop: 6,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Updating Password…" : "Reset Password & Sign In"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, fontSize: 12.5 }}>
              <button
                type="button"
                onClick={submitPasswordResetRequest}
                disabled={loading}
                style={{ border: "none", background: "none", color: "#7C3AED", fontWeight: 700, cursor: "pointer", padding: 0 }}
              >
                Resend Code
              </button>
              <a
                onClick={() => { setMode("login"); setError(""); setResetNotice(""); }}
                style={{ color: "#6B7280", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Back to Sign In
              </a>
            </div>
          </form>
        ) : mode === "forgot" ? (
          /* FORGOT PASSWORD: STEP 1 (EMAIL REQUEST) */
          <form onSubmit={submitPasswordResetRequest} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              label="Email Address*"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              full
              placeholder="name@example.com"
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(90deg,#7C3AED,#DB2777)",
                color: "white",
                border: "none",
                padding: "12px 0",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                marginTop: 6,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Sending Reset Code…" : "Send Reset Code"}
            </button>

            <div style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              Remembered your password?{" "}
              <a
                onClick={() => { setMode("login"); setError(""); setResetNotice(""); }}
                style={{ color: "#7C3AED", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
              >
                Sign in here
              </a>
            </div>
          </form>
        ) : type === "admin" ? (
          /* ADMIN SIGN IN */
          <form onSubmit={submitAdmin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              label="Admin Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              full
              placeholder="Enter admin email address"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              full
              placeholder="Enter admin password"
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {remainingAttempts !== null && remainingAttempts <= 3 ? (
                <span style={{ fontSize: 11.5, color: "#DC2626", fontWeight: 600 }}>
                  {remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} left
                </span>
              ) : <span />}
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); setResetNotice(""); }}
                style={{ border: "none", background: "none", padding: 0, color: "#7C3AED", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#111827",
                color: "white",
                border: "none",
                padding: "12px 0",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                marginTop: 6,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Verifying Credentials…" : "Sign In to Admin Dashboard"}
            </button>
          </form>
        ) : (
          /* CUSTOMER SIGN IN / SIGN UP */
          <form onSubmit={submitUser} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <Input
                label="Full Name*"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                full
                placeholder="e.g. Aarav Sharma"
              />
            )}
            <Input
              label="Email Address*"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              full
              placeholder="name@example.com"
            />
            {mode === "signup" && (
              <Input
                label="Phone Number"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v.replace(/\D/g, "") }))}
                maxLength={10}
                full
                placeholder="10-digit mobile number"
              />
            )}
            <Input
              label="Password*"
              type="password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              full
              placeholder="••••••••"
            />

            {mode === "login" && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {remainingAttempts !== null && remainingAttempts <= 3 ? (
                  <span style={{ fontSize: 11.5, color: "#DC2626", fontWeight: 600 }}>
                    {remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} left
                  </span>
                ) : <span />}
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); setResetNotice(""); }}
                  style={{ border: "none", background: "none", padding: 0, color: "#7C3AED", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(90deg,#7C3AED,#DB2777)",
                color: "white",
                border: "none",
                padding: "12px 0",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                marginTop: 6,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>

            <div style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              {mode === "login" ? "Don't have an account yet?" : "Already have an account?"}{" "}
              <a
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setRemainingAttempts(null); }}
                style={{ color: "#7C3AED", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
              >
                {mode === "login" ? "Sign up free" : "Sign in here"}
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
