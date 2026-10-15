import test from "node:test";
import assert from "node:assert/strict";
import { LoginAttemptTracker, passwordResetLimiter } from "./authProtection.js";

test("locks after five consecutive failed logins for 15 minutes", () => {
  const tracker = new LoginAttemptTracker();
  const now = 1_000_000;

  for (let attempt = 1; attempt < 5; attempt += 1) {
    assert.equal(tracker.fail("Customer@Example.com", now + attempt), 0);
  }

  const cooldown = tracker.fail("customer@example.com", now + 5);
  assert.equal(cooldown, 15 * 60 * 1000);
  assert.equal(tracker.check("CUSTOMER@example.com", now + 6), cooldown - 1);
});

test("successful login clears failed attempts", () => {
  const tracker = new LoginAttemptTracker();

  for (let attempt = 0; attempt < 4; attempt += 1) tracker.fail("customer@example.com");
  tracker.success("CUSTOMER@example.com");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.equal(tracker.fail("customer@example.com"), 0);
  }
});

test("concurrent attempts are checked sequentially and stop after the fifth failure", async () => {
  const tracker = new LoginAttemptTracker();
  const attempts = await Promise.all(
    Array.from({ length: 8 }, () => tracker.run("customer@example.com", async () => {
      const remaining = tracker.check("customer@example.com");
      if (remaining) return "locked";
      tracker.fail("customer@example.com");
      return "failed";
    }))
  );

  assert.equal(attempts.filter((result) => result === "failed").length, 5);
  assert.equal(attempts.filter((result) => result?.busy).length, 3);
});

test("failed attempts expire after the attempt window and cooldown is temporary", () => {
  const tracker = new LoginAttemptTracker();
  const now = 1_000_000;

  for (let attempt = 0; attempt < 5; attempt += 1) tracker.fail("customer@example.com", now + attempt);
  assert.equal(tracker.check("customer@example.com", now + 15 * 60 * 1000 + 5), 0);
  assert.equal(tracker.fail("customer@example.com", now + 15 * 60 * 1000 + 6), 0);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.equal(tracker.fail("customer@example.com", now + 30 * 60 * 1000 + 10 + attempt), 0);
  }
});

test("password reset requests are limited by both email and source address", () => {
  function request(ip, email) {
    let passed = false;
    const response = {
      headers: {},
      set(name, value) { this.headers[name] = value; return this; },
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    passwordResetLimiter({ ip, body: { email } }, response, () => { passed = true; });
    return { passed, response };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    assert.equal(request("192.0.2.41", "reset-limit@example.com").passed, true);
  }
  const emailLimited = request("192.0.2.41", "reset-limit@example.com");
  assert.equal(emailLimited.passed, false);
  assert.equal(emailLimited.response.statusCode, 429);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(request("192.0.2.42", `source-limit-${attempt}@example.com`).passed, true);
  }
  const sourceLimited = request("192.0.2.42", "source-limit-final@example.com");
  assert.equal(sourceLimited.passed, false);
  assert.equal(sourceLimited.response.statusCode, 429);
  assert.ok(sourceLimited.response.headers["Retry-After"]);
});
