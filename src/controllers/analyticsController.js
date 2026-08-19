import prisma from '../config/prisma.js';

export class AnalyticsController {
  // GET /api/analytics/summary
  static async getSummary(req, res) {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalClicks,
        todayClicks,
        yesterdayClicks,
        weekClicks,
        monthClicks,
        activeCampaigns,
        totalCampaigns,
        activeCS,
        totalCS
      ] = await Promise.all([
        prisma.clickLog.count(),
        prisma.clickLog.count({ where: { created_at: { gte: startOfToday } } }),
        prisma.clickLog.count({
          where: {
            created_at: {
              gte: startOfYesterday,
              lt: startOfToday
            }
          }
        }),
        prisma.clickLog.count({ where: { created_at: { gte: startOfWeek } } }),
        prisma.clickLog.count({ where: { created_at: { gte: startOfMonth } } }),
        prisma.campaign.count({ where: { is_active: true } }),
        prisma.campaign.count(),
        prisma.cSAdmin.count({ where: { is_active: true } }),
        prisma.cSAdmin.count()
      ]);

      // Calculate growth vs yesterday
      let dailyGrowthPercent = 0;
      if (yesterdayClicks > 0) {
        dailyGrowthPercent = Math.round(((todayClicks - yesterdayClicks) / yesterdayClicks) * 100);
      } else if (todayClicks > 0) {
        dailyGrowthPercent = 100;
      }

      return res.json({
        success: true,
        data: {
          totalClicks,
          todayClicks,
          yesterdayClicks,
          dailyGrowthPercent,
          weekClicks,
          monthClicks,
          activeCampaigns,
          totalCampaigns,
          activeCS,
          totalCS
        }
      });
    } catch (err) {
      console.error('Error fetching analytics summary:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/analytics/timeseries?range=7d|30d|24h
  static async getTimeSeries(req, res) {
    try {
      const range = req.query.range || '7d';
      const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id, 10) : null;
      const now = new Date();

      if (range === '24h') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const logs = await prisma.clickLog.findMany({
          where: {
            created_at: { gte: startOfToday },
            ...(campaignId ? { campaign_id: campaignId } : {})
          },
          select: { created_at: true }
        });

        // Group by hour 0..23
        const hourlyData = Array.from({ length: 24 }, (_, i) => ({
          label: `${String(i).padStart(2, '0')}:00`,
          clicks: 0
        }));

        for (const log of logs) {
          const hour = new Date(log.created_at).getHours();
          if (hourlyData[hour]) {
            hourlyData[hour].clicks++;
          }
        }

        return res.json({ success: true, data: hourlyData });
      }

      // Range 7d or 30d
      const daysCount = range === '30d' ? 30 : 7;
      const startDate = new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);

      const logs = await prisma.clickLog.findMany({
        where: {
          created_at: { gte: startDate },
          ...(campaignId ? { campaign_id: campaignId } : {})
        },
        select: { created_at: true }
      });

      const dayMap = new Map();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;
        dayMap.set(key, 0);
      }

      for (const log of logs) {
        const d = new Date(log.created_at);
        const key = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;
        if (dayMap.has(key)) {
          dayMap.set(key, dayMap.get(key) + 1);
        }
      }

      const series = Array.from(dayMap.entries()).map(([label, clicks]) => ({ label, clicks }));
      return res.json({ success: true, data: series });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/analytics/channels (Social Media breakdown)
  static async getSocialBreakdown(req, res) {
    try {
      const logs = await prisma.clickLog.groupBy({
        by: ['utm_source'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      const data = logs.map(item => ({
        channel: item.utm_source || 'Direct',
        clicks: item._count.id
      }));

      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/analytics/geo (Top Cities & Provinces)
  static async getGeoBreakdown(req, res) {
    try {
      const [cities, provinces] = await Promise.all([
        prisma.clickLog.groupBy({
          by: ['city'],
          _count: { id: true },
          where: { city: { not: null } },
          orderBy: { _count: { id: 'desc' } },
          take: 8
        }),
        prisma.clickLog.groupBy({
          by: ['province'],
          _count: { id: true },
          where: { province: { not: null } },
          orderBy: { _count: { id: 'desc' } },
          take: 8
        })
      ]);

      return res.json({
        success: true,
        data: {
          cities: cities.map(c => ({ name: c.city, clicks: c._count.id })),
          provinces: provinces.map(p => ({ name: p.province, clicks: p._count.id }))
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/analytics/cs-performance
  static async getCSPerformance(req, res) {
    try {
      const csList = await prisma.cSAdmin.findMany({
        include: {
          _count: {
            select: { click_logs: true }
          }
        },
        orderBy: { click_logs: { _count: 'desc' } }
      });

      const totalLogs = csList.reduce((sum, cs) => sum + cs._count.click_logs, 0) || 1;

      const data = csList.map(cs => ({
        id: cs.id,
        name: cs.name,
        phone_number: cs.phone_number,
        is_active: cs.is_active,
        today_lead_count: cs.today_lead_count,
        total_leads: cs._count.click_logs,
        share_percentage: Math.round((cs._count.click_logs / totalLogs) * 100)
      }));

      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/analytics/logs (Paginated & Filterable Click Logs)
  static async getClickLogs(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id, 10) : undefined;
      const csId = req.query.cs_id ? parseInt(req.query.cs_id, 10) : undefined;
      const search = req.query.search || '';

      const where = {
        ...(campaignId ? { campaign_id: campaignId } : {}),
        ...(csId ? { cs_id: csId } : {}),
        ...(search ? {
          OR: [
            { city: { contains: search } },
            { province: { contains: search } },
            { utm_source: { contains: search } },
            { ip_address: { contains: search } }
          ]
        } : {})
      };

      const [total, logs] = await Promise.all([
        prisma.clickLog.count({ where }),
        prisma.clickLog.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            campaign: { select: { id: true, title: true, slug: true } },
            cs: { select: { id: true, name: true, phone_number: true } }
          }
        })
      ]);

      return res.json({
        success: true,
        data: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/analytics/export - Export Click Logs as CSV
  static async exportCsv(req, res) {
    try {
      const logs = await prisma.clickLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 5000,
        include: {
          campaign: { select: { title: true, slug: true } },
          cs: { select: { name: true, phone_number: true } }
        }
      });

      const csvHeader = 'Waktu,Campaign,Slug,CS Assigned,Nomor CS,Channel/Sosmed,Kota,Provinsi,IP,Device,OS,Browser\n';
      const csvRows = logs.map(l => {
        const time = new Date(l.created_at).toISOString();
        const camp = `"${(l.campaign?.title || '').replace(/"/g, '""')}"`;
        const slug = l.campaign?.slug || '';
        const csName = `"${(l.cs?.name || 'Fallback').replace(/"/g, '""')}"`;
        const csPhone = l.cs?.phone_number || '';
        const source = l.utm_source || 'Direct';
        const city = l.city || '-';
        const province = l.province || '-';
        const ip = l.ip_address || '-';
        const dev = l.device_type || '-';
        const os = l.os || '-';
        const browser = l.browser || '-';
        return `${time},${camp},${slug},${csName},${csPhone},${source},${city},${province},${ip},${dev},${os},${browser}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=tripbwi_rotator_leads_${Date.now()}.csv`);
      return res.send(csvHeader + csvRows);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default AnalyticsController;
