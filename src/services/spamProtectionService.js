import GeoService from './geoService.js';

/**
 * Anti-Spam & Click Fraud Protection Service for TripBanyuwangi WA Rotator
 */
export class SpamProtectionService {
  // In-memory sliding window rate limiter
  static ipClickHistory = new Map(); // Map<ip, Array<timestamps>>
  
  // Known bots and scraper user-agents (link preview crawlers and headless scrapers)
  static BOT_PATTERNS = [
    /googlebot/i,
    /bingbot/i,
    /facebookexternalhit/i,
    /tiktokbot/i,
    /bytespider/i,
    /meta-externalagent/i,
    /twitterbot/i,
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
    const ua = userAgent.trim();

    // 1. WhatsApp In-App Browser on Mobile (Contains Mozilla/5.0 and WhatsApp/2.x) -> REAL HUMAN USER!
    // Example: Mozilla/5.0 (Linux; Android 14; ...) Chrome/... Mobile Safari/537.36 WhatsApp/2.24.18.77 A
    if (/whatsapp/i.test(ua) && /mozilla/i.test(ua)) {
      return false;
    }

    // 2. WhatsApp Link Preview Crawler (Starts with WhatsApp/ and has no browser token) -> BOT
    // Example: WhatsApp/2.21.12.21 N
    if (/^whatsapp\//i.test(ua)) {
      return true;
    }

    // 3. Instagram / TikTok / Facebook in-app browser -> REAL HUMAN USER
    if (/(instagram|fb_iab|bytedancewebview|tiktok)/i.test(ua) && /mozilla/i.test(ua)) {
      return false;
    }

    return this.BOT_PATTERNS.some(pattern => pattern.test(ua));
  }

  /**
   * Check if the IP is clicking too fast (Anti-Flood / Click Fraud)
   * Limit: Max 25 clicks per 10 seconds per IP (generous for testing & shared Wi-Fi NAT)
   */
  static checkRateLimit(ip) {
    if (!ip) return { isSpam: false, clickCount: 1 };

    // Bypass jika IP adalah internal proxy / private gateway agar tidak memblokir pengunjung massal & pengujian lokal
    if (GeoService.isPrivateIp(ip)) {
      return { isSpam: false, clickCount: 1 };
    }

    const now = Date.now();
    const windowMs = 10 * 1000; // 10 seconds window
    const maxClicks = 25; // Diperbesar dari 10 ke 25 agar pengujian link & NAT kantor tidak terblokir

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
