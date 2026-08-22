import prisma from '../config/prisma.js';
import GreetingService from '../services/greetingService.js';

export const DEFAULT_SOURCE_CATEGORIES = [
  {
    name: 'TikTok',
    code: 'tiktok',
    greeting_keyword: 'hola',
    icon_type: 'tiktok',
    badge_color: 'rose',
    description: 'Link Bio TikTok & Iklan TikTok Ads',
    sort_order: 1,
    is_active: true
  },
  {
    name: 'Instagram',
    code: 'instagram',
    greeting_keyword: 'halo',
    icon_type: 'instagram',
    badge_color: 'purple',
    description: 'Link Bio Instagram & IG Story',
    sort_order: 2,
    is_active: true
  },
  {
    name: 'Website',
    code: 'website',
    greeting_keyword: 'hai',
    icon_type: 'website',
    badge_color: 'emerald',
    description: 'Tombol WhatsApp di Website & Landing Page',
    sort_order: 3,
    is_active: true
  },
  {
    name: 'Facebook',
    code: 'facebook',
    greeting_keyword: 'halo',
    icon_type: 'facebook',
    badge_color: 'blue',
    description: 'Meta Ads & Fanpage Facebook',
    sort_order: 4,
    is_active: true
  },
  {
    name: 'Google',
    code: 'google',
    greeting_keyword: 'halo',
    icon_type: 'google',
    badge_color: 'amber',
    description: 'Google Ads & Search Traffic',
    sort_order: 5,
    is_active: true
  },
  {
    name: 'YouTube',
    code: 'youtube',
    greeting_keyword: 'halo',
    icon_type: 'youtube',
    badge_color: 'red',
    description: 'Link Deskripsi & Bio YouTube',
    sort_order: 6,
    is_active: true
  },
  {
    name: 'Rekomendasi',
    code: 'rekomendasi',
    greeting_keyword: 'halo',
    icon_type: 'users',
    badge_color: 'teal',
    description: 'Referral Word of Mouth & Relasi',
    sort_order: 7,
    is_active: true
  },
  {
    name: 'Otomatis',
    code: 'auto',
    greeting_keyword: 'hai',
    icon_type: 'auto',
    badge_color: 'slate',
    description: 'Deteksi Otomatis Referrer & Parameter UTM',
    sort_order: 8,
    is_active: true
  }
];

export class SourceCategoryController {
  /**
   * GET /api/source-categories
   */
  static async getAll(req, res) {
    try {
      let categories = await prisma.sourceCategory.findMany({
        orderBy: [{ sort_order: 'asc' }, { id: 'asc' }]
      });

      // Auto seed if empty
      if (categories.length === 0) {
        await prisma.sourceCategory.createMany({
          data: DEFAULT_SOURCE_CATEGORIES
        });
        categories = await prisma.sourceCategory.findMany({
          orderBy: [{ sort_order: 'asc' }, { id: 'asc' }]
        });
      }

      return res.json({ success: true, data: categories });
    } catch (err) {
      console.error('Get source categories error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/source-categories/:id
   */
  static async getById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await prisma.sourceCategory.findUnique({ where: { id } });
      if (!category) {
        return res.status(404).json({ success: false, error: 'Kategori tidak ditemukan' });
      }
      return res.json({ success: true, data: category });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/source-categories
   */
  static async create(req, res) {
    try {
      const {
        name,
        code,
        greeting_keyword,
        icon_type,
        badge_color,
        description,
        sort_order
      } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Nama kategori wajib diisi.' });
      }

      const cleanCode = (code || name).toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      const cleanKeyword = (greeting_keyword || 'halo').trim().toLowerCase();

      // Check uniqueness of code
      const existing = await prisma.sourceCategory.findUnique({ where: { code: cleanCode } });
      if (existing) {
        return res.status(400).json({ success: false, error: `Kode sumber "${cleanCode}" sudah digunakan.` });
      }

      const category = await prisma.sourceCategory.create({
        data: {
          name,
          code: cleanCode,
          greeting_keyword: cleanKeyword,
          icon_type: icon_type || 'globe',
          badge_color: badge_color || 'slate',
          description: description || null,
          sort_order: parseInt(sort_order, 10) || 0,
          is_active: true
        }
      });

      // Also ensure GreetingRule is updated/created
      if (cleanKeyword) {
        try {
          await prisma.greetingRule.upsert({
            where: { keyword: cleanKeyword },
            update: { source: cleanCode },
            create: { keyword: cleanKeyword, source: cleanCode }
          });
          GreetingService.invalidateCache();
        } catch (e) {
          // ignore duplicate keyword conflict
        }
      }

      return res.status(201).json({ success: true, data: category });
    } catch (err) {
      console.error('Create source category error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/source-categories/:id
   */
  static async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const {
        name,
        code,
        greeting_keyword,
        icon_type,
        badge_color,
        description,
        sort_order,
        is_active
      } = req.body;

      const old = await prisma.sourceCategory.findUnique({ where: { id } });
      if (!old) {
        return res.status(404).json({ success: false, error: 'Kategori tidak ditemukan' });
      }

      const cleanCode = code ? code.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-') : old.code;
      const cleanKeyword = greeting_keyword !== undefined ? greeting_keyword.trim().toLowerCase() : old.greeting_keyword;

      // Check unique code if changed
      if (cleanCode !== old.code) {
        const existing = await prisma.sourceCategory.findUnique({ where: { code: cleanCode } });
        if (existing) {
          return res.status(400).json({ success: false, error: `Kode sumber "${cleanCode}" sudah digunakan.` });
        }
      }

      const updated = await prisma.sourceCategory.update({
        where: { id },
        data: {
          name: name !== undefined ? name : old.name,
          code: cleanCode,
          greeting_keyword: cleanKeyword,
          icon_type: icon_type !== undefined ? icon_type : old.icon_type,
          badge_color: badge_color !== undefined ? badge_color : old.badge_color,
          description: description !== undefined ? description : old.description,
          sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : old.sort_order,
          is_active: is_active !== undefined ? is_active : old.is_active
        }
      });

      // Update GreetingRule
      if (cleanKeyword) {
        try {
          await prisma.greetingRule.upsert({
            where: { keyword: cleanKeyword },
            update: { source: cleanCode },
            create: { keyword: cleanKeyword, source: cleanCode }
          });
          GreetingService.invalidateCache();
        } catch (e) {
          // ignore
        }
      }

      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('Update source category error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/source-categories/:id
   */
  static async delete(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const old = await prisma.sourceCategory.findUnique({ where: { id } });
      if (!old) {
        return res.status(404).json({ success: false, error: 'Kategori tidak ditemukan' });
      }

      await prisma.sourceCategory.delete({ where: { id } });
      return res.json({ success: true, message: 'Kategori berhasil dihapus.' });
    } catch (err) {
      console.error('Delete source category error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * PATCH /api/source-categories/:id/toggle
   */
  static async toggle(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const old = await prisma.sourceCategory.findUnique({ where: { id } });
      if (!old) {
        return res.status(404).json({ success: false, error: 'Kategori tidak ditemukan' });
      }

      const updated = await prisma.sourceCategory.update({
        where: { id },
        data: { is_active: !old.is_active }
      });

      return res.json({ success: true, data: updated });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}

export default SourceCategoryController;
