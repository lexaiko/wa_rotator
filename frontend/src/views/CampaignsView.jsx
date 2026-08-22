import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CSAvatar from '../components/CSAvatar.jsx';
import { useModal } from '../context/ModalContext.jsx';
import {
  PLATFORM_REGISTRY,
  COLOR_THEMES,
  getPlatformMeta,
  getIconComponent,
  PlatformBadge,
  TikTokIcon,
  InstagramIcon,
  WebsiteIcon,
  FacebookIcon
} from '../components/SocialIcons.jsx';
import {
  Megaphone,
  Plus,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  Zap,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Eye,
  ShieldCheck,
  Globe,
  Compass,
  Scale,
  CheckSquare,
  Square,
  Search,
  Layers,
  Filter,
  X
} from 'lucide-react';

const SOURCE_GROUPS = [
  {
    id: 'TIKTOK',
    label: 'TikTok',
    sapaan: 'Hola',
    desc: 'Link Bio TikTok & Iklan TikTok Ads',
    Icon: TikTokIcon,
    theme: PLATFORM_REGISTRY.tiktok.theme
  },
  {
    id: 'INSTAGRAM',
    label: 'Instagram',
    sapaan: 'Halo',
    desc: 'Link Bio Instagram & IG Story',
    Icon: InstagramIcon,
    theme: PLATFORM_REGISTRY.instagram.theme
  },
  {
    id: 'WEBSITE',
    label: 'Website',
    sapaan: 'Hai',
    desc: 'Tombol WhatsApp di Website & Landing Page',
    Icon: WebsiteIcon,
    theme: PLATFORM_REGISTRY.website.theme
  },
  {
    id: 'FACEBOOK',
    label: 'Facebook',
    sapaan: 'Halo',
    desc: 'Meta Ads & Fanpage Facebook',
    Icon: FacebookIcon,
    theme: PLATFORM_REGISTRY.facebook.theme
  },
  {
    id: 'AUTO',
    label: 'Otomatis / Multi-Channel',
    sapaan: 'Dinamis',
    desc: 'Deteksi Otomatis Referrer & Parameter UTM',
    Icon: Compass,
    theme: PLATFORM_REGISTRY.auto.theme
  }
];

const getNormalizedSource = (target_channel) => {
  const tc = (target_channel || 'AUTO').toUpperCase();
  if (tc === 'TIKTOK' || tc === 'TT') return 'TIKTOK';
  if (tc === 'INSTAGRAM' || tc === 'IG') return 'INSTAGRAM';
  if (tc === 'WEBSITE' || tc === 'WEB' || tc === 'DIRECT') return 'WEBSITE';
  if (tc === 'FACEBOOK' || tc === 'FB') return 'FACEBOOK';
  return 'AUTO';
};

