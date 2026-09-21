interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter for login attempts.
 * Max 5 attempts per 15 minutes per IP.
 */
export function checkLoginRateLimit(ip: string): { allowed: boolean; remaining: number; resetMinutes: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxAttempts - 1, resetMinutes: 15 };
  }

  if (record.count >= maxAttempts) {
    const resetMinutes = Math.max(1, Math.ceil((record.resetTime - now) / 60000));
    return { allowed: false, remaining: 0, resetMinutes };
  }

  record.count += 1;
  const resetMinutes = Math.max(1, Math.ceil((record.resetTime - now) / 60000));
  return { allowed: true, remaining: maxAttempts - record.count, resetMinutes };
}

export function resetLoginRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}
