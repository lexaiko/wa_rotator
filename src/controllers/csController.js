import prisma from '../config/prisma.js';
import cacheService from '../services/cacheService.js';
import MessageService from '../services/messageService.js';

export class CSController {
  // GET /api/cs - List all CS Admins
  static async getAll(req, res) {
    try {
      const csList = await prisma.cSAdmin.findMany({
        orderBy: { name: 'asc' },
        include: {
          campaigns: {
            include: {
              campaign: {
                select: { id: true, title: true, slug: true }
              }
            }
          },
          _count: {
            select: { click_logs: true }
          }
        }
      });

      const results = csList.map(cs => ({
        ...cs,
        total_leads: cs._count.click_logs,
        campaign_count: cs.campaigns.length
      }));

      return res.json({ success: true, data: results });
    } catch (err) {
      console.error('Error fetching CS list:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/cs/:id - Single CS details
  static async getById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const cs = await prisma.cSAdmin.findUnique({
        where: { id },
        include: {
          campaigns: {
            include: { campaign: true }
          }
        }
      });

      if (!cs) {
        return res.status(404).json({ success: false, error: 'CS tidak ditemukan' });
      }

      return res.json({ success: true, data: cs });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/cs - Create CS Admin
  static async create(req, res) {
    try {
      const {
        name,
        phone_number,
        email,
        avatar_url,
        is_active,
        auto_schedule,
        schedule_start,
        schedule_end,
        enable_daily_cap,
        daily_lead_cap,
        crm_admin_id
      } = req.body;

      if (!name || !phone_number) {
        return res.status(400).json({ success: false, error: 'Nama dan Nomor WhatsApp wajib diisi' });
      }

      const cleanedPhone = MessageService.cleanPhoneNumber(phone_number);

      const cs = await prisma.cSAdmin.create({
        data: {
          name,
          phone_number: cleanedPhone,
          email: email || null,
          avatar_url: avatar_url || null,
          is_active: is_active !== undefined ? is_active : true,
          auto_schedule: auto_schedule || false,
          schedule_start: schedule_start || '08:00',
          schedule_end: schedule_end || '17:00',
          enable_daily_cap: enable_daily_cap || false,
          daily_lead_cap: parseInt(daily_lead_cap, 10) || 50,
          crm_admin_id: crm_admin_id ? parseInt(crm_admin_id, 10) : null
        }
      });

      cacheService.invalidate();
      return res.json({ success: true, data: cs });
    } catch (err) {
      console.error('Create CS error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT /api/cs/:id - Update CS Admin
  static async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const {
        name,
        phone_number,
        email,
        avatar_url,
        is_active,
        auto_schedule,
        schedule_start,
        schedule_end,
        enable_daily_cap,
        daily_lead_cap,
        crm_admin_id
      } = req.body;

      const cs = await prisma.cSAdmin.findUnique({ where: { id } });
      if (!cs) {
        return res.status(404).json({ success: false, error: 'CS tidak ditemukan' });
      }

      const cleanedPhone = phone_number ? MessageService.cleanPhoneNumber(phone_number) : cs.phone_number;

      const updated = await prisma.cSAdmin.update({
        where: { id },
        data: {
          name,
          phone_number: cleanedPhone,
          email,
          avatar_url,
          is_active,
          auto_schedule,
          schedule_start,
          schedule_end,
          enable_daily_cap,
          daily_lead_cap: daily_lead_cap !== undefined ? parseInt(daily_lead_cap, 10) : cs.daily_lead_cap,
          crm_admin_id: crm_admin_id ? parseInt(crm_admin_id, 10) : null
        }
      });

      cacheService.invalidate();
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('Update CS error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH /api/cs/:id/toggle - Quick Master On/Off Toggle
  static async toggle(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const cs = await prisma.cSAdmin.findUnique({ where: { id } });
      if (!cs) {
        return res.status(404).json({ success: false, error: 'CS tidak ditemukan' });
      }

      const updated = await prisma.cSAdmin.update({
        where: { id },
        data: { is_active: !cs.is_active }
      });

      cacheService.invalidate();
      return res.json({ success: true, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/cs/:id/reset-counter - Reset today lead counter for CS
  static async resetCounter(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await prisma.cSAdmin.update({
        where: { id },
        data: { today_lead_count: 0 }
      });

      cacheService.invalidate();
      return res.json({ success: true, message: 'Counter hari ini berhasil direset ke 0', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE /api/cs/:id - Delete CS Admin
  static async delete(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      await prisma.cSAdmin.delete({ where: { id } });
      cacheService.invalidate();
      return res.json({ success: true, message: 'CS Admin berhasil dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default CSController;
