import React, { useState } from 'react';
import {
  Settings,
  Zap,
  CheckCircle2,
  Code2,
  Save,
  Link,
  ShieldCheck,
  Cpu,
  Smartphone
} from 'lucide-react';

export default function SettingsView() {
  const [fallbackNumber, setFallbackNumber] = useState('6281234567890');
  const [brandName, setBrandName] = useState('TripBanyuwangi.com');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-500" />
          Pengaturan Sistem WhatsApp Rotator
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Konfigurasi nomor WhatsApp darurat, branding, panduan tag dinamis, dan format parameter URL iklan (UTM)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: General Settings Form */}
        <div className="space-y-6">
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-500" />
              Konfigurasi Default Rotator
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor WhatsApp Darurat / Fallback Utama
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fallbackNumber}
                    onChange={(e) => setFallbackNumber(e.target.value)}
                    placeholder="6281234567890"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono font-semibold"
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Nomor ini otomatis digunakan jika seluruh CS sedang Offline, di luar shift kerja, atau kuota hariannya penuh.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Brand / Perusahaan
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-brand-glow transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan</span>
                </button>
                {savedSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Pengaturan tersimpan!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Engine Specs Box */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-500" />
              Spesifikasi WhatsApp Rotator Engine
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Algoritma Rotasi:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">Nginx Smooth Weighted</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Kecepatan Pengalihan:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">&lt; 5ms (Instan 302)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Dukungan Tracking Pixel:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Meta Pixel, TikTok, GA4</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Anti-Duplikasi CS (Sticky Session):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Aktif (Cookie & IP Cache)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Placeholder & UTM Cheatsheet */}
        <div className="space-y-6">
          {/* Dynamic Tags Cheatsheet */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand-500" />
              Daftar Tag Pesan Dinamis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gunakan placeholder berikut dalam template pesan WhatsApp kampanye untuk personalisasi otomatis:
            </p>

            <div className="space-y-2 text-xs">
              {[
                { tag: '{nama_cs}', desc: 'Nama CS yang terpilih menerima klik pengunjung' },
                { tag: '{greeting}', desc: 'Sapaan ramah otomatis sesuai jam lokal (Pagi, Siang, Sore, Malam)' },
                { tag: '{kota}', desc: 'Kota asal calon tamu berdasarkan deteksi geolokasi IP' },
                { tag: '{channel}', desc: 'Sumber traffic pengiklan (TikTok, Instagram, Facebook, Google)' },
                { tag: '{campaign}', desc: 'Judul paket tour atau nama kampanye iklan' }
              ].map((item) => (
                <div
                  key={item.tag}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <code className="text-brand-600 dark:text-brand-400 font-bold">{item.tag}</code>
                  <span className="text-slate-600 dark:text-slate-300 text-[11px]">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* UTM Format Guide */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Link className="w-4 h-4 text-brand-500" />
              Contoh Format Link Iklan (UTM Parameter)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Semua parameter UTM pada link iklan akan terlacak otomatis di menu Analitik & Log:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-brand-600 dark:text-brand-300 break-all select-all font-semibold">
                https://wa.tripbanyuwangi.com/kawah-ijen?utm_source=ig&utm_medium=bio
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-brand-600 dark:text-brand-300 break-all select-all font-semibold">
                https://wa.tripbanyuwangi.com/kawah-ijen?utm_source=tt&utm_medium=ads&utm_campaign=promo
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-brand-600 dark:text-brand-300 break-all select-all font-semibold">
                https://wa.tripbanyuwangi.com/paket-baluran?utm_source=fb&utm_medium=cpc
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 Mendukung singkatan: <code>ig</code> / <code>instagram</code>, <code>tt</code> / <code>tiktok</code>, <code>fb</code> / <code>facebook</code>, <code>gads</code> / <code>google</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
