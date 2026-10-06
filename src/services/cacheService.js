import prisma from '../config/prisma.js';

class CacheService {
  constructor() {
    this.campaignCache = new Map(); // slug -> { campaign, csList, expiresAt }
    this.ttl = 60 * 1000; // 60 seconds TTL
    this.roundRobinState = new Map(); // campaignId -> currentIndex
    this.smoothWeightedState = new Map(); // campaignId -> Map(csId -> currentWeight)
    this.stickySessions = new Map(); // `${campaignId}_${ip}` -> { csId, expiresAt }
  }

  async getCampaign(slug) {
    const now = Date.now();
    const cached = this.campaignCache.get(slug);

    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    // Query from database
    const campaign = await prisma.campaign.findUnique({
      where: { slug },
      include: {
        cs_assignments: {
          include: {
            cs: true
          }
        }
      }
    });

    if (!campaign) {
      this.campaignCache.set(slug, { data: null, expiresAt: now + 10000 }); // negative cache 10s
      return null;
    }

    const payload = {
      ...campaign,
      cs_assignments: campaign.cs_assignments.map(ca => ({
        id: ca.id,
        cs_id: ca.cs_id,
        weight: ca.weight,
        is_active: ca.is_active,
        custom_message: ca.custom_message,
        cs: {
          id: ca.cs.id,
          name: ca.cs.name,
          phone_number: ca.cs.phone_number,
          is_active: ca.cs.is_active,
          auto_schedule: ca.cs.auto_schedule,
          schedule_start: ca.cs.schedule_start,
          schedule_end: ca.cs.schedule_end,
          enable_daily_cap: ca.cs.enable_daily_cap,
          daily_lead_cap: ca.cs.daily_lead_cap,
          today_lead_count: ca.cs.today_lead_count,
        }
      }))
    };

    this.campaignCache.set(slug, { data: payload, expiresAt: now + this.ttl });
    return payload;
  }

  invalidate(slug = null, campaignId = null) {
    if (slug) {
      this.campaignCache.delete(slug);
    } else {
      this.campaignCache.clear();
    }

    if (campaignId) {
      this.smoothWeightedState.delete(campaignId);
      this.roundRobinState.delete(campaignId);
      for (const key of this.stickySessions.keys()) {
        if (key.startsWith(`${campaignId}_`)) {
          this.stickySessions.delete(key);
        }
      }
    } else if (!slug) {
      this.smoothWeightedState.clear();
      this.roundRobinState.clear();
      this.stickySessions.clear();
    }
  }

  clearStickyForCampaign(campaignId) {
    if (!campaignId) return;
    for (const key of this.stickySessions.keys()) {
      if (key.startsWith(`${campaignId}_`)) {
        this.stickySessions.delete(key);
      }
    }
  }

  // Sticky session handling
  getStickyCS(campaignId, ip) {
    if (!ip) return null;
    const key = `${campaignId}_${ip}`;
    const item = this.stickySessions.get(key);
    if (item && item.expiresAt > Date.now()) {
      return item.csId;
    }
    this.stickySessions.delete(key);
    return null;
  }

  setStickyCS(campaignId, ip, csId, durationHours = 24) {
    if (!ip || !csId) return;
    const key = `${campaignId}_${ip}`;
    this.stickySessions.set(key, {
      csId,
      expiresAt: Date.now() + durationHours * 3600 * 1000
    });
  }
}

const cacheService = new CacheService();
export default cacheService;
