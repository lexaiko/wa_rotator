import GreetingService from '../services/greetingService.js';

export class GreetingController {
  /**
   * GET /api/greeting-rules
   */
  static async getAll(req, res) {
    try {
      const rules = await GreetingService.getGreetingRules();
      return res.json({ success: true, data: rules });
    } catch (err) {
      console.error('Get greeting rules error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/greeting-rules
   */
  static async create(req, res) {
    try {
      const { keyword, source } = req.body;
      if (!keyword || !source) {
        return res.status(400).json({ success: false, error: 'Keyword dan Source wajib diisi.' });
      }
      const rule = await GreetingService.createRule(keyword, source);
      return res.status(201).json({ success: true, data: rule });
    } catch (err) {
      console.error('Create greeting rule error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/greeting-rules/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { keyword, source } = req.body;
      const rule = await GreetingService.updateRule(id, { keyword, source });
      return res.json({ success: true, data: rule });
    } catch (err) {
      console.error('Update greeting rule error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/greeting-rules/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      await GreetingService.deleteRule(id);
      return res.json({ success: true, message: 'Aturan sapaan berhasil dihapus.' });
    } catch (err) {
      console.error('Delete greeting rule error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/greeting-rules/sync-crm
   */
  static async syncCrm(req, res) {
    try {
      const result = await GreetingService.syncFromCrm();
      return res.json({
        success: true,
        message: `Berhasil menyinkronkan ${result.synced_count} aturan sapaan dari CRM.`,
        data: result.rules,
        source: result.source
      });
    } catch (err) {
      console.error('Sync CRM greeting rules error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default GreetingController;
