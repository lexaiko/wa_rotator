import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';

export class BackupController {
  // GET /api/backup/export?type=full|campaigns|cs|logs
  static async exportData(req, res) {
    try {
      const type = req.query.type || 'full';
      const download = req.query.download === 'true';

      let campaigns = [];
      let csList = [];
      let campaignCS = [];
      let clickLogs = [];
      let systemSettings = [];

      if (type === 'full' || type === 'campaigns') {
        campaigns = await prisma.campaign.findMany({
          include: {
            cs_assignments: {
              include: { cs: { select: { id: true, name: true, phone_number: true } } }
            }
          }
        });
      }

      if (type === 'full' || type === 'cs') {
        csList = await prisma.cSAdmin.findMany();
      }

      if (type === 'full') {
        campaignCS = await prisma.campaignCS.findMany();
        systemSettings = await prisma.systemSetting.findMany();
      }

      if (type === 'full' || type === 'logs') {
        // Limit export logs to 50000 for safety or all
        clickLogs = await prisma.clickLog.findMany({
          orderBy: { created_at: 'desc' },
          take: 50000
        });
      }

      const backupPayload = {
        meta: {
          app: 'TripBanyuwangi WA Rotator',
          version: '1.0.0',
          export_type: type,
          exported_at: new Date().toISOString(),
          exported_by: req.user?.name || 'Super Admin',
          counts: {
            campaigns: campaigns.length,
            cs_admins: csList.length,
            campaign_cs: campaignCS.length,
            click_logs: clickLogs.length,
            system_settings: systemSettings.length
          }
        },
        data: {
          campaigns,
          csList,
          campaignCS,
          clickLogs,
          systemSettings
        }
      };

      // Save last backup timestamp in SystemSetting
      await prisma.systemSetting.upsert({
        where: { key: 'LAST_BACKUP_DATE' },
        update: { value: new Date().toISOString() },
        create: { key: 'LAST_BACKUP_DATE', value: new Date().toISOString() }
      });

      if (download) {
        const filename = `tripbwi_rotator_backup_${type}_${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(JSON.stringify(backupPayload, null, 2));
      }

      return res.json({
        success: true,
        backup: backupPayload
      });
    } catch (err) {
      console.error('Error exporting backup:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/backup/import
  static async importData(req, res) {
    try {
      const { backup, mode = 'replace' } = req.body;

      if (!backup || !backup.data) {
        return res.status(400).json({
          success: false,
          error: 'Format file backup tidak valid. Objek data tidak ditemukan.'
        });
      }

      const { campaigns = [], csList = [], campaignCS = [], clickLogs = [], systemSettings = [] } = backup.data;

      let resultCounts = {
        campaigns: 0,
        csList: 0,
        campaignCS: 0,
        clickLogs: 0
      };

      if (mode === 'replace') {
        // Full atomic replace in transaction
        await prisma.$transaction(async (tx) => {
          // 1. Wipe existing data (order matters for FK constraints)
          await tx.clickLog.deleteMany({});
          await tx.campaignCS.deleteMany({});
          await tx.campaign.deleteMany({});
          await tx.cSAdmin.deleteMany({});

          // 2. Map old CS IDs to new CS IDs if autoincrement changes
          const csIdMap = new Map();
          for (const cs of csList) {
            const created = await tx.cSAdmin.create({
              data: {
                name: cs.name,
                phone_number: cs.phone_number,
                email: cs.email,
                avatar_url: cs.avatar_url,
                is_active: cs.is_active !== undefined ? cs.is_active : true,
                auto_schedule: cs.auto_schedule || false,
                schedule_start: cs.schedule_start || '08:00',
                schedule_end: cs.schedule_end || '17:00',
                enable_daily_cap: cs.enable_daily_cap || false,
                daily_lead_cap: cs.daily_lead_cap || 50,
                today_lead_count: cs.today_lead_count || 0,
                crm_admin_id: cs.crm_admin_id || null
              }
            });
            csIdMap.set(cs.id, created.id);
            resultCounts.csList++;
          }

          // 3. Insert Campaigns and map IDs
          const campIdMap = new Map();
          for (const camp of campaigns) {
            const created = await tx.campaign.create({
              data: {
                slug: camp.slug,
                title: camp.title,
                description: camp.description,
                rotation_mode: camp.rotation_mode || 'SMOOTH_WEIGHTED',
                message_template: camp.message_template || 'Halo {nama_cs}!',
                fallback_number: camp.fallback_number || '6281234567890',
                redirect_mode: camp.redirect_mode || 'INTERSTITIAL',
                pixel_fb_id: camp.pixel_fb_id,
                pixel_tiktok_id: camp.pixel_tiktok_id,
                pixel_ga_id: camp.pixel_ga_id,
                is_active: camp.is_active !== undefined ? camp.is_active : true,
                sticky_session: camp.sticky_session || false,
                sticky_duration_hours: camp.sticky_duration_hours || 24,
                enable_geo_routing: camp.enable_geo_routing || false
              }
            });
            campIdMap.set(camp.id, created.id);
            resultCounts.campaigns++;
          }

          // 4. Insert Campaign CS assignments
          const assignmentsToCreate = [];
          if (campaignCS.length > 0) {
            for (const assign of campaignCS) {
              const newCampId = campIdMap.get(assign.campaign_id);
              const newCsId = csIdMap.get(assign.cs_id);
              if (newCampId && newCsId) {
                assignmentsToCreate.push({
                  campaign_id: newCampId,
                  cs_id: newCsId,
                  weight: assign.weight || 10,
                  is_active: assign.is_active !== undefined ? assign.is_active : true,
                  custom_message: assign.custom_message || null
                });
              }
            }
          } else {
            // Check if assignments were embedded in campaigns
            for (const camp of campaigns) {
              const newCampId = campIdMap.get(camp.id);
              if (newCampId && Array.isArray(camp.cs_assignments)) {
                for (const assign of camp.cs_assignments) {
                  const newCsId = csIdMap.get(assign.cs_id);
                  if (newCsId) {
                    assignmentsToCreate.push({
                      campaign_id: newCampId,
                      cs_id: newCsId,
                      weight: assign.weight || 10,
                      is_active: assign.is_active !== undefined ? assign.is_active : true,
                      custom_message: assign.custom_message || null
                    });
                  }
                }
              }
            }
          }

          for (const assign of assignmentsToCreate) {
            await tx.campaignCS.create({ data: assign });
            resultCounts.campaignCS++;
          }

          // 5. Insert Click Logs in chunks
          if (clickLogs.length > 0) {
            const logsToInsert = clickLogs.map(log => ({
              campaign_id: campIdMap.get(log.campaign_id) || Array.from(campIdMap.values())[0] || 1,
              cs_id: csIdMap.get(log.cs_id) || null,
              ip_address: log.ip_address,
              user_agent: log.user_agent,
              device_type: log.device_type,
              os: log.os,
              browser: log.browser,
              country: log.country || 'Indonesia',
              province: log.province,
              city: log.city,
              referrer: log.referrer,
              utm_source: log.utm_source,
              utm_medium: log.utm_medium,
              utm_campaign: log.utm_campaign,
              utm_content: log.utm_content,
              utm_term: log.utm_term,
              redirect_url: log.redirect_url,
              created_at: log.created_at ? new Date(log.created_at) : new Date()
            }));

            // Chunk in groups of 500
            for (let i = 0; i < logsToInsert.length; i += 500) {
              const chunk = logsToInsert.slice(i, i + 500);
              await tx.clickLog.createMany({ data: chunk });
            }
            resultCounts.clickLogs = logsToInsert.length;
          }
        });
      } else {
        // Mode 'merge': Upsert CS and Campaigns without wiping
        await prisma.$transaction(async (tx) => {
          // Upsert CS
          const csIdMap = new Map();
          for (const cs of csList) {
            const existing = await tx.cSAdmin.findFirst({
              where: {
                OR: [
                  { phone_number: cs.phone_number },
                  { name: cs.name }
                ]
              }
            });

            if (existing) {
              csIdMap.set(cs.id, existing.id);
            } else {
              const created = await tx.cSAdmin.create({
                data: {
                  name: cs.name,
                  phone_number: cs.phone_number,
                  email: cs.email,
                  avatar_url: cs.avatar_url,
                  is_active: cs.is_active !== undefined ? cs.is_active : true,
                  auto_schedule: cs.auto_schedule || false,
                  schedule_start: cs.schedule_start || '08:00',
                  schedule_end: cs.schedule_end || '17:00',
                  enable_daily_cap: cs.enable_daily_cap || false,
                  daily_lead_cap: cs.daily_lead_cap || 50
                }
              });
              csIdMap.set(cs.id, created.id);
              resultCounts.csList++;
            }
          }

          // Upsert Campaigns
          const campIdMap = new Map();
          for (const camp of campaigns) {
            let existing = await tx.campaign.findUnique({
              where: { slug: camp.slug }
            });

            if (existing) {
              campIdMap.set(camp.id, existing.id);
            } else {
              const created = await tx.campaign.create({
                data: {
                  slug: camp.slug,
                  title: camp.title,
                  description: camp.description,
                  rotation_mode: camp.rotation_mode || 'SMOOTH_WEIGHTED',
                  message_template: camp.message_template || 'Halo {nama_cs}!',
                  fallback_number: camp.fallback_number || '6281234567890',
                  redirect_mode: camp.redirect_mode || 'INTERSTITIAL',
                  pixel_fb_id: camp.pixel_fb_id,
                  pixel_tiktok_id: camp.pixel_tiktok_id,
                  is_active: camp.is_active !== undefined ? camp.is_active : true
                }
              });
              campIdMap.set(camp.id, created.id);
              resultCounts.campaigns++;
            }
          }

          // Merge Assignments
          for (const assign of campaignCS) {
            const newCampId = campIdMap.get(assign.campaign_id);
            const newCsId = csIdMap.get(assign.cs_id);
            if (newCampId && newCsId) {
              const existingAssign = await tx.campaignCS.findUnique({
                where: {
                  campaign_id_cs_id: { campaign_id: newCampId, cs_id: newCsId }
                }
              });
              if (!existingAssign) {
                await tx.campaignCS.create({
                  data: {
                    campaign_id: newCampId,
                    cs_id: newCsId,
                    weight: assign.weight || 10,
                    is_active: assign.is_active !== undefined ? assign.is_active : true
                  }
                });
                resultCounts.campaignCS++;
              }
            }
          }
        });
      }

      return res.json({
        success: true,
        message: `Restore data berhasil! Mode: ${mode}`,
        counts: resultCounts
      });
    } catch (err) {
      console.error('Error importing backup:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/backup/stats
  static async getStats(req, res) {
    try {
      const [
        totalCampaigns,
        totalCS,
        totalLogs,
        lastBackupSetting
      ] = await Promise.all([
        prisma.campaign.count(),
        prisma.cSAdmin.count(),
        prisma.clickLog.count(),
        prisma.systemSetting.findUnique({ where: { key: 'LAST_BACKUP_DATE' } })
      ]);

      // Estimate DB file size if sqlite
      let dbSizeBytes = 0;
      try {
        const dbPath = path.resolve('dev.db');
        if (fs.existsSync(dbPath)) {
          const stats = fs.statSync(dbPath);
          dbSizeBytes = stats.size;
        }
      } catch (e) {
        // ignore
      }

      return res.json({
        success: true,
        data: {
          totalCampaigns,
          totalCS,
          totalLogs,
          lastBackupDate: lastBackupSetting ? lastBackupSetting.value : null,
          dbSizeBytes,
          dbSizeReadable: `${(dbSizeBytes / (1024 * 1024)).toFixed(2)} MB`
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/backup/reset
  static async resetData(req, res) {
    try {
      const { action, confirmation } = req.body;

      if (confirmation !== 'KONFIRMASI_RESET') {
        return res.status(400).json({
          success: false,
          error: 'Konfirmasi keamanan tidak valid. Ketik "KONFIRMASI_RESET" untuk melanjutkan.'
        });
      }

      if (action === 'reset_logs') {
        const count = await prisma.clickLog.deleteMany({});
        return res.json({
          success: true,
          message: `Berhasil menghapus ${count.count} data riwayat log klik.`
        });
      }

      if (action === 'reset_counters') {
        await prisma.cSAdmin.updateMany({
          data: { today_lead_count: 0 }
        });
        return res.json({
          success: true,
          message: 'Berhasil me-reset hitungan lead harian semua CS menjadi 0.'
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Aksi reset tidak dikenal.'
      });
    } catch (err) {
      console.error('Error resetting data:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default BackupController;
