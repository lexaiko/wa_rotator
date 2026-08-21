import { UAParser } from 'ua-parser-js';

export class UserAgentService {
  static parse(uaString) {
    if (!uaString) {
      return {
        deviceType: 'mobile',
        os: 'Android',
        browser: 'Chrome'
      };
    }

    const parser = new UAParser(uaString);
    const result = parser.getResult();

    let deviceType = result.device.type || 'desktop';
    if (!result.device.type) {
      if (/mobile/i.test(uaString)) {
        deviceType = 'mobile';
      } else if (/tablet|ipad/i.test(uaString)) {
        deviceType = 'tablet';
      }
    }

    return {
      deviceType: deviceType.toLowerCase(),
      os: result.os.name || 'Unknown',
      browser: result.browser.name || 'Unknown'
    };
  }

  /**
   * Determine channel/referrer
   */
  static detectChannel(req) {
    const query = req.query || {};
    const utmSource = (query.utm_source || '').toLowerCase().trim();
    const referer = (req.headers['referer'] || '').toLowerCase();

    if (utmSource) {
      if (utmSource === 'ig' || utmSource.includes('instagram') || utmSource.includes('insta')) return 'Instagram';
      if (utmSource === 'tt' || utmSource.includes('tiktok')) return 'TikTok';
      if (utmSource === 'fb' || utmSource.includes('facebook') || utmSource.includes('meta')) return 'Facebook';
      if (utmSource === 'yt' || utmSource.includes('youtube')) return 'YouTube';
      if (utmSource === 'gads' || utmSource.includes('google')) return 'Google';
      if (utmSource === 'wa' || utmSource.includes('whatsapp')) return 'WhatsApp';
      if (utmSource === 'web' || utmSource.includes('website') || utmSource === 'lp') return 'Website';
      return utmSource.charAt(0).toUpperCase() + utmSource.slice(1);
    }

    if (referer) {
      if (referer.includes('tiktok')) return 'TikTok';
      if (referer.includes('instagram')) return 'Instagram';
      if (referer.includes('facebook') || referer.includes('fb.me')) return 'Facebook';
      if (referer.includes('google')) return 'Google';
      if (referer.includes('youtube')) return 'YouTube';
      if (referer.includes('tripbanyuwangi.com')) return 'Website';
    }

    return 'Direct';
  }
}

export default UserAgentService;
