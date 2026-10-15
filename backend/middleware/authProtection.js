const MAX_FAILED_LOGINS = 5;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_COOLDOWN_MS = 15 * 60 * 1000;
const RATE_LIMIT_CLEANUP_INTERVAL = 256;
const MAX_CONCURRENT_EMAIL_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function clientAddress(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function sendRateLimit(res, retryAfterMs, message) {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  res.set("Retry-After", String(retryAfterSeconds));
  return res.status(429).json({
    success: false,
    message,
    retryAfterSeconds,
  });
}

export class LoginAttemptTracker {
  constructor() {
    this.attempts = new Map();
    this.inProgress = new Map();
    this.waiting = new Map();
    this.checks = 0;
  }

  check(email, now = Date.now()) {
    this.checks += 1;
    if (this.checks % RATE_LIMIT_CLEANUP_INTERVAL === 0) {
      for (const [storedEmail, state] of this.attempts) {
        if (state.lockedUntil <= now && now - state.windowStartedAt >= FAILED_LOGIN_WINDOW_MS) {
          this.attempts.delete(storedEmail);
        }
      }
    }

    const key = normalizeEmail(email);
    const state = this.attempts.get(key);
    if (!state) return 0;

    if (state.lockedUntil > now) return state.lockedUntil - now;
    if (state.lockedUntil || now - state.windowStartedAt >= FAILED_LOGIN_WINDOW_MS) {
      this.attempts.delete(key);
    }
    return 0;
  }

  fail(email, now = Date.now()) {
    const key = normalizeEmail(email);
    const remainingMs = this.check(key, now);
    if (remainingMs) return remainingMs;

    const current = this.attempts.get(key);
    const state = current && now - current.windowStartedAt < FAILED_LOGIN_WINDOW_MS
      ? current
      : { failures: 0, windowStartedAt: now, lockedUntil: 0 };

    state.failures += 1;
    if (state.failures >= MAX_FAILED_LOGINS) {
      state.lockedUntil = now + LOGIN_COOLDOWN_MS;
    }
    this.attempts.set(key, state);
    return state.lockedUntil > now ? state.lockedUntil - now : 0;
  }

  success(email) {
    this.attempts.delete(normalizeEmail(email));
  }

  async run(email, action) {
    const key = normalizeEmail(email);
    const queued = this.waiting.get(key) || 0;
    if (queued >= MAX_CONCURRENT_EMAIL_ATTEMPTS) return { busy: true };

    this.waiting.set(key, queued + 1);
    const previous = this.inProgress.get(key) || Promise.resolve();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const tail = previous.then(() => gate);
    this.inProgress.set(key, tail);

    await previous;
    const remaining = (this.waiting.get(key) || 1) - 1;
    if (remaining) this.waiting.set(key, remaining);
    else this.waiting.delete(key);

    try {
      return await action();
    } finally {
      release();
      if (this.inProgress.get(key) === tail) this.inProgress.delete(key);
    }
  }
}

export const loginAttemptTracker = new LoginAttemptTracker();

function createRateLimiter({ key, limit, windowMs, message }) {
  const entries = new Map();
  let calls = 0;

  return (req, res, next) => {
    const now = Date.now();
    const entryKey = key(req);
    let state = entries.get(entryKey);

    if (!state || state.resetAt <= now) {
      state = { count: 0, resetAt: now + windowMs };
      entries.set(entryKey, state);
    }

    state.count += 1;
    calls += 1;
    if (calls % RATE_LIMIT_CLEANUP_INTERVAL === 0) {
      for (const [storedKey, storedState] of entries) {
        if (storedState.resetAt <= now) entries.delete(storedKey);
      }
    }

    if (state.count > limit) {
      return sendRateLimit(res, state.resetAt - now, message);
    }
    return next();
  };
}

export const loginRequestLimiter = createRateLimiter({
  key: (req) => clientAddress(req),
  limit: 30,
  windowMs: 60 * 1000,
  message: "Too many sign-in requests from this connection. Please wait a minute and try again.",
});

const passwordResetIpLimiter = createRateLimiter({
  key: (req) => clientAddress(req),
  limit: 5,
  windowMs: 15 * 60 * 1000,
  message: "Too many password reset requests. Please wait 15 minutes and try again.",
});

const passwordResetEmailLimiter = createRateLimiter({
  key: (req) => normalizeEmail(req.body?.email),
  limit: 3,
  windowMs: 15 * 60 * 1000,
  message: "Too many password reset requests for this address. Please wait 15 minutes and try again.",
});

export function passwordResetLimiter(req, res, next) {
  return passwordResetIpLimiter(req, res, () => passwordResetEmailLimiter(req, res, next));
}

export function rejectLoginDuringCooldown(email, res) {
  const remainingMs = loginAttemptTracker.check(email);
  if (!remainingMs) return false;
  sendRateLimit(
    res,
    remainingMs,
    `Too many failed sign-in attempts. Please try again in about ${Math.ceil(remainingMs / 60000)} minutes.`
  );
  return true;
}

export function recordFailedLogin(email, res) {
  const remainingMs = loginAttemptTracker.fail(email);
  if (!remainingMs) return false;
  sendRateLimit(
    res,
    remainingMs,
    `Too many failed sign-in attempts. Please try again in about ${Math.ceil(remainingMs / 60000)} minutes.`
  );
  return true;
}

export async function runLoginAttempt(email, action) {
  return loginAttemptTracker.run(email, action);
}

export function rejectBusyLogin(res) {
  return sendRateLimit(res, 1000, "A sign-in is already being checked. Please wait a moment and try again.");
}

export function recordSuccessfulLogin(email) {
  loginAttemptTracker.success(email);
}
