import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquareCode,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  Smartphone,
  HelpCircle,
  Hash,
  Layers,
  ArrowRight,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Save,
  Palette
} from 'lucide-react';
import { useModal } from '../context/ModalContext.jsx';
import {
  PLATFORM_REGISTRY,
  COLOR_THEMES,
  AVAILABLE_ICONS,
  getIconComponent,
  PlatformBadge
} from '../components/SocialIcons.jsx';

export default function SourceGreetingView() {
  const { showConfirm, showAlert, showToast } = useModal();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    greeting_keyword: 'halo',
    icon_type: 'tiktok',
    badge_color: 'rose',
    description: '',
    sort_order: 0
  });

  // Live Test Chat
  const [testMessage, setTestMessage] = useState('Hola kak, saya mau tanya paket liburan Kawah Ijen');
  const [detectedSource, setDetectedSource] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/source-categories', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test detection when testMessage or categories change
  useEffect(() => {
    if (!testMessage.trim()) {
      setDetectedSource(null);
      return;
    }
    const cleanMsg = testMessage.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
    const words = cleanMsg.split(/\s+/);
    const firstWord = words[0] || '';

    // Match against greeting_keyword
    const matched = categories.find(c => (c.greeting_keyword || '').toLowerCase() === firstWord && c.is_active);
    if (matched) {
      setDetectedSource({
        type: 'MATCHED',
        keyword: firstWord,
        category: matched
      });
    } else {
      setDetectedSource({
        type: 'FALLBACK',
        keyword: firstWord,
        category: { name: 'Tidak Teridentifikasi / Direct', code: 'direct' }
      });
    }
  }, [testMessage, categories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      greeting_keyword: 'halo',
      icon_type: 'tiktok',
      badge_color: 'rose',
      description: '',
      sort_order: categories.length + 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      code: cat.code,
      greeting_keyword: cat.greeting_keyword || 'halo',
      icon_type: cat.icon_type || 'globe',
      badge_color: cat.badge_color || 'slate',
      description: cat.description || '',
      sort_order: cat.sort_order || 0
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      showAlert({ title: 'Validasi Gagal', message: 'Nama kategori wajib diisi.', type: 'warning' });
      return;
    }

    try {
      const url = editingCategory ? `/api/source-categories/${editingCategory.id}` : '/api/source-categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        showToast(
          editingCategory
            ? `Kategori "${name}" berhasil diperbarui!`
            : `Kategori "${name}" berhasil ditambahkan!`,
          'success'
        );
        loadCategories();
      } else {
        showAlert({ title: 'Gagal Menyimpan', message: data.error, type: 'error' });
      }
    } catch (err) {
      showAlert({ title: 'Error', message: 'Terjadi kesalahan jaringan saat menyimpan kategori.', type: 'error' });
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      const res = await fetch(`/api/source-categories/${cat.id}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: data.data.is_active } : c));
        showToast(`Kategori "${cat.name}" ${data.data.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`, 'info');
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDelete = (cat) => {
    showConfirm({
      title: 'Hapus Kategori Sosmed?',
      message: `Apakah Anda yakin ingin menghapus kategori "${cat.name}" (${cat.code})? Sapaan "${cat.greeting_keyword}" tidak akan lagi otomatis terpetakan ke platform ini.`,
      confirmText: 'Ya, Hapus Kategori',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/source-categories/${cat.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          const data = await res.json();
          if (data.success) {
            setCategories(prev => prev.filter(c => c.id !== cat.id));
            showToast(`Kategori "${cat.name}" berhasil dihapus.`, 'success');
          } else {
            showAlert({ title: 'Gagal Hapus', message: data.error, type: 'error' });
          }
        } catch (err) {
          showAlert({ title: 'Error', message: 'Gagal menghapus kategori.', type: 'error' });
        }
      }
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MessageSquareCode className="w-5 h-5 text-brand-500" />
            Kategori Sumber Klik & Kata Sapaan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola daftar platform sumber iklan (TikTok, Instagram, Website, dll.) dan atur kata sapaan WhatsApp pembukanya
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-brand-glow transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori Sosmed</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Kategori Sosmed</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {categories.length} <span className="text-xs font-normal text-slate-400">Platform</span>
          </div>
          <div className="text-[11px] text-emerald-500 font-semibold mt-1">
            {categories.filter(c => c.is_active).length} Aktif
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kata Sapaan Terhubung</div>
          <div className="text-xl sm:text-2xl font-bold text-brand-500 mt-1 font-mono">
            {new Set(categories.map(c => c.greeting_keyword)).size} <span className="text-xs font-normal text-slate-400">Kata</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Hola, Hai, Halo, dll.</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Metode Pelacakan</div>
          <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
            Kata Awal Chat
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tanpa perlu link UTM panjang</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status Pelacakan</div>
          <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 100% Otomatis
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tersinkron di semua link</div>
        </div>
      </div>

      {/* Main Content: Categories Grid & Live Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category Management List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-500" />
              Daftar Kategori Sumber ({categories.length})
            </h3>
            <span className="text-xs text-slate-400">
              Klik Edit untuk mengubah sapaan atau warna
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Memuat kategori sumber...</div>
          ) : categories.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-2xl">
              <p className="text-xs text-slate-400 mb-3">Belum ada kategori sumber yang dibuat.</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold"
              >
                + Tambah Kategori Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => {
                const IconComponent = getIconComponent(cat.icon_type);
                const theme = COLOR_THEMES[cat.badge_color] || COLOR_THEMES.slate;

                return (
                  <div
                    key={cat.id}
                    className={`glass-panel p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      cat.is_active ? 'border-slate-200 dark:border-slate-800' : 'opacity-60 border-slate-200/50'
                    }`}
                  >
                    {/* Left: Icon & Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-3 rounded-2xl border shrink-0 ${theme.bg} ${theme.border} ${theme.text}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {cat.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {cat.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {cat.description || 'Tidak ada deskripsi'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Sapaan Badge & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Greeting Keyword */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Sapaan</span>
                        <span className="font-mono font-bold text-xs text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 rounded-lg inline-block">
                          {cat.greeting_keyword}
                        </span>
                      </div>

                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className="text-xs font-semibold cursor-pointer"
                        title={cat.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        {cat.is_active ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors cursor-pointer"
                          title="Edit Kategori & Sapaan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Hapus Kategori"
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

        {/* Right 1 Col: Live Tester & Explanation */}
        <div className="space-y-6">
          {/* Live Sapaan Tester */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4 border-2 border-brand-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Uji Coba Deteksi Sapaan Chat
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                Realtime
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ketik pesan pembuka untuk menguji otomatisasi sumber klik:
            </p>

            <div className="space-y-3">
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows="3"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Ketik pesan WhatsApp di sini..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-sans resize-none"
                />
              </div>

              {/* Quick test buttons */}
              <div className="flex flex-wrap gap-1.5">
                {categories.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTestMessage(`${c.greeting_keyword} CS Putri, mau tanya paket tour dong`)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors font-mono cursor-pointer"
                  >
                    Contoh {c.greeting_keyword}
                  </button>
                ))}
              </div>

              {/* Detection Result Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Kata Pertama Terdeteksi:</span>
                  <span className="font-mono font-bold text-xs text-brand-600 dark:text-brand-400">
                    "{detectedSource?.keyword || '-'}"
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sumber Terpetakan:</span>
                  {detectedSource?.type === 'MATCHED' ? (
                    <PlatformBadge platform={detectedSource.category.code} category={detectedSource.category} size="sm" />
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Tidak Terdeteksi</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Non-Technical Explanation */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-500" />
              Bagaimana Sumber Klik Terdeteksi?
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Pengunjung Mengklik Link:</strong>
                  <p className="mt-0.5">Setiap link iklan membawa kata sapaan khusus sesuai platformnya (misal: <em>Hola</em> untuk TikTok, <em>Hai</em> untuk Website, <em>Halo</em> untuk Instagram).</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Sistem Membaca Kata Pertama:</strong>
                  <p className="mt-0.5">Saat calon tamu mengirim chat pertama, sistem langsung mengenali kata sapaannya untuk mendeteksi dari mana mereka datang.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Sumber Klik Tercatat Otomatis:</strong>
                  <p className="mt-0.5">Data platform asal tamu langsung terkunci rapi tanpa perlu URL panjang atau input manual.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit Kategori Sosmed */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99990] w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-brand-500" />
                  {editingCategory ? 'Edit Kategori Sumber' : 'Tambah Kategori Sumber Baru'}
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
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  {/* Category Name & Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Kategori *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setFormData({
                            ...formData,
                            name,
                            code: !editingCategory ? name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-') : formData.code
                          });
                        }}
                        placeholder="misal: TikTok Ads"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Kode Unik / Slug *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') })}
                        placeholder="misal: tiktok-ads"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Greeting Keyword */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kata Sapaan Pembuka WhatsApp *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.greeting_keyword}
                        onChange={(e) => setFormData({ ...formData, greeting_keyword: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                        placeholder="misal: hola / hai / halo"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono font-bold text-brand-600 dark:text-brand-400"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Kata pertama ini disematkan pada link pesan WA untuk melacak asal platform calon tamu.
                    </span>
                  </div>

                  {/* Icon Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pilih Ikon Platform
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {AVAILABLE_ICONS.map((item) => {
                        const Icon = item.Icon;
                        const isSelected = formData.icon_type === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon_type: item.id })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-brand-500 text-white border-brand-500 shadow-brand-glow scale-105'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-500/50'
                            }`}
                            title={item.label}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[9px] truncate w-full text-center">{item.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Theme Color Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Warna Badge & Tema
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(COLOR_THEMES).map((colorKey) => {
                        const theme = COLOR_THEMES[colorKey];
                        const isSelected = formData.badge_color === colorKey;
                        return (
                          <button
                            key={colorKey}
                            type="button"
                            onClick={() => setFormData({ ...formData, badge_color: colorKey })}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold capitalize flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? `${theme.bg} ${theme.border} ${theme.text} ring-2 ring-brand-500 scale-105`
                                : `${theme.bg} ${theme.border} ${theme.text} opacity-70 hover:opacity-100`
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current"></span>
                            <span>{colorKey}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Deskripsi / Penempatan
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="misal: Link Bio Profil & Campaign Iklan"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-brand-glow transition-all active:scale-95 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
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
