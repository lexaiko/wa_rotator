import React, { useState, useEffect } from 'react';
import CSAvatar from '../components/CSAvatar.jsx';
import {
  MousePointerClick,
  Users,
  Megaphone,
  TrendingUp,
  MapPin,
  Smartphone,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardView({ stats, onNavigateTab }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [timeSeries, setTimeSeries] = useState([]);
  const [channels, setChannels] = useState([]);
  const [geoData, setGeoData] = useState({ cities: [], provinces: [] });
  const [csList, setCSList] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(true);

  useEffect(() => {
    fetchDashboardDetails();
  }, [timeRange]);

  const fetchDashboardDetails = async () => {
    setLoadingCharts(true);
    try {
      const [tsRes, chRes, geoRes, csRes] = await Promise.all([
        fetch(`/api/analytics/timeseries?range=${timeRange}`).then(r => r.json()),
        fetch('/api/analytics/channels').then(r => r.json()),
        fetch('/api/analytics/geo').then(r => r.json()),
        fetch('/api/cs').then(r => r.json())
      ]);

      if (tsRes.success) setTimeSeries(tsRes.data);
      if (chRes.success) setChannels(chRes.data);
      if (geoRes.success) setGeoData(geoRes.data);
      if (csRes.success) setCSList(csRes.data);
    } catch (err) {
      console.error('Error loading dashboard chart details:', err);
    } finally {
      setLoadingCharts(false);
    }
  };

  // Line Chart Data for Traffic Over Time
  const lineChartData = {
    labels: timeSeries.map(t => t.label),
    datasets: [
      {
        label: 'Klik WhatsApp',
        data: timeSeries.map(t => t.clicks),
        borderColor: '#FF5E14',
        backgroundColor: 'rgba(255, 94, 20, 0.12)',
        borderWidth: 3,
        pointBackgroundColor: '#FF7A30',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#FF7A30',
        borderColor: 'rgba(255, 94, 20, 0.3)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94A3B8', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94A3B8', font: { size: 11 }, precision: 0 },
        beginAtZero: true
      }
    }
  };

  // Doughnut Chart for Social Channels
  const doughnutData = {
    labels: channels.map(c => c.channel),
    datasets: [
      {
        data: channels.map(c => c.clicks),
        backgroundColor: [
          '#FF5E14', // Brand Orange
          '#FF8C38', // Light Orange
          '#3B82F6', // Blue (FB/Meta)
          '#10B981', // Green
          '#8B5CF6', // Purple (IG)
          '#EC4899', // Pink (TikTok)
          '#64748B'  // Slate
        ],
        borderWidth: 0,
        hoverOffset: 6
      }
    ]
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* 1. Summary Metrics Cards (2 Columns on Mobile, 4 Columns on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Klik Hari Ini */}
        <div className="glass-panel p-3.5 sm:p-6 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/10 rounded-full blur-xl group-hover:bg-brand-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Klik Hari Ini</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-brand-500/15 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <MousePointerClick className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 sm:gap-3 flex-wrap">
              <span className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats?.todayClicks || 0}
              </span>
              <span className={`text-[10px] sm:text-xs font-bold flex items-center ${
                (stats?.dailyGrowthPercent || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {(stats?.dailyGrowthPercent || 0) >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
                {stats?.dailyGrowthPercent || 0}%
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">Klik link menuju WA hari ini</p>
          </div>
        </div>

        {/* Card 2: Total Klik All-Time */}
        <div className="glass-panel p-3.5 sm:p-6 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Akumulasi</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 sm:gap-3 flex-wrap">
              <span className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats?.totalClicks || 0}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Semua Link</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">Bulan ini: {stats?.monthClicks || 0} klik</p>
          </div>
        </div>

        {/* Card 3: Tim CS Bertugas */}
        <div className="glass-panel p-3.5 sm:p-6 rounded-2xl relative overflow-hidden group cursor-pointer flex flex-col justify-between active:scale-[0.98] transition-transform" onClick={() => onNavigateTab('cs')}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">CS Bertugas</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 sm:gap-3 flex-wrap">
              <span className="text-xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {stats?.activeCS || 0}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">/ {stats?.totalCS || 0} CS Total</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span> Rotasi aktif
            </p>
          </div>
        </div>

        {/* Card 4: Link Kampanye */}
        <div className="glass-panel p-3.5 sm:p-6 rounded-2xl relative overflow-hidden group cursor-pointer flex flex-col justify-between active:scale-[0.98] transition-transform" onClick={() => onNavigateTab('campaigns')}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Link Kampanye</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Megaphone className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 sm:gap-3 flex-wrap">
              <span className="text-xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                {stats?.activeCampaigns || 0}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Aktif</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">TikTok, Meta & Bio</p>
          </div>
        </div>
      </div>

      {/* 2. Main Traffic Chart & Social Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Over Time Chart (Span 2 cols) */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500" />
                Tren Trafik Klik WhatsApp
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pantau lonjakan pengunjung iklan yang membuka WhatsApp CS</p>
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
              {['24h', '7d', '30d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === r
                      ? 'bg-brand-500 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {r === '24h' ? '24 Jam' : r === '7d' ? '7 Hari' : '30 Hari'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            {loadingCharts ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Memuat grafik...
              </div>
            ) : (
              <Line data={lineChartData} options={lineChartOptions} />
            )}
          </div>
        </div>

        {/* Social Media Channels Breakdown */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-brand-500" />
              Sumber Channel / Sosmed
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Distribusi klik dari platform iklan</p>

            <div className="h-44 flex items-center justify-center my-2">
              {channels.length === 0 ? (
                <div className="text-xs text-slate-500">Belum ada data channel</div>
              ) : (
                <Doughnut
                  data={doughnutData}
                  options={{
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: false
                  }}
                />
              )}
            </div>
          </div>

          {/* Channel Legend List */}
          <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            {channels.slice(0, 4).map((ch, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{ch.channel}</span>
                <span className="font-bold text-brand-600 dark:text-brand-400 font-mono">{ch.clicks} klik</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Top Cities & Live CS Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Indonesian Cities */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-500" />
                Asal Kota Pengunjung (Geolokasi)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Top kota pengunjung paling berminat liburan ke Banyuwangi</p>
            </div>
          </div>

          <div className="space-y-3">
            {geoData.cities.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada data geolokasi tercatat</p>
            ) : (
              geoData.cities.slice(0, 5).map((city, idx) => {
                const totalGeo = geoData.cities.reduce((s, c) => s + c.clicks, 0) || 1;
                const pct = Math.round((city.clicks / totalGeo) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{city.name}</span>
                      <span className="font-bold text-slate-500 dark:text-slate-400">{city.clicks} klik ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-500 to-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CS Live Status & Daily Cap Workload */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />
                Status & Beban Kerja CS Hari Ini
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Jumlah klik pengalihan WhatsApp yang diterima masing-masing CS hari ini</p>
            </div>
            <button
              onClick={() => onNavigateTab('cs')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Atur CS &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {csList.map((cs) => {
              const cap = cs.daily_lead_cap || 50;
              const current = cs.today_lead_count || 0;
              return (
                <div
                  key={cs.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CSAvatar name={cs.name} size="md" isActive={cs.is_active} />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{cs.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{cs.phone_number}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-brand-600 dark:text-brand-400 font-mono">
                      {current} {cs.enable_daily_cap ? `/ ${cap}` : ''} klik
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {cs.is_active ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Aktif Menerima</span>
                      ) : (
                        <span className="text-slate-400">Nonaktif</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