export default function CampaignsView({ campaigns: propCampaigns = [], csList, onRefresh }) {
  const { showConfirm, showAlert, showToast } = useModal();
  const [campaigns, setCampaigns] = useState(propCampaigns);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(propCampaigns.length === 0);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    rotation_mode: 'SMOOTH_WEIGHTED',
    message_template: '{greeting} {nama_cs}, saya tertarik dengan promo {campaign} dari {channel}. Boleh minta info detail & pricelistnya?',
    fallback_number: '6281234567890',
    redirect_mode: 'INTERSTITIAL',
    target_channel: 'AUTO',
    pixel_fb_id: '',
    pixel_tiktok_id: '',
    pixel_ga_id: '',
    is_active: true,
    sticky_session: false,
    sticky_duration_hours: 24,
    cs_assignments: []
  });

  useEffect(() => {
    fetchCategories();
    if (propCampaigns.length > 0) {
      setCampaigns(propCampaigns);
      setLoading(false);
    } else {
      fetchCampaigns();
    }
  }, [propCampaigns]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/source-categories', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load categories in CampaignsView:', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build dynamic source groups from database categories
  const activeGroups = categories.length > 0
    ? categories.filter(c => c.is_active).map(cat => ({
        id: cat.code.toUpperCase(),
        code: cat.code,
        label: cat.name,
        sapaan: cat.greeting_keyword,
        desc: cat.description || `Platform ${cat.name}`,
        Icon: getIconComponent(cat.icon_type),
        theme: COLOR_THEMES[cat.badge_color] || COLOR_THEMES.slate
      }))
    : SOURCE_GROUPS;

  const isCampaignInGroup = (campTargetChannel, group) => {
    const target = (campTargetChannel || 'AUTO').trim().toUpperCase();
    const groupId = (group.id || '').trim().toUpperCase();
    const groupCode = (group.code || '').trim().toUpperCase();
    const groupLabel = (group.label || '').trim().toUpperCase();

    // Exact matches
    if (target === groupId || target === groupCode || target === groupLabel) return true;

    // Auto / General matching
    if ((target === 'AUTO' || !target) && (groupId === 'AUTO' || groupCode === 'AUTO' || groupLabel === 'OTOMATIS')) return true;

    // Standard platform aliases
    const isTargetInstagram = target === 'IG' || target === 'INSTAGRAM';
    const isGroupInstagram = groupId === 'IG' || groupId === 'INSTAGRAM' || groupCode === 'IG' || groupCode === 'INSTAGRAM' || groupLabel === 'INSTAGRAM';
    if (isTargetInstagram && isGroupInstagram) return true;

    const isTargetTikTok = target === 'TT' || target === 'TIKTOK';
    const isGroupTikTok = groupId === 'TT' || groupId === 'TIKTOK' || groupCode === 'TT' || groupCode === 'TIKTOK' || groupLabel === 'TIKTOK';
    if (isTargetTikTok && isGroupTikTok) return true;

    const isTargetWeb = target === 'WEB' || target === 'WEBSITE' || target === 'DIRECT';
    const isGroupWeb = groupId === 'WEB' || groupId === 'WEBSITE' || groupCode === 'WEB' || groupCode === 'WEBSITE' || groupLabel === 'WEBSITE';
    if (isTargetWeb && isGroupWeb) return true;

    const isTargetFB = target === 'FB' || target === 'FACEBOOK';
    const isGroupFB = groupId === 'FB' || groupId === 'FACEBOOK' || groupCode === 'FB' || groupCode === 'FACEBOOK' || groupLabel === 'FACEBOOK';
    if (isTargetFB && isGroupFB) return true;

    const isTargetYT = target === 'YT' || target === 'YOUTUBE';
    const isGroupYT = groupId === 'YT' || groupId === 'YOUTUBE' || groupCode === 'YT' || groupCode === 'YOUTUBE' || groupLabel === 'YOUTUBE';
    if (isTargetYT && isGroupYT) return true;

    // Match against any category records
    const matchedCategory = categories.find(c => c.code.toUpperCase() === target || c.name.toUpperCase() === target);
    if (matchedCategory) {
      if (matchedCategory.code.toUpperCase() === groupCode || matchedCategory.name.toUpperCase() === groupLabel) {
        return true;
      }
    }

    return false;
  };

  const generateSlugWithChannel = (rawText, channelCode) => {
    if (!rawText) return '';
    let base = rawText.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!base) return '';

    // Strip any existing category code suffix dynamically from database categories
    for (const cat of categories) {
      const code = cat.code.toLowerCase();
      if (base.endsWith(`-${code}`)) {
        base = base.slice(0, -(code.length + 1));
        break;
      }
    }

    if (!channelCode || channelCode.toUpperCase() === 'AUTO') {
      return base;
    }

    const matched = categories.find(c => c.code.toUpperCase() === channelCode.toUpperCase());
    const suffix = matched ? matched.code.toLowerCase() : channelCode.toLowerCase();

    return `${base}-${suffix}`;
  };

  const getRotatorBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    // Jika sedang di dev server Vite (port 5173), arahkan ke Backend Rotator (port 3001)
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    return window.location.origin;
  };

  const handleCopyLink = (slug) => {
    const baseUrl = getRotatorBaseUrl();
    const url = `${baseUrl}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    showToast(`Link ${url} berhasil disalin ke clipboard!`, 'success', 2500);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(campaigns.map(c => c.id === id ? { ...c, is_active: data.data.is_active } : c));
        showToast(`Kampanye berhasil diubah menjadi ${data.data.is_active ? 'Aktif' : 'Nonaktif'}.`, 'info');
        onRefresh();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Hapus Kampanye Rotator?',
      message: 'Apakah Anda yakin ingin menghapus kampanye ini? Link tidak akan dapat diakses lagi oleh pengunjung.',
      confirmText: 'Hapus Kampanye',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/campaigns/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          const data = await res.json();
          if (data.success) {
            setCampaigns(campaigns.filter(c => c.id !== id));
            showToast('Kampanye berhasil dihapus.', 'success');
            onRefresh();
          }
        } catch (err) {
          console.error('Delete error:', err);
        }
      }
    });
  };

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      rotation_mode: 'SMOOTH_WEIGHTED',
      message_template: '{greeting} {nama_cs}, saya tertarik dengan promo {campaign} dari {channel}.',
      fallback_number: '6281234567890',
      redirect_mode: 'INTERSTITIAL',
      target_channel: 'AUTO',
      pixel_fb_id: '',
      pixel_tiktok_id: '',
      pixel_ga_id: '',
      is_active: true,
      sticky_session: false,
      sticky_duration_hours: 24,
      cs_assignments: csList.map(cs => ({
        cs_id: cs.id,
        cs_name: cs.name,
        weight: 30,
        is_active: cs.is_active
      }))
    });
    setIsModalOpen(true);
  };

  const openEditModal = (camp) => {
    setEditingCampaign(camp);
    setFormData({
      title: camp.title,
      slug: camp.slug,
      description: camp.description || '',
      rotation_mode: camp.rotation_mode,
      message_template: camp.message_template,
      fallback_number: camp.fallback_number || '6281234567890',
      redirect_mode: camp.redirect_mode,
      target_channel: camp.target_channel || 'AUTO',
      pixel_fb_id: camp.pixel_fb_id || '',
      pixel_tiktok_id: camp.pixel_tiktok_id || '',
      pixel_ga_id: camp.pixel_ga_id || '',
      is_active: camp.is_active,
      sticky_session: camp.sticky_session,
      sticky_duration_hours: camp.sticky_duration_hours || 24,
      cs_assignments: csList.map(cs => {
        const found = camp.cs_assignments?.find(ca => ca.cs_id === cs.id);
        return {
          cs_id: cs.id,
          cs_name: cs.name,
          weight: found ? found.weight : 30,
          is_active: found ? found.is_active : false
        };
      })
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cs_assignments: formData.cs_assignments.filter(ca => ca.is_active)
      };

      const url = editingCampaign ? `/api/campaigns/${editingCampaign.id}` : '/api/campaigns';
      const method = editingCampaign ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCampaigns();
        showToast(editingCampaign ? 'Perubahan kampanye berhasil disimpan!' : 'Kampanye baru berhasil dibuat!', 'success');
        onRefresh();
      } else {
        showAlert({
          title: 'Gagal Menyimpan Kampanye',
          message: data.error || 'Terjadi kesalahan saat memproses data kampanye.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const insertTag = (tag) => {
    setFormData({
      ...formData,
      message_template: formData.message_template + ' ' + tag
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-500" />
            Manajemen Kampanye & Smart Link
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Buat link khusus per iklan (TikTok Ads, Meta, IG) untuk merotasi klik pengunjung ke tim CS secara otomatis
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-brand-glow transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kampanye Baru</span>
        </button>
      </div>

      {/* Source Grouping Tabs & Search Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Source Tabs Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedSourceFilter('ALL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSourceFilter === 'ALL'
                  ? 'bg-brand-500 text-white shadow-brand-glow'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Sumber</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                selectedSourceFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {campaigns.length}
              </span>
            </button>

            {activeGroups.map((group) => {
              const Icon = group.Icon;
              const count = campaigns.filter(c => getNormalizedSource(c.target_channel) === group.id).length;
              const isSelected = selectedSourceFilter === group.id;

              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedSourceFilter(group.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? `${group.theme.bg} ${group.theme.border} ${group.theme.text} shadow-sm`
                      : 'bg-slate-100 dark:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{group.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-black/10 dark:bg-white/10' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kampanye / slug..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Campaign List Content */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Memuat daftar kampanye...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <Megaphone className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Belum Ada Kampanye</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Mulai buat link rotator pertama untuk iklan Trip Banyuwangi.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold shadow-brand-glow cursor-pointer"
          >
            + Buat Kampanye Baru
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Render by Source Groups */}
          {(selectedSourceFilter === 'ALL'
            ? activeGroups
            : activeGroups.filter(g => g.id === selectedSourceFilter)
          ).map((group) => {
            const Icon = group.Icon;
            const groupCampaigns = campaigns.filter(c => {
              const matchSource = isCampaignInGroup(c.target_channel, group);
              if (!matchSource) return false;
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                (c.title || '').toLowerCase().includes(q) ||
                (c.slug || '').toLowerCase().includes(q) ||
                (c.description || '').toLowerCase().includes(q)
              );
            });

            // If in ALL mode and group has 0 campaigns matching, hide empty section
            if (selectedSourceFilter === 'ALL' && groupCampaigns.length === 0) {
              return null;
            }

            return (
              <div key={group.id} className="space-y-4">
                {/* Group Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${group.theme.bg} ${group.theme.border} ${group.theme.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Sumber: {group.label}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${group.theme.bg} ${group.theme.border} ${group.theme.text}`}>
                          Sapaan: {group.sapaan}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{group.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {groupCampaigns.length} Kampanye Aktif
                    </span>
                  </div>
                </div>

                {/* Grid Cards within this group */}
                {groupCampaigns.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    Tidak ada kampanye pada kelompok {group.label}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupCampaigns.map((camp) => {
                      const effectiveSlug = camp.slug;
                      const catObj = categories.find(c => c.code.toUpperCase() === (camp.target_channel || '').toUpperCase());
                      const platformMeta = getPlatformMeta(camp.target_channel || 'auto', catObj);
                      const PlatformIcon = platformMeta.Icon;
                      const isAutoChannel = !camp.target_channel || camp.target_channel.toUpperCase() === 'AUTO';

                      return (
                        <div
                          key={camp.id}
                          className={`glass-panel p-5 sm:p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
                            camp.is_active ? 'border-slate-200 dark:border-white/10' : 'opacity-60 border-rose-500/20'
                          }`}
                        >
                          <div>
                            {/* Top badges & Toggle */}
                            <div className="flex items-center justify-between mb-3 gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Target Channel Badge with Official Icon */}
                                <PlatformBadge platform={camp.target_channel || 'auto'} category={catObj} size="sm" />

                                <span
                                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    camp.rotation_mode === 'SMOOTH_WEIGHTED'
                                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                  }`}
                                >
                                  {camp.rotation_mode.replace('_', ' ')}
                                </span>
                              </div>

                              <button
                                onClick={() => handleToggle(camp.id)}
                                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                              >
                                {camp.is_active ? (
                                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                    <ToggleLeft className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                                  </span>
                                )}
                              </button>
                            </div>

                            {/* Title & Description */}
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 leading-snug">{camp.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{camp.description || 'Tidak ada deskripsi'}</p>

                            {/* Direct Link Box & Copy (Directly Tailored to Platform) */}
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 mb-3 group">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg border shrink-0 ${platformMeta.theme.bg} ${platformMeta.theme.border} ${platformMeta.theme.text}`}>
                                  <PlatformIcon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                                  /{effectiveSlug}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleCopyLink(effectiveSlug)}
                                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                                  title={`Salin Link /${effectiveSlug}`}
                                >
                                  {copiedSlug === effectiveSlug ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <a
                                  href={`${getRotatorBaseUrl()}/${effectiveSlug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors border border-slate-200 dark:border-slate-700"
                                  title="Buka Link Pengalihan"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>

                            {/* Show Quick Alternative Links only if Multi-Channel/AUTO */}
                            {isAutoChannel && categories.filter(c => c.is_active && c.code.toLowerCase() !== 'auto').length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                                <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Link Kategori:</span>
                                {categories.filter(c => c.is_active && c.code.toLowerCase() !== 'auto').map((cat) => {
                                  const fullSuffixSlug = `${camp.slug}-${cat.code}`;
                                  return (
                                    <button
                                      key={cat.code}
                                      onClick={() => handleCopyLink(fullSuffixSlug)}
                                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-brand-500/10 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                                      title={`Salin Link /${fullSuffixSlug} (Sapaan: ${cat.greeting_keyword})`}
                                    >
                                      {copiedSlug === fullSuffixSlug ? '✓ Tersalin' : `-${cat.code}`}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* CS Assigned List in Campaign Card */}
                            <div className="space-y-2 mb-4">
                              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                CS Bertugas ({camp.cs_assignments?.filter(ca => ca.is_active)?.length || 0})
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {camp.cs_assignments?.map((ca) => (
                                  <span
                                    key={ca.cs_id}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                                      ca.is_active
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                        : 'bg-slate-100/50 dark:bg-slate-900/50 text-slate-400 border-transparent line-through'
                                    }`}
                                  >
                                  <CSAvatar name={ca.cs?.name || 'CS'} size="xs" />
                                  <span>{ca.cs?.name}</span>
                                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold font-mono">({ca.weight}%)</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Quick Actions */}
                        <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {camp.redirect_mode === 'DIRECT_302' ? '⚡ Instan 302' : '🎯 Tracking Pixel'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(camp)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors cursor-pointer"
                              title="Edit Kampanye"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(camp.id)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Hapus Kampanye"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat / Edit Kampanye */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99990] w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-brand-500" />
                  {editingCampaign ? 'Edit Kampanye' : 'Buat Kampanye Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-lg p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Form Container */}
              <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Scrollable Body */}
                <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Kampanye *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData({
                          ...formData,
                          title,
                          slug: !editingCampaign ? generateSlugWithChannel(title, formData.target_channel) : formData.slug
                        });
                      }}
                      placeholder="misal: Promo Safari Baluran"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Slug URL Link (/slug) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">/</span>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="promo-baluran"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono font-bold"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      URL: <span className="text-brand-600 dark:text-brand-400 font-semibold">{getRotatorBaseUrl()}/{formData.slug || 'slug'}</span>
                    </div>
                  </div>
                </div>

                {/* Row 1B: Deskripsi Kampanye */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Deskripsi Kampanye (Catatan Internal)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="misal: Khusus traffic iklan TikTok Ads promo paket tour Baluran & Pantai Bama"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Row 2: Metode Distribusi & Pengalihan */}
                <div className="space-y-4">
                  {/* 1. Metode Distribusi */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Metode Distribusi Klik
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'SMOOTH_WEIGHTED', label: 'Distribusi Tertimbang', badge: 'Utama', desc: 'Berdasarkan persentase bobot CS secara teratur' },
                        { id: 'ROUND_ROBIN', label: 'Bergiliran Berurutan', badge: null, desc: 'Dibagi rata satu per satu secara berurutan' },
                        { id: 'RANDOM_WEIGHTED', label: 'Acak Proporsional', badge: null, desc: 'Distribusi acak mengikuti rasio bobot' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, rotation_mode: item.id })}
                          className={`p-3 rounded-xl text-left border transition-all ${
                            formData.rotation_mode === item.id
                              ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-semibold flex items-center justify-between">
                            <span className={formData.rotation_mode === item.id ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-600 dark:text-brand-300 font-bold uppercase">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Metode Pengalihan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Metode Pengalihan WhatsApp
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          id: 'DIRECT_302',
                          label: 'Pengalihan Langsung (Instan)',
                          desc: 'Langsung membuka aplikasi WhatsApp tanpa jeda. Direkomendasikan untuk profil bio dan link umum.'
                        },
                        {
                          id: 'INTERSTITIAL',
                          label: 'Halaman Perantara (Pixel)',
                          desc: 'Memuat halaman singkat untuk mengeksekusi script pelacakan Meta atau TikTok Pixel sebelum membuka WhatsApp.'
                        }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, redirect_mode: item.id })}
                          className={`p-3 rounded-xl text-left border transition-all ${
                            formData.redirect_mode === item.id
                              ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-semibold flex items-center justify-between">
                            <span className={formData.redirect_mode === item.id ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                              {item.label}
                            </span>
                            {formData.redirect_mode === item.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Target Platform / Sumber Klik */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Target Platform / Sumber Klik (Otomatis Sapaan)
                      </label>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">Mengunci sapaan pembuka tanpa UTM</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activeGroups.map((item) => {
                        const Icon = item.Icon;
                        const isSelected = (formData.target_channel || 'AUTO').toUpperCase() === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                target_channel: item.id
                              });
                            }}
                            className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                              isSelected
                                ? `${item.theme.bg} ${item.theme.border} ${item.theme.text} font-bold shadow-sm`
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <Icon className="w-4 h-4 mx-auto mb-1 shrink-0" />
                            <div className="text-xs font-bold truncate">{item.label}</div>
                            <div className="text-[10px] opacity-75 mt-0.5 truncate">Sapaan: {item.sapaan || '-'}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Dynamic Message Template */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Template Pesan WhatsApp Dinamis
                    </label>
                    <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">Klik tag di bawah untuk menyisipkan</span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.message_template}
                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />

                  {/* Tag Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { tag: '{greeting}', desc: 'Sapaan CRM (Hola/Hi/Halo)' },
                      { tag: '{nama_cs}', desc: 'Nama CS' },
                      { tag: '{waktu_sapaan}', desc: 'Pagi/Siang/Malam' },
                      { tag: '{kota}', desc: 'Kota Tamu' },
                      { tag: '{channel}', desc: 'Sosmed/Iklan' },
                      { tag: '{campaign}', desc: 'Nama Paket' },
                      { tag: '{crm_keyword}', desc: 'Tag CRM' }
                    ].map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => insertTag(item.tag)}
                        className="text-[10px] px-2 py-1 rounded-md bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-mono transition-colors"
                      >
                        {item.tag} <span className="text-slate-500 dark:text-slate-400">({item.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CS Assignment & Weights (Enhanced UX) */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  {(() => {
                    const CS_PALETTE = ['#FF5E14', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B', '#06B6D4', '#64748B'];
                    const activeList = formData.cs_assignments.filter(ca => ca.is_active);
                    const totalWeight = activeList.reduce((sum, ca) => sum + (Number(ca.weight) || 0), 0);
                    const isAllSelected = formData.cs_assignments.length > 0 && formData.cs_assignments.every(ca => ca.is_active);

                    const handleAutoBalance = () => {
                      if (activeList.length === 0) return;
                      const count = activeList.length;
                      const base = Math.floor(100 / count);
                      const remainder = 100 % count;
                      let actIdx = 0;
                      const updated = formData.cs_assignments.map(ca => {
                        if (!ca.is_active) return ca;
                        const weight = base + (actIdx < remainder ? 1 : 0);
                        actIdx++;
                        return { ...ca, weight };
                      });
                      setFormData({ ...formData, cs_assignments: updated });
                    };

                    const handleToggleAll = () => {
                      const nextState = !isAllSelected;
                      const defaultWeight = nextState ? Math.max(10, Math.floor(100 / formData.cs_assignments.length)) : 0;
                      const updated = formData.cs_assignments.map(ca => ({
                        ...ca,
                        is_active: nextState,
                        weight: nextState ? (ca.weight > 0 ? ca.weight : defaultWeight) : 0
                      }));
                      setFormData({ ...formData, cs_assignments: updated });
                    };

                    const handleWeightChange = (idx, val) => {
                      const cleanVal = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
                      const updated = [...formData.cs_assignments];
                      updated[idx].weight = cleanVal;
                      setFormData({ ...formData, cs_assignments: updated });
                    };

                    return (
                      <>
                        {/* Section Header with Quick Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              Pembagian Beban CS untuk Kampanye Ini
                            </span>
                          </div>

                          {/* Action Buttons: Bagi Rata & Toggle Semua */}
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={handleAutoBalance}
                              disabled={activeList.length === 0}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-[11px] font-bold transition-colors disabled:opacity-40"
                              title="Bagi rata 100% ke semua CS aktif secara otomatis"
                            >
                              <Scale className="w-3 h-3" />
                              <span>Bagi Rata (100%)</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleToggleAll}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                            >
                              {isAllSelected ? 'Lepas Semua' : 'Pilih Semua'}
                            </button>
                          </div>
                        </div>

                        {/* Visual Distribution Progress Bar */}
                        {activeList.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 flex overflow-hidden p-0.5 shadow-inner">
                              {activeList.map((ca, idx) => {
                                const widthPct = totalWeight > 0 ? (ca.weight / totalWeight) * 100 : 0;
                                const color = CS_PALETTE[idx % CS_PALETTE.length];
                                return (
                                  <div
                                    key={ca.cs_id}
                                    style={{ width: `${widthPct}%`, backgroundColor: color }}
                                    className="h-full rounded-sm transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                                    title={`${ca.cs_name}: ${ca.weight}%`}
                                  />
                                );
                              })}
                            </div>

                            {/* Micro Legend Chips */}
                            <div className="flex flex-wrap gap-2 pt-0.5">
                              {activeList.map((ca, idx) => {
                                const color = CS_PALETTE[idx % CS_PALETTE.length];
                                return (
                                  <span key={ca.cs_id} className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    <span>{ca.cs_name}: <strong>{ca.weight}%</strong></span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* List of CS Rows */}
                        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          {formData.cs_assignments.length === 0 ? (
                            <div className="text-center py-4 text-xs text-slate-500">Belum ada staf CS yang terdaftar di sistem.</div>
                          ) : (
                            formData.cs_assignments.map((ca, idx) => (
                              <div
                                key={ca.cs_id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl transition-all ${
                                  ca.is_active
                                    ? 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm'
                                    : 'bg-transparent border border-dashed border-slate-200 dark:border-slate-800/60 opacity-50'
                                }`}
                              >
                                {/* Left Checkbox & CS Info */}
                                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-0 select-none">
                                  <input
                                    type="checkbox"
                                    checked={ca.is_active}
                                    onChange={(e) => {
                                      const updated = [...formData.cs_assignments];
                                      updated[idx].is_active = e.target.checked;
                                      if (e.target.checked && updated[idx].weight === 0) {
                                        updated[idx].weight = 25;
                                      }
                                      setFormData({ ...formData, cs_assignments: updated });
                                    }}
                                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 accent-brand-500 shrink-0"
                                  />
                                  <CSAvatar name={ca.cs_name} size="xs" />
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{ca.cs_name}</div>
                                    {!ca.is_active && (
                                      <div className="text-[10px] text-slate-400 font-normal">Nonaktif di kampanye ini</div>
                                    )}
                                  </div>
                                </label>

                                {/* Right Slider & Number Input (Only when Active) */}
                                {ca.is_active ? (
                                  <div className="flex items-center gap-3 w-full sm:w-64 pl-7 sm:pl-0">
                                    {/* Slider */}
                                    <input
                                      type="range"
                                      min="1"
                                      max="100"
                                      step="1"
                                      value={ca.weight}
                                      onChange={(e) => handleWeightChange(idx, e.target.value)}
                                      className="w-full accent-brand-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                                    />

                                    {/* Numeric Input Box with Percentage Label */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={ca.weight}
                                        onChange={(e) => handleWeightChange(idx, e.target.value)}
                                        className="w-14 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-xs text-brand-600 dark:text-brand-400 focus:outline-none focus:border-brand-500"
                                      />
                                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
                                        %
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="hidden sm:block text-[11px] text-slate-400 italic">0%</div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>



                {/* Proteksi Sticky Session (Anti-Duplikasi CS) */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        Sticky Session (Anti-Duplikasi CS)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Kunci tamu yang sama ke CS yang sama agar tidak berganti-ganti CS saat mengklik ulang link
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sticky_session}
                        onChange={(e) => setFormData({ ...formData, sticky_session: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </div>

                  {formData.sticky_session && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        Durasi Penguncian CS:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={formData.sticky_duration_hours || 24}
                          onChange={(e) => setFormData({ ...formData, sticky_duration_hours: parseInt(e.target.value) || 24 })}
                          className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono text-center focus:outline-none focus:border-brand-500"
                        />
                        <span className="text-xs text-slate-500">Jam (Default 24 Jam)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tracking Pixels */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-800 dark:text-white">ID Tracking Pixel (Opsional):</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Meta / Facebook Pixel ID</label>
                      <input
                        type="text"
                        value={formData.pixel_fb_id}
                        onChange={(e) => setFormData({ ...formData, pixel_fb_id: e.target.value })}
                        placeholder="e.g. 123456789"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">TikTok Pixel ID</label>
                      <input
                        type="text"
                        value={formData.pixel_tiktok_id}
                        onChange={(e) => setFormData({ ...formData, pixel_tiktok_id: e.target.value })}
                        placeholder="e.g. C12345ABC"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Google Analytics (GA4) ID</label>
                      <input
                        type="text"
                        value={formData.pixel_ga_id}
                        onChange={(e) => setFormData({ ...formData, pixel_ga_id: e.target.value })}
                        placeholder="e.g. G-XXXXXX"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

                {/* Modal Footer Buttons (Sticky & Fixed at Bottom) */}
                <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white text-xs font-bold shadow-brand-glow transition-all active:scale-95 cursor-pointer"
                  >
                    {editingCampaign ? 'Simpan Perubahan' : 'Buat Kampanye'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
