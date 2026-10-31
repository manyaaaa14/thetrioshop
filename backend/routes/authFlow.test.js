import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import authRoutes from "./auth.routes.js";
import { db } from "../db/db.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}

test("complete forgot password and login rate limit flow", async () => {
  await db.ready;
  const app = createTestApp();

  const testEmail = `user_reset_${Date.now()}@example.com`;
  const initialPassword = "oldPassword123";
  const newPassword = "newSecurePassword456";

  // 1. Register a test user
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;

  try {
    const regRes = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Reset Tester", email: testEmail, password: initialPassword }),
    });
    const regData = await regRes.json();
    assert.equal(regRes.status, 201);
    assert.equal(regData.success, true);

    // 2. Test failed logins counting down attempts
    const failRes1 = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: "wrongpassword" }),
    });
    const failData1 = await failRes1.json();
    assert.equal(failRes1.status, 401);
    assert.equal(failData1.success, false);
    assert.equal(failData1.remainingAttempts, 4);

    // 3. Request password reset
    const resetReqRes = await fetch(`${baseUrl}/password-reset/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const resetReqData = await resetReqRes.json();
    assert.equal(resetReqRes.status, 200);
    assert.equal(resetReqData.success, true);
    assert.ok(resetReqData.devResetCode, "Dev reset code should be returned in test mode");
    const code = resetReqData.devResetCode;

    // 4. Verify password reset code
    const verifyRes = await fetch(`${baseUrl}/password-reset/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, code }),
    });
    const verifyData = await verifyRes.json();
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyData.success, true);

    // 5. Confirm password reset
    const confirmRes = await fetch(`${baseUrl}/password-reset/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, code, newPassword }),
    });
    const confirmData = await confirmRes.json();
    assert.equal(confirmRes.status, 200);
    assert.equal(confirmData.success, true);
    assert.ok(confirmData.token, "Token should be issued upon reset");

    // 6. Login with new password should succeed and reset failed attempts
    const newLoginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: newPassword }),
    });
    const newLoginData = await newLoginRes.json();
    assert.equal(newLoginRes.status, 200);
    assert.equal(newLoginData.success, true);
    assert.equal(newLoginData.user.email, testEmail);

  } finally {
    const createdUser = db.findOne("users", (u) => u.email === testEmail);
    if (createdUser) {
      db.remove("users", createdUser.id);
    }
    server.close();
  }
});
