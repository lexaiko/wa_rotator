import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CSAvatar from '../components/CSAvatar.jsx';
import { useModal } from '../context/ModalContext.jsx';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Clock,
  BatteryCharging,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function CSManagementView({ csList: propCS = [], onRefresh }) {
  const { showConfirm, showAlert, showToast } = useModal();
  const [csList, setCSList] = useState(propCS);
  const [loading, setLoading] = useState(propCS.length === 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCS, setEditingCS] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    avatar_url: '',
    is_active: true,
    auto_schedule: false,
    schedule_start: '08:00',
    schedule_end: '17:00',
    enable_daily_cap: false,
    daily_lead_cap: 50,
    crm_admin_id: ''
  });

  useEffect(() => {
    if (propCS.length > 0) {
      setCSList(propCS);
      setLoading(false);
    } else {
      fetchCS();
    }
  }, [propCS]);

  const fetchCS = async () => {
    try {
      const res = await fetch('/api/cs', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setCSList(data.data);
      }
    } catch (err) {
      console.error('Error loading CS:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`/api/cs/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setCSList(csList.map(cs => cs.id === id ? { ...cs, is_active: data.data.is_active } : cs));
        showToast(`Status CS berhasil diubah menjadi ${data.data.is_active ? 'Aktif' : 'Nonaktif'}.`, 'info');
        onRefresh();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleResetCounter = (id) => {
    showConfirm({
      title: 'Reset Hitungan Klik CS?',
      message: 'Jumlah klik yang diterima CS ini hari ini akan direset kembali ke angka 0.',
      confirmText: 'Ya, Reset',
      type: 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/cs/${id}/reset-counter`, {
            method: 'POST',
            credentials: 'include'
          });
          const data = await res.json();
          if (data.success) {
            setCSList(csList.map(cs => cs.id === id ? { ...cs, today_lead_count: 0 } : cs));
            showToast('Hitungan klik CS berhasil direset ke 0.', 'success');
            onRefresh();
          }
        } catch (err) {
          console.error('Reset counter error:', err);
        }
      }
    });
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Hapus CS dari Rotator?',
      message: 'Apakah Anda yakin ingin menghapus akun CS ini dari daftar rotator? Data pembobotan pada kampanye terkait akan disesuaikan.',
      confirmText: 'Hapus CS',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/cs/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          const data = await res.json();
          if (data.success) {
            setCSList(csList.filter(cs => cs.id !== id));
            showToast('Akun CS berhasil dihapus.', 'success');
            onRefresh();
          }
        } catch (err) {
          console.error('Delete error:', err);
        }
      }
    });
  };

  const openCreateModal = () => {
    setEditingCS(null);
    setFormData({
      name: '',
      phone_number: '',
      email: '',
      avatar_url: '',
      is_active: true,
      auto_schedule: false,
      schedule_start: '08:00',
      schedule_end: '17:00',
      enable_daily_cap: false,
      daily_lead_cap: 50,
      crm_admin_id: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cs) => {
    setEditingCS(cs);
    setFormData({
      name: cs.name,
      phone_number: cs.phone_number,
      email: cs.email || '',
      avatar_url: cs.avatar_url || '',
      is_active: cs.is_active,
      auto_schedule: cs.auto_schedule,
      schedule_start: cs.schedule_start || '08:00',
      schedule_end: cs.schedule_end || '17:00',
      enable_daily_cap: cs.enable_daily_cap,
      daily_lead_cap: cs.daily_lead_cap || 50,
      crm_admin_id: cs.crm_admin_id || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCS ? `/api/cs/${editingCS.id}` : '/api/cs';
      const method = editingCS ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCS();
        showToast(editingCS ? 'Perubahan data CS berhasil disimpan!' : 'CS baru berhasil ditambahkan!', 'success');
        onRefresh();
      } else {
        showAlert({
          title: 'Gagal Menyimpan Data CS',
          message: data.error || 'Terjadi kesalahan saat memproses data CS.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" />
            Manajemen Tim CS, Jam Kerja & Kuota
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Atur status online, shift jam kerja otomatis, dan pembatasan maksimal klik harian per CS
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-brand-glow transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah CS Baru</span>
        </button>
      </div>

      {/* CS Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-500 text-sm">
            Memuat daftar CS...
          </div>
        ) : csList.map((cs) => {
          const cap = cs.daily_lead_cap || 50;
          const current = cs.today_lead_count || 0;
          const pct = cs.enable_daily_cap ? Math.min(Math.round((current / cap) * 100), 100) : 0;

          return (
            <div
              key={cs.id}
              className={`glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                cs.is_active ? 'border-slate-200 dark:border-white/10' : 'opacity-60 border-rose-500/20'
              }`}
            >
              <div>
                {/* CS Profile & Master Toggle */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CSAvatar name={cs.name} size="lg" isActive={cs.is_active} />

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{cs.name}</h3>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-mono font-semibold mt-0.5">
                        +{cs.phone_number}
                      </p>
                      {cs.email && <p className="text-[11px] text-slate-500 dark:text-slate-400">{cs.email}</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(cs.id)}
                    className="flex items-center gap-1 text-xs font-semibold shrink-0"
                  >
                    {cs.is_active ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <ToggleRight className="w-7 h-7 text-emerald-500" />
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <ToggleLeft className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                      </span>
                    )}
                  </button>
                </div>

                {/* Rules & Configuration Badges */}
                <div className="space-y-2.5 my-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                  {/* Shift Working Hours */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-500" />
                      Jam Kerja:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cs.auto_schedule ? (
                        <span className="text-brand-600 dark:text-brand-300 font-mono font-bold">{cs.schedule_start} - {cs.schedule_end} WIB</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">24 Jam Penuh</span>
                      )}
                    </span>
                  </div>

                  {/* Daily Lead Cap */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <BatteryCharging className="w-3.5 h-3.5 text-brand-500" />
                      Limit Harian:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cs.enable_daily_cap ? (
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">{cs.daily_lead_cap} klik/hari</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Tanpa Batas</span>
                      )}
                    </span>
                  </div>

                  {/* Total Campaigns Assigned */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-brand-500" />
                      Terdaftar di:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {cs.campaign_count || 0} Kampanye
                    </span>
                  </div>
                </div>

                {/* Today's Lead Count Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Klik Diterima Hari Ini:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      <span className="text-brand-600 dark:text-brand-400 font-mono text-sm">{current}</span>
                      {cs.enable_daily_cap ? ` / ${cap}` : ''}
                    </span>
                  </div>
                  {cs.enable_daily_cap && (
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Quick Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <a
                  href={`https://wa.me/${cs.phone_number}?text=Halo%20${encodeURIComponent(cs.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl transition-colors border border-emerald-500/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Test Chat WA</span>
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleResetCounter(cs.id)}
                    title="Reset Counter Hari Ini"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(cs)}
                    title="Edit CS"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cs.id)}
                    title="Hapus CS"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Create/Edit CS (Full-screen Portal to document.body) */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99990] w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-500" />
                  {editingCS ? 'Edit Data CS' : 'Tambah CS Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-lg p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama CS / Admin *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="misal: CS Anggi"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="08123456789 atau 628123456789"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Otomatis diformat ke format internasional 628xxx</span>
                </div>

                {/* Shift Hours Toggle & Inputs */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">Atur Jam Kerja / Shift Otomatis</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">CS otomatis offline di luar jam yang ditentukan</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.auto_schedule}
                      onChange={(e) => setFormData({ ...formData, auto_schedule: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 accent-brand-500"
                    />
                  </label>

                  {formData.auto_schedule && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Jam Mulai (WIB)</label>
                        <input
                          type="time"
                          value={formData.schedule_start}
                          onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value })}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Jam Selesai (WIB)</label>
                        <input
                          type="time"
                          value={formData.schedule_end}
                          onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value })}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Daily Lead Cap Toggle & Input */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">Batasi Kuota Klik Harian (Daily Cap)</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Otomatis istirahat jika mencapai limit harian</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enable_daily_cap}
                      onChange={(e) => setFormData({ ...formData, enable_daily_cap: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 accent-brand-500"
                    />
                  </label>

                  {formData.enable_daily_cap && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Maksimal Klik / Hari</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.daily_lead_cap}
                        onChange={(e) => setFormData({ ...formData, daily_lead_cap: parseInt(e.target.value, 10) || 50 })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
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
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 text-white text-xs font-bold shadow-brand-glow transition-all active:scale-95 cursor-pointer"
                  >
                    {editingCS ? 'Simpan Perubahan' : 'Tambah CS'}
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
