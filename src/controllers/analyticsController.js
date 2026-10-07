import prisma from '../config/prisma.js';

export class AnalyticsController {
  /**
   * Helper to parse date range filters like CRM:
   * today | yesterday | 7d | this_week | 30d | this_month | last_month | all_time | custom
   */
  static parseDateRange(query) {
    const range = query.range || 'this_month';
    const now = new Date();
    let startDate = null;
    let endDate = null;
    let periodType = 'day'; // 'hour', 'day', 'month'

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      periodType = 'hour';
    } else if (range === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      periodType = 'hour';
    } else if (range === '7d' || range === 'last_7_days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      periodType = 'day';
    } else if (range === 'this_week') {
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday start
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      endDate = new Date();
      periodType = 'day';
    } else if (range === '30d' || range === 'last_30_days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      periodType = 'day';
    } else if (range === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date();
      periodType = 'day';
    } else if (range === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      periodType = 'day';
    } else if (range === 'custom') {
      if (query.start_date) {
        startDate = new Date(query.start_date);
        startDate.setHours(0, 0, 0, 0);
      }
      if (query.end_date) {
        endDate = new Date(query.end_date);
        endDate.setHours(23, 59, 59, 999);
      }
      if (startDate && endDate) {
        const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          periodType = 'hour';
        } else if (diffDays <= 31) {
          periodType = 'day';
        } else {
          periodType = 'month';
        }
      }
    } else if (range === 'all_time') {
      startDate = null;
      endDate = null;
      periodType = 'auto';
    }

    const dateFilter = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    return {
      range,
      startDate,
      endDate,
      periodType,
      dateFilter: Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {}
    };
  }

  // GET /api/analytics/summary?range=...&start_date=...&end_date=...&campaign_id=...
  static async getSummary(req, res) {
    try {
      const { dateFilter, startDate, endDate, range } = AnalyticsController.parseDateRange(req.query);
      const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id, 10) : undefined;
      const csId = req.query.cs_id ? parseInt(req.query.cs_id, 10) : undefined;

      const baseWhere = {
        ...(campaignId ? { campaign_id: campaignId } : {}),
        ...(csId ? { cs_id: csId } : {})
      };

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

      // Previous period calculation for growth comparison
      let prevWhere = null;
      if (startDate && endDate) {
        const duration = endDate.getTime() - startDate.getTime();
        const prevStart = new Date(startDate.getTime() - duration);
        const prevEnd = new Date(startDate.getTime() - 1);
        prevWhere = {
          ...baseWhere,
          created_at: { gte: prevStart, lte: prevEnd }
        };
      }

      const [
        periodClicks,
        prevPeriodClicks,
        totalAllTimeClicks,
        todayClicks,
        yesterdayClicks,
        activeCampaigns,
        totalCampaigns,
        activeCS,
        totalCS
      ] = await Promise.all([
        prisma.clickLog.count({ where: { ...baseWhere, ...dateFilter } }),
        prevWhere ? prisma.clickLog.count({ where: prevWhere }) : Promise.resolve(0),
        prisma.clickLog.count({ where: baseWhere }),
        prisma.clickLog.count({ where: { ...baseWhere, created_at: { gte: startOfToday } } }),
        prisma.clickLog.count({
          where: {
            ...baseWhere,
            created_at: { gte: startOfYesterday, lte: endOfYesterday }
          }
        }),
        prisma.campaign.count({ where: { is_active: true } }),
        prisma.campaign.count(),
        prisma.cSAdmin.count({ where: { is_active: true } }),
        prisma.cSAdmin.count()
      ]);

      // Calculate growth percent
      let growthPercent = 0;
      if (prevPeriodClicks > 0) {
        growthPercent = Math.round(((periodClicks - prevPeriodClicks) / prevPeriodClicks) * 100);
      } else if (periodClicks > 0) {
        growthPercent = 100;
      }

      let dailyGrowthPercent = 0;
      if (yesterdayClicks > 0) {
        dailyGrowthPercent = Math.round(((todayClicks - yesterdayClicks) / yesterdayClicks) * 100);
      } else if (todayClicks > 0) {
        dailyGrowthPercent = 100;
      }

      return res.json({
        success: true,
        data: {
          periodClicks,
          prevPeriodClicks,
          growthPercent,
          totalClicks: totalAllTimeClicks,
          todayClicks,
          yesterdayClicks,
          dailyGrowthPercent,
          activeCampaigns,
          totalCampaigns,
          activeCS,
          totalCS,
          selectedRange: range,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null
        }
      });
    } catch (err) {
      console.error('Error fetching analytics summary:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/analytics/timeseries?range=...&start_date=...&end_date=...&campaign_id=...
  static async getTimeSeries(req, res) {
    try {
      const { dateFilter, startDate, endDate, periodType, range } = AnalyticsController.parseDateRange(req.query);
      const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id, 10) : undefined;
      const csId = req.query.cs_id ? parseInt(req.query.cs_id, 10) : undefined;

      const where = {
        ...(campaignId ? { campaign_id: campaignId } : {}),
        ...(csId ? { cs_id: csId } : {}),
        ...dateFilter
      };

      const logs = await prisma.clickLog.findMany({
        where,
        select: { created_at: true },
        orderBy: { created_at: 'asc' }
      });

      // 1. Hourly grouping (24 hours)
      if (periodType === 'hour') {
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

      // Determine date span
      let start = startDate ? new Date(startDate) : null;
      let end = endDate ? new Date(endDate) : new Date();

      if (!start) {
        if (logs.length > 0) {
          start = new Date(logs[0].created_at);
          start.setHours(0, 0, 0, 0);
        } else {
          start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
      }

      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      // 2. Monthly grouping if duration > 90 days or range === 'all_time' with long span
      if (periodType === 'month' || diffDays > 90) {
        const monthMap = new Map();
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

        while (cur <= endMonth) {
          const key = cur.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
          monthMap.set(key, 0);
          cur.setMonth(cur.getMonth() + 1);
        }

        for (const log of logs) {
          const d = new Date(log.created_at);
          const key = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
          if (monthMap.has(key)) {
            monthMap.set(key, monthMap.get(key) + 1);
          }
        }

        const series = Array.from(monthMap.entries()).map(([label, clicks]) => ({ label, clicks }));
        return res.json({ success: true, data: series });
      }

      // 3. Daily grouping (for ranges <= 90 days)
      const dayMap = new Map();
      const cur = new Date(start);
      while (cur <= end) {
        const key = `${cur.getDate()} ${cur.toLocaleString('id-ID', { month: 'short' })}`;
        dayMap.set(key, 0);
        cur.setDate(cur.getDate() + 1);
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

  // GET /api/analytics/channels?range=...&start_date=...&end_date=...
  static async getSocialBreakdown(req, res) {
    try {
      const { dateFilter } = AnalyticsController.parseDateRange(req.query);
      const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id, 10) : undefined;
      const csId = req.query.cs_id ? parseInt(req.query.cs_id, 10) : undefined;

      const where = {
        ...(campaignId ? { campaign_id: campaignId } : {}),
        ...(csId ? { cs_id: csId } : {}),
        ...dateFilter
      };

      const logs = await prisma.clickLog.groupBy({
        by: ['utm_source'],
        _count: { id: true },
        where,
        orderBy: { _count: { id: 'desc' } }
      });

      const normalizeChannel = (raw) => {
        if (!raw) return 'Direct / Bio';
        const lower = raw.toLowerCase().trim();
        if (lower === 'ig' || lower === 'instagram') return 'Instagram';
        if (lower === 'tt' || lower === 'tiktok') return 'TikTok';
        if (lower === 'web' || lower === 'website') return 'Website';
        if (lower === 'fb' || lower === 'facebook' || lower === 'meta') return 'Facebook';
        if (lower === 'google' || lower === 'ads') return 'Google Ads';
        return raw.charAt(0).toUpperCase() + raw.slice(1);
      };

      const aggregated = new Map();
      for (const item of logs) {
        const canonical = normalizeChannel(item.utm_source);
        const count = item._count.id;
        aggregated.set(canonical, (aggregated.get(canonical) || 0) + count);
      }

      const data = Array.from(aggregated.entries())
        .map(([channel, clicks]) => ({ channel, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/analytics/geo?range=...&start_date=...&end_date=...
  static async getGeoBreakdown(req, res) {
    try {
      const { dateFilter } = AnalyticsController.parseDateRange(req.query);
      const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id, 10) : undefined;

      const where = {
        ...(campaignId ? { campaign_id: campaignId } : {}),
        ...dateFilter
      };

      const [cities, provinces] = await Promise.all([
        prisma.clickLog.groupBy({
          by: ['city'],
          _count: { id: true },
          where: { ...where, city: { not: null } },
          orderBy: { _count: { id: 'desc' } },
          take: 8
        }),
        prisma.clickLog.groupBy({
          by: ['province'],
          _count: { id: true },
          where: { ...where, province: { not: null } },
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

  // GET /api/analytics/cs-performance?range=...&start_date=...&end_date=...
  static async getCSPerformance(req, res) {
    try {
      const { dateFilter } = AnalyticsController.parseDateRange(req.query);
      const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id, 10) : undefined;

      const csList = await prisma.cSAdmin.findMany({
        orderBy: { name: 'asc' }
      });

      const csStats = await Promise.all(
        csList.map(async (cs) => {
          const leadCount = await prisma.clickLog.count({
            where: {
              cs_id: cs.id,
              ...(campaignId ? { campaign_id: campaignId } : {}),
              ...dateFilter
            }
          });
          return {
            id: cs.id,
            name: cs.name,
            phone_number: cs.phone_number,
            avatar_url: cs.avatar_url,
            is_active: cs.is_active,
            enable_daily_cap: cs.enable_daily_cap,
            daily_lead_cap: cs.daily_lead_cap,
            today_lead_count: cs.today_lead_count,
            period_leads: leadCount
          };
        })
      );

      const totalPeriodLeads = csStats.reduce((sum, cs) => sum + cs.period_leads, 0) || 1;

      const data = csStats.map(cs => ({
        ...cs,
        share_percentage: Math.round((cs.period_leads / totalPeriodLeads) * 100)
      })).sort((a, b) => b.period_leads - a.period_leads);

      return res.json({ success: true, data, totalPeriodLeads: totalPeriodLeads === 1 && csStats.every(c => c.period_leads === 0) ? 0 : totalPeriodLeads });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/analytics/logs (Paginated & Filterable Click Logs with Date Range)
  static async getClickLogs(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id, 10) : undefined;
      const csId = req.query.cs_id ? parseInt(req.query.cs_id, 10) : undefined;
      const search = req.query.search || '';

      const { dateFilter } = AnalyticsController.parseDateRange(req.query);

      const where = {
        ...(campaignId ? { campaign_id: campaignId } : {}),
        ...(csId ? { cs_id: csId } : {}),
        ...dateFilter,
        ...(search ? {
          OR: [
            { city: { contains: search } },
            { province: { contains: search } },
            { utm_source: { contains: search } },
            { ip_address: { contains: search } },
            { utm_campaign: { contains: search } }
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
            cs: { select: { id: true, name: true, phone_number: true, avatar_url: true } }
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

  // GET /api/analytics/export - Export Click Logs as CSV with Date Range Filter
  static async exportCsv(req, res) {
    try {
      const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id, 10) : undefined;
      const csId = req.query.cs_id ? parseInt(req.query.cs_id, 10) : undefined;
      const search = req.query.search || '';
      const { dateFilter } = AnalyticsController.parseDateRange(req.query);

      const where = {
        ...(campaignId ? { campaign_id: campaignId } : {}),
        ...(csId ? { cs_id: csId } : {}),
        ...dateFilter,
        ...(search ? {
          OR: [
            { city: { contains: search } },
            { province: { contains: search } },
            { utm_source: { contains: search } },
            { ip_address: { contains: search } }
          ]
        } : {})
      };

      const logs = await prisma.clickLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: 10000,
        include: {
          campaign: { select: { title: true, slug: true } },
          cs: { select: { name: true, phone_number: true } }
        }
      });

      const csvHeader = 'Waktu (WIB),Kampanye,Slug,CS Assigned,Nomor CS,Channel/Sosmed,Kota,Provinsi,IP,Perangkat,OS,Browser,Redirect URL\n';
      const csvRows = logs.map(l => {
        const time = new Date(l.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const camp = `"${(l.campaign?.title || '').replace(/"/g, '""')}"`;
        const slug = l.campaign?.slug || '';
        const csName = `"${(l.cs?.name || 'Fallback Darurat').replace(/"/g, '""')}"`;
        const csPhone = l.cs?.phone_number || '';
        const source = l.utm_source ? (l.utm_source.toLowerCase() === 'ig' ? 'Instagram' : l.utm_source) : 'Direct';
        const city = `"${(l.city || '-').replace(/"/g, '""')}"`;
        const province = `"${(l.province || '-').replace(/"/g, '""')}"`;
        const ip = l.ip_address || '-';
        const dev = l.device_type || '-';
        const os = l.os || '-';
        const browser = l.browser || '-';
        const redirectUrl = `"${(l.redirect_url || '').replace(/"/g, '""')}"`;
        return `"${time}",${camp},${slug},${csName},${csPhone},${source},${city},${province},${ip},${dev},${os},${browser},${redirectUrl}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=tripbwi_rotator_leads_${Date.now()}.csv`);
      return res.send('\uFEFF' + csvHeader + csvRows); // Add BOM for Excel UTF-8
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default AnalyticsController;
