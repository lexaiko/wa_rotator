import prisma from '../config/prisma.js';

class SettingsController {
  /**
   * Get all system settings
   * GET /api/settings
   */
  async getSettings(req, res) {
    try {
      const records = await prisma.systemSetting.findMany();
      const settingsMap = {};

      records.forEach((rec) => {
        settingsMap[rec.key] = rec.value;
      });

      // Default values
      const responseData = {
        default_fallback_number: settingsMap['DEFAULT_FALLBACK_NUMBER'] || process.env.DEFAULT_FALLBACK_NUMBER || '6281234567890',
        default_brand_name: settingsMap['DEFAULT_BRAND_NAME'] || process.env.DEFAULT_BRAND_NAME || 'TripBanyuwangi.com',
        ...settingsMap
      };

      return res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil pengaturan sistem.',
        error: error.message
      });
    }
  }

  /**
   * Update system settings
   * POST /api/settings or PUT /api/settings
   */
  async updateSettings(req, res) {
    try {
      const { fallback_number, brand_name, default_fallback_number, default_brand_name } = req.body;

      const numToSave = fallback_number || default_fallback_number;
      const brandToSave = brand_name || default_brand_name;

      const updates = [];

      if (numToSave) {
        // Clean phone number (only digits)
        const cleanNumber = String(numToSave).replace(/\D/g, '');
        updates.push(
          prisma.systemSetting.upsert({
            where: { key: 'DEFAULT_FALLBACK_NUMBER' },
            update: { value: cleanNumber },
            create: { key: 'DEFAULT_FALLBACK_NUMBER', value: cleanNumber }
          })
        );
      }

      if (brandToSave) {
        updates.push(
          prisma.systemSetting.upsert({
            where: { key: 'DEFAULT_BRAND_NAME' },
            update: { value: String(brandToSave).trim() },
            create: { key: 'DEFAULT_BRAND_NAME', value: String(brandToSave).trim() }
          })
        );
      }

      await Promise.all(updates);

      // Fetch fresh settings
      const records = await prisma.systemSetting.findMany();
      const settingsMap = {};
      records.forEach((rec) => {
        settingsMap[rec.key] = rec.value;
      });

      return res.status(200).json({
        success: true,
        message: 'Pengaturan sistem berhasil disimpan.',
        data: {
          default_fallback_number: settingsMap['DEFAULT_FALLBACK_NUMBER'] || process.env.DEFAULT_FALLBACK_NUMBER || '6281234567890',
          default_brand_name: settingsMap['DEFAULT_BRAND_NAME'] || process.env.DEFAULT_BRAND_NAME || 'TripBanyuwangi.com',
          ...settingsMap
        }
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan pengaturan sistem.',
        error: error.message
      });
    }
  }
}

export default new SettingsController();
