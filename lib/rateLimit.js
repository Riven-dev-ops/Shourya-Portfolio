const rateLimitMap = new Map();

/**
 * Checks if a client identifier is rate limited.
 * @param {string} identifier Unique client ID (e.g. IP address or session ID)
 * @param {number} limit Max allowed requests within window
 * @param {number} windowMs Time window in milliseconds
 * @returns {boolean} True if rate limited, false otherwise
 */
export function isRateLimited(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now();
  
  // Cleanup map if it grows too large
  if (rateLimitMap.size > 2000) {
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const active = timestamps.filter(time => now - time < windowMs);
      if (active.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, active);
      }
    }
  }

  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, [now]);
    return false;
  }

  const timestamps = rateLimitMap.get(identifier);
  const activeTimestamps = timestamps.filter(time => now - time < windowMs);

  if (activeTimestamps.length >= limit) {
    return true;
  }

  activeTimestamps.push(now);
  rateLimitMap.set(identifier, activeTimestamps);
  return false;
}
