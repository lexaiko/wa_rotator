import cron from 'node-cron';
import prisma from '../config/prisma.js';
import cacheService from '../services/cacheService.js';

export function setupDailyCron() {
  // Schedule reset daily at 00:00 (Midnight) WIB (Asia/Jakarta)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Menjalankan reset counter lead harian CS jam 00:00 WIB...');
    try {
      await prisma.cSAdmin.updateMany({
        data: {
          today_lead_count: 0
        }
      });
      cacheService.invalidate();
      console.log('[CRON] Reset counter lead harian selesai.');
    } catch (err) {
      console.error('[CRON] Gagal melakukan reset counter harian:', err.message);
    }
  }, {
    timezone: 'Asia/Jakarta'
  });
}

export default setupDailyCron;

