import prisma from '../config/prisma.js';

// Default rules yang persis sama dengan CRM (hai = website, halo = instagram, hola = tiktok)
export const DEFAULT_GREETING_RULES = [
  { keyword: 'hai', source: 'website' },
  { keyword: 'halo', source: 'instagram' },
  { keyword: 'hola', source: 'tiktok' }
];

export const REFERRAL_SOURCES = [
  'instagram',
  'tiktok',
  'website',
  'rekomendasi',
  'facebook',
  'lainnya'
];

let cache = null;
let categoriesCache = null;

export class GreetingService {
  /**
   * Get all source categories (from memory cache when available)
   */
  static async getSourceCategories() {
    if (categoriesCache !== null) return categoriesCache;
    try {
      const cats = await prisma.sourceCategory.findMany({
        where: { is_active: true },
        orderBy: [{ sort_order: 'asc' }, { id: 'asc' }]
      });
      categoriesCache = cats;
      return categoriesCache;
    } catch (err) {
      console.error('[GreetingService] Failed to load source categories:', err.message);
      return [];
    }
  }

  /**
   * Get all greeting rules (from memory cache when available)
   */
  static async getGreetingRules() {
    if (cache !== null) return cache;
    try {
      const rules = await prisma.greetingRule.findMany({
        orderBy: { keyword: 'asc' }
      });

      if (rules.length === 0) {
        // Seed default rules if table is empty
        await this.seedDefaults();
        const seeded = await prisma.greetingRule.findMany({
          orderBy: { keyword: 'asc' }
        });
        cache = seeded;
        return cache;
      }

      cache = rules;
      return cache;
    } catch (err) {
      console.error('[GreetingService] Failed to load greeting rules from DB, using fallback:', err.message);
      return DEFAULT_GREETING_RULES;
    }
  }

  /**
   * Clear cache
   */
  static invalidateCache() {
    cache = null;
    categoriesCache = null;
  }

  /**
   * Seed default rules if database is empty
   */
  static async seedDefaults() {
    try {
      for (const rule of DEFAULT_GREETING_RULES) {
        await prisma.greetingRule.upsert({
          where: { keyword: rule.keyword },
          update: { source: rule.source },
          create: { keyword: rule.keyword, source: rule.source }
        });
      }
    } catch (e) {
      console.warn('[GreetingService] Seed defaults warning:', e.message);
    }
  }

  /**
   * Get greeting keyword based on detected traffic source/channel
   * e.g. "TikTok" -> "Hola", "Website" -> "Hi", "Instagram" -> "Halo"
   */
  static async getGreetingKeywordForSource(sourceName = '') {
    const rules = await this.getGreetingRules();
    const cleanSource = (sourceName || '').toLowerCase().trim();

    // Map common aliases to CRM standard referral sources
    let targetSource = cleanSource;
    if (cleanSource === 'ig' || cleanSource.includes('instagram') || cleanSource.includes('insta')) targetSource = 'instagram';
    else if (cleanSource === 'tt' || cleanSource.includes('tiktok')) targetSource = 'tiktok';
    else if (cleanSource === 'web' || cleanSource.includes('website') || cleanSource === 'lp' || cleanSource === 'direct') targetSource = 'website';
    else if (cleanSource === 'fb' || cleanSource.includes('facebook') || cleanSource.includes('meta')) targetSource = 'facebook';

    // 1. Match from DB / loaded rules
    const matched = rules.find(r => r.source.toLowerCase() === targetSource);
    if (matched && matched.keyword) {
      return this.capitalizeFirst(matched.keyword);
    }

    // 2. Fallback matching default rules
    const def = DEFAULT_GREETING_RULES.find(r => r.source.toLowerCase() === targetSource);
    if (def && def.keyword) {
      return this.capitalizeFirst(def.keyword);
    }

    // Default fallback to "Halo" if not mapped
    return 'Halo';
  }

