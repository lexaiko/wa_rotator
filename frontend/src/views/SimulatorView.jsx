import React, { useState, useEffect } from 'react';
import CSAvatar from '../components/CSAvatar.jsx';
import { useModal } from '../context/ModalContext.jsx';
import {
  FlaskConical,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react';

export default function SimulatorView({ campaigns = [] }) {
  const { showAlert, showToast } = useModal();
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id || '');
  const [iterations, setIterations] = useState(100);
  const [mockCity, setMockCity] = useState('Surabaya');
  const [ignoreSchedule, setIgnoreSchedule] = useState(true);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    if (!selectedCampaignId && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    if (!selectedCampaignId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          campaign_id: selectedCampaignId,
          iterations,
          mock_city: mockCity,
          ignore_schedule: ignoreSchedule
        })
      });

      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.data);
        showToast(`Simulasi ${iterations} klik pengunjung selesai dianalisis!`, 'success');
      } else {
        showAlert({
          title: 'Gagal Menjalankan Simulasi',
          message: data.error || 'Terjadi kesalahan saat memproses simulasi rotasi link.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-brand-500" />
          Live Rotator Simulator & Testing Tool
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Uji coba pembobotan dan distribusi rotasi link secara langsung untuk memastikan algoritma berjalan adil sesuai persentase yang disetel
        </p>
      </div>

      {/* Simulator Control Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl">
        <form onSubmit={handleRunSimulation} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Select Campaign */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Kampanye
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} (/r/{c.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Iteration Count */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Jumlah Simulasi Klik
            </label>
            <select
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
            >
              <option value="50">50 Klik Pengunjung</option>
              <option value="100">100 Klik Pengunjung (Standar)</option>
              <option value="250">250 Klik Pengunjung</option>
              <option value="500">500 Klik Pengunjung (Iklan Besar)</option>
            </select>
          </div>

          {/* Mock City */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Simulasi Kota Asal Pengunjung
            </label>
            <select
              value={mockCity}
              onChange={(e) => setMockCity(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            >
              <option value="Surabaya">Surabaya (Jawa Timur)</option>
              <option value="Jakarta Selatan">Jakarta (DKI)</option>
              <option value="Denpasar">Denpasar (Bali)</option>
              <option value="Malang">Malang (Jawa Timur)</option>
              <option value="Bandung">Bandung (Jawa Barat)</option>
            </select>
          </div>

          {/* Submit Button & Shift Toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={ignoreSchedule}
                onChange={(e) => setIgnoreSchedule(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-brand-500 focus:ring-brand-500 accent-brand-500"
              />
              <span>Uji Bobot Murni (Abaikan Jam Shift)</span>
            </label>

            <button
              type="submit"
              disabled={loading || !selectedCampaignId}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-brand-glow transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>{loading ? 'Menjalankan...' : 'Jalankan Simulasi'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {simulationResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Banner */}
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hasil Simulasi: {simulationResult.iterations} Pengunjung
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mode: <span className="text-brand-600 dark:text-brand-300 font-semibold">{simulationResult.rotation_mode}</span>
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-500 dark:text-slate-400">Fallback/Darurat: </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{simulationResult.fallback_count} klik</span>
            </div>
          </div>

          {/* Distribution Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Distribution Bars */}
            <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" />
                Distribusi Nyata Hasil Rotasi per CS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Membandingkan bobot target yang disetel vs persentase klik yang diterima
              </p>

              <div className="space-y-4 pt-2">
                {simulationResult.breakdown.map((item) => (
                  <div key={item.cs_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2.5">
                        <CSAvatar name={item.name} size="xs" />
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">+{item.phone}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-brand-600 dark:text-brand-400 font-bold text-sm">{item.count} klik</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1.5 font-mono">({item.percentage}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-500 to-amber-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Sample WhatsApp Message Preview */}
            <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-brand-500" />
                  Preview Teks Chat WhatsApp Tamu
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Hasil render pesan setelah mengganti tag dinamis (nama CS, kota, sapaan waktu)
                </p>

                {/* WhatsApp Chat Bubble Mockup */}
                <div className="bg-[#E5DDD5] dark:bg-[#0D1418] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-2 shadow-inner">
                  <div className="bg-[#D9FDD3] dark:bg-[#005C4B] text-slate-900 dark:text-slate-100 p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed shadow-sm">
                    {simulationResult.sample_message}
                    <div className="text-[9px] text-slate-500 dark:text-slate-300 text-right mt-1.5">14:32 ✓✓</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-4">
                <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
                <span>
                  Variabel kota <strong>{mockCity}</strong> dan sapaan waktu otomatis disesuaikan secara real-time!
                </span>
              </div>
            </div>
          </div>

          {/* Sequence Step-by-step Log */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Urutan Distribusi 15 Klik Pertama:
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2 text-center text-xs">
              {simulationResult.sample_logs.map((log) => (
                <div
                  key={log.iteration}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="text-[10px] text-slate-500 font-mono">Klik #{log.iteration}</div>
                  <div className="font-bold text-brand-600 dark:text-brand-400 truncate mt-0.5">{log.assigned_to}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
