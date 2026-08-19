import prisma from '../config/prisma.js';
import RotatorEngine from '../services/rotatorEngine.js';
import MessageService from '../services/messageService.js';

export class SimulationController {
  // POST /api/simulation/run
  static async runSimulation(req, res) {
    try {
      const { campaign_id, iterations = 100, mock_city = 'Surabaya', ignore_schedule = false } = req.body;
      const count = Math.min(Math.max(parseInt(iterations, 10) || 100, 1), 1000);

      const campaign = await prisma.campaign.findUnique({
        where: { id: parseInt(campaign_id, 10) },
        include: {
          cs_assignments: {
            include: { cs: true }
          }
        }
      });

      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign tidak ditemukan' });
      }

      // Clone campaign for simulation, optionally disabling schedule check for pure testing
      const simCampaign = {
        ...campaign,
        sticky_session: false,
        cs_assignments: campaign.cs_assignments.map(ca => ({
          ...ca,
          cs: {
            ...ca.cs,
            auto_schedule: ignore_schedule ? false : ca.cs.auto_schedule,
            enable_daily_cap: ignore_schedule ? false : ca.cs.enable_daily_cap
          }
        }))
      };

      const results = new Map();
      const logs = [];

      // Initialize counter
      for (const ca of campaign.cs_assignments) {
        results.set(ca.cs.id, {
          cs_id: ca.cs.id,
          name: ca.cs.name,
          phone: ca.cs.phone_number,
          weight: ca.weight,
          count: 0,
          percentage: 0
        });
      }

      let fallbackCount = 0;

      // Run iterations
      for (let i = 0; i < count; i++) {
        const selection = RotatorEngine.selectCS(simCampaign, {
          ip: `192.168.1.${(i % 50) + 1}`,
          city: mock_city
        });

        if (selection.isFallback || !selection.selected) {
          fallbackCount++;
          if (logs.length < 15) {
            logs.push({
              iteration: i + 1,
              assigned_to: 'Fallback Number',
              phone: selection.fallbackNumber || '6281234567890'
            });
          }
        } else {
          const cs = selection.selected.cs;
          const current = results.get(cs.id);
          if (current) {
            current.count++;
          }
          if (logs.length < 15) {
            logs.push({
              iteration: i + 1,
              assigned_to: cs.name,
              phone: cs.phone_number,
              weight: selection.selected.weight
            });
          }
        }
      }

      const breakdown = Array.from(results.values()).map(r => ({
        ...r,
        percentage: Math.round((r.count / count) * 100)
      }));

      // Generate preview message
      const firstCS = campaign.cs_assignments[0]?.cs;
      const sampleMessage = MessageService.formatMessage(campaign.message_template, {
        csName: firstCS?.name || 'Admin',
        city: mock_city,
        channel: 'TikTok',
        campaignTitle: campaign.title,
        slug: campaign.slug
      });

      return res.json({
        success: true,
        data: {
          campaign_title: campaign.title,
          rotation_mode: campaign.rotation_mode,
          iterations: count,
          breakdown,
          fallback_count: fallbackCount,
          fallback_percentage: Math.round((fallbackCount / count) * 100),
          sample_logs: logs,
          sample_message: sampleMessage
        }
      });
    } catch (err) {
      console.error('Simulation error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default SimulationController;
