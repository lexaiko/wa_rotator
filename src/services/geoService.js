import geoip from 'geoip-lite';

export class GeoService {
  /**
   * Check if IP is private / local subnet / loopback / link-local
   */
  static isPrivateIp(ip) {
    if (!ip) return true;
    const clean = ip.replace(/^::ffff:/i, '').trim().toLowerCase();
    if (
      clean === '127.0.0.1' ||
      clean === '::1' ||
      clean === 'localhost' ||
      clean.startsWith('10.') ||
      clean.startsWith('192.168.') ||
      clean.startsWith('169.254.') ||
      clean.startsWith('fc00:') ||
      clean.startsWith('fe80:')
    ) {
      return true;
    }
    if (clean.startsWith('172.')) {
      const parts = clean.split('.');
      if (parts.length >= 2) {
        const second = parseInt(parts[1], 10);
        if (second >= 16 && second <= 31) return true;
      }
    }
    return false;
  }

  /**
   * Extract real client IP from Express request (handles Cloudflare, Nginx proxy, and direct)
   */
  static getClientIp(req) {
    if (!req) return '127.0.0.1';

    const getCleanHeader = (name) => {
      const val = req.headers?.[name];
      if (!val) return '';
      const str = Array.isArray(val) ? val[0] : val;
      return (str || '').trim().replace(/^::ffff:/i, '');
    };

    // 1. Direct Cloudflare connecting IP (authoritative when proxied through Cloudflare)
    const cfIp = getCleanHeader('cf-connecting-ip');
    if (cfIp) return cfIp;

    // 2. True-Client-IP (Cloudflare Enterprise / Akamai / custom proxy)
    const trueClientIp = getCleanHeader('true-client-ip');
    if (trueClientIp) return trueClientIp;

    // 3. X-Real-IP (Standard Nginx proxy header when direct / not proxied via Cloudflare)
    const realIp = getCleanHeader('x-real-ip');
    if (realIp && !GeoService.isPrivateIp(realIp)) {
      return realIp;
    }

    // 4. Scan X-Forwarded-For chain for first non-private public IP
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (forwardedFor) {
      const forwardedStr = Array.isArray(forwardedFor) ? forwardedFor.join(',') : forwardedFor;
      const parts = forwardedStr
        .split(',')
        .map(s => s.trim().replace(/^::ffff:/i, ''))
        .filter(Boolean);

      const publicIp = parts.find(p => !GeoService.isPrivateIp(p));
      if (publicIp) return publicIp;
      if (parts[0]) return parts[0];
    }

    // 5. Fallback to X-Real-IP even if private (e.g. testing in local container/subnetwork)
    if (realIp) return realIp;

    // 6. Express req.ip (Honors app.set('trust proxy', true))
    if (req.ip) {
      const cleanReqIp = req.ip.trim().replace(/^::ffff:/i, '');
      if (cleanReqIp && cleanReqIp !== '::1' && cleanReqIp !== '127.0.0.1') {
        return cleanReqIp;
      }
    }

    // 7. Fallback to direct TCP socket remoteAddress
    const socketIp = (req.socket?.remoteAddress || req.connection?.remoteAddress || '').trim().replace(/^::ffff:/i, '');
    if (socketIp) {
      return socketIp;
    }

    return '127.0.0.1';
  }

  /**
   * Lookup Geolocation from IP & Cloudflare headers
   */
  static lookup(ip, req = null) {
    const cleanIp = (ip || '').replace(/^::ffff:/i, '').trim();

    // Check Cloudflare Country header if req is provided
    let cfCountry = null;
    if (req && req.headers) {
      const headerCountry = req.headers['cf-ipcountry'];
      if (headerCountry) {
        const val = Array.isArray(headerCountry) ? headerCountry[0] : headerCountry;
        cfCountry = (val || '').toString().trim().toUpperCase();
      }
    }

    // If local or private IP (testing localhost / cluster), fallback to Jawa Timur
    if (!cleanIp || GeoService.isPrivateIp(cleanIp)) {
      return {
        country: cfCountry === 'ID' || !cfCountry ? 'Indonesia' : cfCountry,
        province: 'Jawa Timur',
        city: 'Surabaya',
        ll: [-7.2575, 112.7521]
      };
    }

    try {
      const geo = geoip.lookup(cleanIp);
      if (geo) {
        return {
          country: cfCountry === 'ID' || geo.country === 'ID' ? 'Indonesia' : (geo.country || 'Indonesia'),
          province: geo.region || 'Jawa Timur',
          city: geo.city || 'Surabaya',
          ll: geo.ll
        };
      }
    } catch (err) {
      console.error('GeoIP lookup error:', err.message);
    }

    return {
      country: cfCountry === 'ID' || !cfCountry ? 'Indonesia' : cfCountry,
      province: 'Jawa Timur',
      city: 'Surabaya',
      ll: null
    };
  }
}

export default GeoService;
