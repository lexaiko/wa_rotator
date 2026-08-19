import cacheService from './cacheService.js';

export class RotatorEngine {
  /**
   * Filter eligible CS based on Active status, Working Hours, and Daily Lead Cap.
   */
  static filterEligibleCS(assignments, visitorCity = null) {
    if (!assignments || assignments.length === 0) return [];

    const now = new Date();
    // Use Western Indonesia Time (WIB = UTC+7)
    const wibFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const currentTimeStr = wibFormatter.format(now); // "HH:mm"

    return assignments.filter(assignment => {
      const cs = assignment.cs;
      // 1. Check Master CS status & Campaign Assignment status
      if (!assignment.is_active || !cs.is_active) {
        return false;
      }

      // 2. Check Auto Schedule (Working Hours)
      if (cs.auto_schedule && cs.schedule_start && cs.schedule_end) {
        const start = cs.schedule_start;
        const end = cs.schedule_end;
        if (start <= end) {
          // Normal day shift (e.g. 08:00 to 17:00)
          if (currentTimeStr < start || currentTimeStr > end) {
            return false;
          }
        } else {
          // Overnight shift (e.g. 21:00 to 05:00)
          if (currentTimeStr < start && currentTimeStr > end) {
            return false;
          }
        }
      }

      // 3. Check Daily Lead Cap
      if (cs.enable_daily_cap && cs.daily_lead_cap > 0) {
        if (cs.today_lead_count >= cs.daily_lead_cap) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Smooth Weighted Round-Robin (Nginx Algorithm)
   */
  static selectSmoothWeighted(campaignId, eligibleList) {
    if (eligibleList.length === 0) return null;
    if (eligibleList.length === 1) return eligibleList[0];

    // Get or initialize state for this campaign
    let state = cacheService.smoothWeightedState.get(campaignId);
    if (!state) {
      state = new Map();
      cacheService.smoothWeightedState.set(campaignId, state);
    }

    let totalWeight = 0;
    let selected = null;
    let maxCurrentWeight = -Infinity;

    // Iterate and update current weights
    for (const item of eligibleList) {
      const effectiveWeight = item.weight > 0 ? item.weight : 1;
      totalWeight += effectiveWeight;

      const currentWeight = (state.get(item.cs_id) || 0) + effectiveWeight;
      state.set(item.cs_id, currentWeight);

      if (currentWeight > maxCurrentWeight) {
        maxCurrentWeight = currentWeight;
        selected = item;
      }
    }

    // Deduct total weight from the winner
    if (selected) {
      const updatedWinnerWeight = state.get(selected.cs_id) - totalWeight;
      state.set(selected.cs_id, updatedWinnerWeight);
    }

    return selected;
  }

  /**
   * Probabilistic Weighted Random
   */
  static selectWeightedRandom(eligibleList) {
    if (eligibleList.length === 0) return null;
    if (eligibleList.length === 1) return eligibleList[0];

    const totalWeight = eligibleList.reduce((sum, item) => sum + (item.weight > 0 ? item.weight : 1), 0);
    let randomNum = Math.random() * totalWeight;

    for (const item of eligibleList) {
      const weight = item.weight > 0 ? item.weight : 1;
      if (randomNum < weight) {
        return item;
      }
      randomNum -= weight;
    }

    return eligibleList[eligibleList.length - 1];
  }

  /**
   * Strict Round-Robin (1:1:1 sequential)
   */
  static selectStrictRoundRobin(campaignId, eligibleList) {
    if (eligibleList.length === 0) return null;
    if (eligibleList.length === 1) return eligibleList[0];

    const currentIndex = cacheService.roundRobinState.get(campaignId) || 0;
    const selected = eligibleList[currentIndex % eligibleList.length];
    cacheService.roundRobinState.set(campaignId, currentIndex + 1);

    return selected;
  }

  /**
   * Main Dispatcher
   */
  static selectCS(campaign, visitorInfo = {}) {
    const assignments = campaign.cs_assignments || [];
    
    // Check Sticky Session first if enabled
    if (campaign.sticky_session && visitorInfo.ip) {
      const stickyCSId = cacheService.getStickyCS(campaign.id, visitorInfo.ip);
      if (stickyCSId) {
        const found = assignments.find(a => a.cs_id === stickyCSId && a.is_active && a.cs.is_active);
        if (found) {
          return { selected: found, isSticky: true, isFallback: false };
        }
      }
    }

    // Filter active and eligible CS
    const eligible = this.filterEligibleCS(assignments, visitorInfo.city);

    // If no CS eligible, return Fallback Number
    if (eligible.length === 0) {
      return {
        selected: null,
        isSticky: false,
        isFallback: true,
        fallbackNumber: campaign.fallback_number || '6281234567890'
      };
    }

    let selected = null;
    switch (campaign.rotation_mode) {
      case 'ROUND_ROBIN':
        selected = this.selectStrictRoundRobin(campaign.id, eligible);
        break;
      case 'RANDOM_WEIGHTED':
        selected = this.selectWeightedRandom(eligible);
        break;
      case 'SMOOTH_WEIGHTED':
      default:
        selected = this.selectSmoothWeighted(campaign.id, eligible);
        break;
    }

    // Save sticky session if enabled
    if (campaign.sticky_session && visitorInfo.ip && selected) {
      cacheService.setStickyCS(campaign.id, visitorInfo.ip, selected.cs_id, campaign.sticky_duration_hours || 24);
    }

    return {
      selected,
      isSticky: false,
      isFallback: false
    };
  }
}

export default RotatorEngine;
