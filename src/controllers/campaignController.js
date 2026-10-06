import prisma from '../config/prisma.js';
import cacheService from '../services/cacheService.js';

export class CampaignController {
  // GET /api/campaigns - Get all campaigns with assigned CS and click counts
  static async getAll(req, res) {
    try {
      const campaigns = await prisma.campaign.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          cs_assignments: {
            include: {
              cs: true
            }
          },
          _count: {
            select: { click_logs: true }
          }
        }
      });

      // Calculate today's clicks
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayStats = await prisma.clickLog.groupBy({
        by: ['campaign_id'],
        _count: { id: true },
        where: {
          created_at: { gte: startOfDay }
        }
      });

      const todayMap = new Map(todayStats.map(s => [s.campaign_id, s._count.id]));

      const results = campaigns.map(c => ({
        ...c,
        total_clicks: c._count.click_logs,
        today_clicks: todayMap.get(c.id) || 0
      }));

      return res.json({ success: true, data: results });
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/campaigns/:id - Get single campaign
  static async getById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          cs_assignments: {
            include: {
              cs: true
            }
          }
        }
      });

      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign tidak ditemukan' });
      }

      return res.json({ success: true, data: campaign });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/campaigns - Create campaign
  static async create(req, res) {
    try {
      const {
        title,
        slug,
        description,
        rotation_mode,
        message_template,
        fallback_number,
        redirect_mode,
        target_channel,
        pixel_fb_id,
        pixel_tiktok_id,
        pixel_ga_id,
        is_active,
        sticky_session,
        sticky_duration_hours,
        cs_assignments // array of { cs_id, weight, is_active, custom_message }
      } = req.body;

      if (!title || !slug) {
        return res.status(400).json({ success: false, error: 'Title dan Slug wajib diisi' });
      }

      // Check unique slug
      const existing = await prisma.campaign.findUnique({ where: { slug } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Slug sudah digunakan, silakan pilih slug lain' });
      }

      const campaign = await prisma.campaign.create({
        data: {
          title,
          slug: slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
          description,
          rotation_mode: rotation_mode || 'SMOOTH_WEIGHTED',
          message_template: message_template || 'Halo {nama_cs}, saya tertarik dengan paket wisata dari {channel}!',
          fallback_number: fallback_number || '6281234567890',
          redirect_mode: redirect_mode || 'INTERSTITIAL',
          target_channel: target_channel || 'AUTO',
          pixel_fb_id,
          pixel_tiktok_id,
          pixel_ga_id,
          is_active: is_active !== undefined ? is_active : true,
          sticky_session: sticky_session || false,
          sticky_duration_hours: sticky_duration_hours || 24,
          cs_assignments: {
            create: (cs_assignments || []).map(ca => ({
              cs_id: parseInt(ca.cs_id, 10),
              weight: parseInt(ca.weight, 10) || 10,
              is_active: ca.is_active !== undefined ? ca.is_active : true,
              custom_message: ca.custom_message || null
            }))
          }
        },
        include: {
          cs_assignments: {
            include: { cs: true }
          }
        }
      });

      cacheService.invalidate(campaign.slug, campaign.id);
      return res.json({ success: true, data: campaign });
    } catch (err) {
      console.error('Create campaign error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT /api/campaigns/:id - Update campaign
  static async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const {
        title,
        slug,
        description,
        rotation_mode,
        message_template,
        fallback_number,
        redirect_mode,
        target_channel,
        pixel_fb_id,
        pixel_tiktok_id,
        pixel_ga_id,
        is_active,
        sticky_session,
        sticky_duration_hours,
        cs_assignments
      } = req.body;

      const oldCampaign = await prisma.campaign.findUnique({ where: { id } });
      if (!oldCampaign) {
        return res.status(404).json({ success: false, error: 'Campaign tidak ditemukan' });
      }

      // Check slug uniqueness if changed
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (cleanSlug !== oldCampaign.slug) {
        const existing = await prisma.campaign.findUnique({ where: { slug: cleanSlug } });
        if (existing) {
          return res.status(400).json({ success: false, error: 'Slug baru sudah digunakan oleh campaign lain' });
        }
      }

      // Update main campaign
      const updated = await prisma.campaign.update({
        where: { id },
        data: {
          title,
          slug: cleanSlug,
          description,
          rotation_mode,
          message_template,
          fallback_number,
          redirect_mode,
          target_channel: target_channel || 'AUTO',
          pixel_fb_id,
          pixel_tiktok_id,
          pixel_ga_id,
          is_active,
          sticky_session,
          sticky_duration_hours
        }
      });

      // Update CS assignments if provided
      if (Array.isArray(cs_assignments)) {
        await prisma.campaignCS.deleteMany({ where: { campaign_id: id } });
        await prisma.campaignCS.createMany({
          data: cs_assignments.map(ca => ({
            campaign_id: id,
            cs_id: parseInt(ca.cs_id, 10),
            weight: parseInt(ca.weight, 10) || 10,
            is_active: ca.is_active !== undefined ? ca.is_active : true,
            custom_message: ca.custom_message || null
          }))
        });
      }

      cacheService.invalidate(oldCampaign.slug, id);
      cacheService.invalidate(cleanSlug, id);

      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('Update campaign error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH /api/campaigns/:id/toggle - Quick On/Off toggle
  static async toggle(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const campaign = await prisma.campaign.findUnique({ where: { id } });
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign tidak ditemukan' });
      }

      const updated = await prisma.campaign.update({
        where: { id },
        data: { is_active: !campaign.is_active }
      });

      cacheService.invalidate(campaign.slug, id);
      return res.json({ success: true, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE /api/campaigns/:id - Delete campaign
  static async delete(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const campaign = await prisma.campaign.findUnique({ where: { id } });
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign tidak ditemukan' });
      }

      await prisma.campaign.delete({ where: { id } });
      cacheService.invalidate(campaign.slug, id);

      return res.json({ success: true, message: 'Campaign berhasil dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default CampaignController;
