import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Server,
  Zap,
  CheckCircle2,
  Code2,
  ExternalLink,
  Save,
  Link,
  BookOpen
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
          Pengaturan Sistem & Integrasi CRM
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Konfigurasi nomor darurat fallback, branding, panduan tag dinamis, dan jembatan integrasi ke CRM TripBwi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: General Settings Form */}
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
              <input
                type="text"
                value={fallbackNumber}
                onChange={(e) => setFallbackNumber(e.target.value)}
                placeholder="6281234567890"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Nomor ini akan digunakan jika seluruh CS sedang Offline atau di luar jam kerja operasional.
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
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-brand-glow transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
              {savedSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-3 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Tersimpan!
                </span>
              )}
            </div>
          </form>

          {/* CRM Integration Card */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-500" />
              Status Bridge CRM (`trip-bwi-classifier`)
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Endpoint CRM:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">http://localhost:3002/api</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Greeting Rule Auto-Sync:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                Rotator otomatis menyematkan keyword referensi (misal: <code>[Ref: TikTok]</code>) agar AI Gemini di CRM langsung mengenali sumber iklan saat tamu pertama kali mengirim pesan WhatsApp.
              </p>
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
              Gunakan placeholder berikut dalam template pesan WhatsApp kampanye:
            </p>

            <div className="space-y-2 text-xs">
              {[
                { tag: '{nama_cs}', desc: 'Nama CS yang terpilih menerima lead' },
                { tag: '{greeting}', desc: 'Sapaan ramah sesuai jam lokal (Pagi, Siang, Sore, Malam)' },
                { tag: '{kota}', desc: 'Kota asal calon tamu berdasarkan deteksi IP' },
                { tag: '{channel}', desc: 'Sumber traffic (TikTok, Instagram, Facebook, Google)' },
                { tag: '{campaign}', desc: 'Judul paket tour / nama kampanye' },
                { tag: '{crm_keyword}', desc: 'Kode pemicu otomatis GreetingRule di CRM TripBwi' }
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
              Contoh Format Link Iklan (UTM)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-brand-600 dark:text-brand-300 break-all select-all font-semibold">
                https://wa.tripbanyuwangi.com/kawah-ijen?utm_source=tiktok&utm_campaign=promo-liburan
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-brand-600 dark:text-brand-300 break-all select-all font-semibold">
                https://wa.tripbanyuwangi.com/ig-bio?utm_source=instagram&utm_medium=bio
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
