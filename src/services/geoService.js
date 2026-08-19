import geoip from 'geoip-lite';

export class GeoService {
  /**
   * Extract real client IP from Express request (handles Cloudflare, Nginx proxy, and direct)
   */
  static getClientIp(req) {
    const forwarded = req.headers['cf-connecting-ip'] ||
                      req.headers['x-real-ip'] ||
                      req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim().replace('::ffff:', '');
    }
    const rawIp = req.socket?.remoteAddress || req.ip || '127.0.0.1';
    return rawIp.replace('::ffff:', '');
  }

  /**
   * Lookup Geolocation from IP
   */
  static lookup(ip) {
    const cleanIp = (ip || '').replace('::ffff:', '').trim();

    // If local or private IP (Testing di Localhost), beri default kota Jawa Timur
    if (
      !cleanIp ||
      cleanIp === '127.0.0.1' ||
      cleanIp === '::1' ||
      cleanIp === 'localhost' ||
      cleanIp.startsWith('192.168.') ||
      cleanIp.startsWith('10.') ||
      cleanIp.startsWith('172.16.')
    ) {
      return {
        country: 'Indonesia',
        province: 'Jawa Timur',
        city: 'Surabaya',
        ll: [-7.2575, 112.7521]
      };
    }

    try {
      const geo = geoip.lookup(cleanIp);
      if (geo) {
        return {
          country: geo.country === 'ID' ? 'Indonesia' : geo.country,
          province: geo.region || 'Jawa Timur',
          city: geo.city || 'Surabaya',
          ll: geo.ll
        };
      }
    } catch (err) {
      console.error('GeoIP lookup error:', err.message);
    }

    return {
      country: 'Indonesia',
      province: 'Jawa Timur',
      city: 'Surabaya',
      ll: null
    };
  }
}

export default GeoService;
