import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CSAvatar from '../components/CSAvatar.jsx';
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
  X
} from 'lucide-react';

export default function CampaignsView({ campaigns: propCampaigns = [], csList, onRefresh }) {
  const [campaigns, setCampaigns] = useState(propCampaigns);
  const [loading, setLoading] = useState(propCampaigns.length === 0);
  const [copiedSlug, setCopiedSlug] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    rotation_mode: 'SMOOTH_WEIGHTED',
    message_template: 'Halo {nama_cs}, {greeting}! Saya tertarik dengan paket {campaign} dari {channel}. Boleh minta info detail & pricelistnya?',
    fallback_number: '6281234567890',
    redirect_mode: 'INTERSTITIAL',
    pixel_fb_id: '',
    pixel_tiktok_id: '',
    pixel_ga_id: '',
    is_active: true,
    sticky_session: false,
    sticky_duration_hours: 24,
    cs_assignments: []
  });

  useEffect(() => {
    if (propCampaigns.length > 0) {
      setCampaigns(propCampaigns);
      setLoading(false);
    } else {
      fetchCampaigns();
    }
  }, [propCampaigns]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
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

  const handleCopyLink = (slug) => {
    const origin = window.location.origin;
    const url = `${origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setCampaigns(campaigns.map(c => c.id === id ? { ...c, is_active: data.data.is_active } : c));
        onRefresh();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah kamu yakin ingin menghapus kampanye ini?')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCampaigns(campaigns.filter(c => c.id !== id));
        onRefresh();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      rotation_mode: 'SMOOTH_WEIGHTED',
      message_template: 'Halo {nama_cs}, {greeting}! Saya tertarik dengan paket {campaign} dari {channel}.',
      fallback_number: '6281234567890',
      redirect_mode: 'INTERSTITIAL',
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
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCampaigns();
        onRefresh();
      } else {
        alert(data.error || 'Gagal menyimpan kampanye');
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
            Buat link khusus per iklan (TikTok Ads, Meta, IG) untuk merotasi leads ke tim CS secara otomatis
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

      {/* Grid Kampanye */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-500 text-sm">
            Memuat daftar kampanye...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-3 glass-panel p-12 rounded-2xl text-center">
            <Megaphone className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Belum Ada Kampanye</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Mulai buat link rotator pertama untuk iklan Trip Banyuwangi.</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold shadow-brand-glow"
            >
              + Buat Kampanye Baru
            </button>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className={`glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                camp.is_active ? 'border-slate-200 dark:border-white/10' : 'opacity-60 border-rose-500/20'
              }`}
            >
              <div>
                {/* Top badges & Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      camp.rotation_mode === 'SMOOTH_WEIGHTED'
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {camp.rotation_mode.replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => handleToggle(camp.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold"
                  >
                    {camp.is_active ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <ToggleRight className="w-6 h-6 text-emerald-500" />
                        Aktif
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <ToggleLeft className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                        Off
                      </span>
                    )}
                  </button>
                </div>

                {/* Campaign Title & Slug */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 leading-snug">{camp.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {camp.description || 'Tidak ada catatan deskripsi.'}
                </p>

                {/* Smart Link Box (Direct Root) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between mb-4">
                  <div className="text-xs font-mono text-brand-600 dark:text-brand-300 truncate mr-2 font-semibold">
                    /{camp.slug}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyLink(camp.slug)}
                      title="Salin Link"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {copiedSlug === camp.slug ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`/${camp.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Buka Link Langsung"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Stats Pills */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total Klik</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                      {camp._count?.click_logs || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">CS Ditugaskan</div>
                    <div className="text-sm font-bold text-brand-600 dark:text-brand-400 font-mono mt-0.5">
                      {camp.cs_assignments?.filter(ca => ca.is_active).length || 0} CS
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {camp.redirect_mode === 'DIRECT_302' ? 'Pengalihan Instan' : 'Tracking Interstitial'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(camp)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"
                    title="Edit Kampanye"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(camp.id)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors"
                    title="Hapus Kampanye"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Create/Edit Campaign (Full-screen Portal to document.body) */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] w-screen h-screen bg-black/75 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
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

              {/* Modal Body */}
              <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
                {/* Row 1: Nama Kampanye & Custom Slug / URL */}
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
                          slug: !editingCampaign ? title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : formData.slug
                        });
                      }}
                      placeholder="misal: Promo Safari Baluran"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      URL Slug Link *
                    </label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-400">
                      <span className="font-mono text-brand-500 font-bold">/</span>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="baluran-safari"
                        className="w-full bg-transparent py-2.5 px-1 text-slate-900 dark:text-white focus:outline-none font-mono text-xs"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      URL: <span className="text-brand-600 dark:text-brand-400 font-semibold">{window.location.origin}/{formData.slug || 'slug'}</span>
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
                      Metode Distribusi Lead
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
                      { tag: '{nama_cs}', desc: 'Nama CS' },
                      { tag: '{greeting}', desc: 'Sapaan Pagi/Siang' },
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

                {/* CS Assignment & Weights */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                    <span>Pembagian Beban CS untuk Kampanye Ini:</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal">Pilih CS yang aktif menerima lead</span>
                  </div>

                  <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    {formData.cs_assignments.map((ca, idx) => (
                      <div key={ca.cs_id} className="flex items-center justify-between gap-4">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={ca.is_active}
                            onChange={(e) => {
                              const updated = [...formData.cs_assignments];
                              updated[idx].is_active = e.target.checked;
                              setFormData({ ...formData, cs_assignments: updated });
                            }}
                            className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 accent-brand-500"
                          />
                          <CSAvatar name={ca.cs_name} size="xs" />
                          <span>{ca.cs_name}</span>
                        </label>

                        {ca.is_active && (
                          <div className="flex items-center gap-3 w-48">
                            <input
                              type="range"
                              min="5"
                              max="100"
                              step="5"
                              value={ca.weight}
                              onChange={(e) => {
                                const updated = [...formData.cs_assignments];
                                updated[idx].weight = parseInt(e.target.value, 10);
                                setFormData({ ...formData, cs_assignments: updated });
                              }}
                              className="w-full accent-brand-500 cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 w-10 text-right">
                              {ca.weight}%
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nomor Cadangan / Fallback */}
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nomor WhatsApp Cadangan / Darurat (Jika Semua CS Off)
                  </label>
                  <input
                    type="text"
                    value={formData.fallback_number}
                    onChange={(e) => setFormData({ ...formData, fallback_number: e.target.value })}
                    placeholder="misal: 6281234567890"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                    Nomor ini otomatis menerima chat jika seluruh CS reguler sedang dimatikan atau kuota harian CS sudah penuh.
                  </span>
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

                {/* Modal Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white text-xs font-bold shadow-brand-glow transition-all active:scale-95"
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
