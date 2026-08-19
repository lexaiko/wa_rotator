/**
 * Anti-Spam & Click Fraud Protection Service for TripBanyuwangi WA Rotator
 */
export class SpamProtectionService {
  // In-memory sliding window rate limiter
  static ipClickHistory = new Map(); // Map<ip, Array<timestamps>>
  
  // Known bots and scraper user-agents
  static BOT_PATTERNS = [
    /googlebot/i,
    /bingbot/i,
    /facebookexternalhit/i,
    /tiktokbot/i,
    /bytespider/i,
    /meta-externalagent/i,
    /twitterbot/i,
    /whatsapp/i, // WhatsApp link preview crawler
    /telegrambot/i,
    /ahrefsbot/i,
    /semrushbot/i,
    /yandexbot/i,
    /petalbot/i,
    /crawler/i,
    /spider/i,
    /curl\//i,
    /python-requests/i,
    /axios/i,
    /node-fetch/i,
    /postman/i,
    /headlesschrome/i
  ];

  /**
   * Check if the incoming request is from a known crawler / bot scraper
   */
  static isBot(userAgent = '') {
    if (!userAgent) return false;
    return this.BOT_PATTERNS.some(pattern => pattern.test(userAgent));
  }

  /**
   * Check if the IP is clicking too fast (Anti-Flood / Click Fraud)
   * Limit: Max 10 clicks per 10 seconds per IP
   */
  static checkRateLimit(ip) {
    if (!ip) return { isSpam: false, clickCount: 1 };

    const now = Date.now();
    const windowMs = 10 * 1000; // 10 seconds window
    const maxClicks = 10; // Max allowed in window

    let timestamps = this.ipClickHistory.get(ip) || [];
    // Filter out timestamps older than window
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= maxClicks) {
      return {
        isSpam: true,
        clickCount: timestamps.length,
        retryAfterSec: Math.ceil((windowMs - (now - timestamps[0])) / 1000)
      };
    }

    // Record new click
    timestamps.push(now);
    this.ipClickHistory.set(ip, timestamps);

    // Periodic cleanup of stale IPs (keep memory lean)
    if (this.ipClickHistory.size > 5000) {
      for (const [key, list] of this.ipClickHistory.entries()) {
        if (list.length === 0 || now - list[list.length - 1] > windowMs * 2) {
          this.ipClickHistory.delete(key);
        }
      }
    }

    return {
      isSpam: false,
      clickCount: timestamps.length
    };
  }
}

export default SpamProtectionService;
