export class MessageService {
  /**
   * Normalize Indonesian WhatsApp Number to international format: 628xxx
   */
  static cleanPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('+62')) {
      cleaned = cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  }

  /**
   * Get Time-based Indonesian Greeting (Pagi, Siang, Sore, Malam)
   */
  static getTimeGreeting() {
    const wibHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric',
        hour12: false
      }).format(new Date()),
      10
    );

    if (wibHour >= 5 && wibHour < 11) return 'Pagi';
    if (wibHour >= 11 && wibHour < 15) return 'Siang';
    if (wibHour >= 15 && wibHour < 18) return 'Sore';
    return 'Malam';
  }

  /**
   * Dynamic placeholder replacement:
   * {nama_cs}, {cs_name}, {greeting}, {kota}, {city}, {channel}, {campaign}, {slug}, {source}
   */
  static formatMessage(template, params = {}) {
    if (!template) return '';

    const timeGreeting = this.getTimeGreeting();
    const replacements = {
      '{nama_cs}': params.csName || 'Admin',
      '{cs_name}': params.csName || 'Admin',
      '{greeting}': `Selamat ${timeGreeting}`,
      '{sapaan}': `Selamat ${timeGreeting}`,
      '{kota}': params.city || 'Indonesia',
      '{city}': params.city || 'Indonesia',
      '{channel}': params.channel || 'Website',
      '{source}': params.channel || 'Website',
      '{campaign}': params.campaignTitle || 'Trip Banyuwangi',
      '{slug}': params.slug || '',
      '{crm_keyword}': params.channel ? `[Ref: ${params.channel}]` : '[Ref: Web]'
    };

    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replaceAll(key, value);
    }

    return result;
  }

  /**
   * Build complete WhatsApp Click-to-Chat URL
   */
  static buildWhatsAppUrl(phone, text) {
    const cleanedPhone = this.cleanPhoneNumber(phone);
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
  }
}

export default MessageService;
