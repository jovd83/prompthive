// In-memory rate limiting map. In a production/multi-instance environment, you should use Redis (e.g., UPSTASH).
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

/**
 * Basic in-memory rate limiter.
 * @param ip The IP address or unique identifier of the user to limit.
 * @param limit The maximum number of requests allowed in the window.
 * @param windowMs The time window in milliseconds (e.g., 60000 for 1 minute).
 * @returns boolean `true` if rate limit is exceeded, `false` otherwise.
 */
export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const hitData = rateLimitMap.get(ip);

    if (!hitData) {
        rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
        return false;
    }

    if (now > hitData.expiresAt) {
        rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
        return false;
    }

    if (hitData.count >= limit) {
        return true;
    }

    hitData.count++;
    return false;
}