  /**
   * Synchronous version for rapid render (uses memory cache or defaults)
   */
  static getGreetingKeywordForSourceSync(sourceName = '') {
    const rules = cache || DEFAULT_GREETING_RULES;
    const cleanSource = (sourceName || '').toLowerCase().trim();

    let targetSource = cleanSource;
    if (cleanSource === 'ig' || cleanSource.includes('instagram') || cleanSource.includes('insta')) targetSource = 'instagram';
    else if (cleanSource === 'tt' || cleanSource.includes('tiktok')) targetSource = 'tiktok';
    else if (cleanSource === 'web' || cleanSource.includes('website') || cleanSource === 'lp' || cleanSource === 'direct') targetSource = 'website';
    else if (cleanSource === 'fb' || cleanSource.includes('facebook') || cleanSource.includes('meta')) targetSource = 'facebook';

    const matched = rules.find(r => r.source.toLowerCase() === targetSource);
    if (matched && matched.keyword) {
      return this.capitalizeFirst(matched.keyword);
    }
    const def = DEFAULT_GREETING_RULES.find(r => r.source.toLowerCase() === targetSource);
    if (def && def.keyword) {
      return this.capitalizeFirst(def.keyword);
    }
    return 'Halo';
  }

  static capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Create new greeting rule
   */
  static async createRule(keyword, source) {
    const cleanKeyword = keyword.trim().toLowerCase();
    const cleanSource = source.trim().toLowerCase();

    const existing = await prisma.greetingRule.findUnique({
      where: { keyword: cleanKeyword }
    });

    if (existing) {
      throw new Error(`Kata sapaan "${cleanKeyword}" sudah digunakan.`);
    }

    const created = await prisma.greetingRule.create({
      data: {
        keyword: cleanKeyword,
        source: cleanSource
      }
    });

    this.invalidateCache();
    return created;
  }

  /**
   * Update greeting rule
   */
  static async updateRule(id, data) {
    const updateData = {};
    if (data.keyword !== undefined) updateData.keyword = data.keyword.trim().toLowerCase();
    if (data.source !== undefined) updateData.source = data.source.trim().toLowerCase();

    const updated = await prisma.greetingRule.update({
      where: { id: parseInt(id, 10) },
      data: updateData
    });

    this.invalidateCache();
    return updated;
  }

  /**
   * Delete greeting rule
   */
  static async deleteRule(id) {
    const deleted = await prisma.greetingRule.delete({
      where: { id: parseInt(id, 10) }
    });
    this.invalidateCache();
    return deleted;
  }

  /**
   * Sync greeting rules from CRM (../crm)
   */
  static async syncFromCrm() {
    let syncedRules = [];
    let source = 'fallback';

    // 1. Try importing from ../crm/src/services/greeting-rules.js if available
    try {
      const crmModule = await import('../../../crm/src/services/greeting-rules.js');
      if (crmModule && typeof crmModule.getGreetingRules === 'function') {
        const crmRules = await crmModule.getGreetingRules();
        if (Array.isArray(crmRules) && crmRules.length > 0) {
          syncedRules = crmRules;
          source = 'crm-module';
        }
      }
    } catch (modErr) {
      // Ignore module import error
    }

    // 2. Try fetching from CRM API if running on port 3002
    if (syncedRules.length === 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('http://localhost:3002/api/greeting-rules', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            syncedRules = json.data;
            source = 'crm-api';
          }
        }
      } catch (apiErr) {
        // CRM server not reachable
      }
    }

    // 3. Fallback to standard CRM default rules
    if (syncedRules.length === 0) {
      syncedRules = DEFAULT_GREETING_RULES;
      source = 'crm-defaults';
    }

    // Reset and Upsert into local database
    for (const rule of syncedRules) {
      if (!rule.keyword || !rule.source) continue;
      const kw = rule.keyword.trim().toLowerCase();
      const sc = rule.source.trim().toLowerCase();

      await prisma.greetingRule.upsert({
        where: { keyword: kw },
        update: { source: sc },
        create: { keyword: kw, source: sc }
      });
    }

    this.invalidateCache();
    const finalRules = await this.getGreetingRules();
    return {
      success: true,
      source,
      synced_count: syncedRules.length,
      rules: finalRules
    };
  }
}

export default GreetingService;
