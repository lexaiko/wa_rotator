import React, { useState, useEffect } from 'react';
import CSAvatar from '../components/CSAvatar.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import {
  BarChart3,
  Search,
  Download,
  Filter,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function AnalyticsView({ campaigns, csList }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedCS, setSelectedCS] = useState('');
  const [dateFilter, setDateFilter] = useState({
    range: 'this_month',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs(1);
  }, [selectedCampaign, selectedCS, dateFilter]);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        search,
        range: dateFilter.range,
        ...(dateFilter.startDate ? { start_date: dateFilter.startDate } : {}),
        ...(dateFilter.endDate ? { end_date: dateFilter.endDate } : {}),
        ...(selectedCampaign ? { campaign_id: selectedCampaign } : {}),
        ...(selectedCS ? { cs_id: selectedCS } : {})
      });

      const res = await fetch(`/api/analytics/logs?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getDeviceIcon = (dev) => {
    if (dev === 'desktop') return <Monitor className="w-3.5 h-3.5 text-blue-400" />;
    if (dev === 'tablet') return <Tablet className="w-3.5 h-3.5 text-amber-400" />;
    return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
  };

  const getChannelBadgeColor = (ch) => {
    const lower = (ch || '').toLowerCase();
    if (lower.includes('tiktok')) return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    if (lower.includes('instagram') || lower.includes('ig')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (lower.includes('facebook') || lower.includes('fb') || lower.includes('meta')) return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    if (lower.includes('google')) return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
    return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  };

  // Build Export CSV URL
  const exportCsvUrl = () => {
    const params = new URLSearchParams({
      range: dateFilter.range,
      ...(dateFilter.startDate ? { start_date: dateFilter.startDate } : {}),
      ...(dateFilter.endDate ? { end_date: dateFilter.endDate } : {}),
      ...(selectedCampaign ? { campaign_id: selectedCampaign } : {}),
      ...(selectedCS ? { cs_id: selectedCS } : {}),
      ...(search ? { search } : {})
    });
    return `/api/analytics/export?${params.toString()}`;
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-500" />
            Riwayat Log & Analitik Klik WhatsApp
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data real-time pengunjung yang mengklik link rotator, asal kota, perangkat, dan CS yang menerima
          </p>
        </div>

        <a
          href={exportCsvUrl()}
          target="_blank"
          download
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition-all self-start"
        >
          <Download className="w-4 h-4 text-brand-500" />
          <span>Export Filtered Data (CSV)</span>
        </a>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center gap-3 sm:gap-4 flex-wrap relative z-30">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kota, IP, atau sumber..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </form>

        {/* CRM Date Range Picker */}
        <DateRangePicker
          value={dateFilter.range}
          startDate={dateFilter.startDate}
          endDate={dateFilter.endDate}
          onChange={(newFilter) => setDateFilter(newFilter)}
        />

        {/* Campaign Filter */}
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 w-full md:w-44 font-medium"
        >
          <option value="">Semua Kampanye</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        {/* CS Filter */}
        <select
          value={selectedCS}
          onChange={(e) => setSelectedCS(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 w-full md:w-36 font-medium"
        >
          <option value="">Semua CS</option>
          {csList.map((cs) => (
            <option key={cs.id} value={cs.id}>{cs.name}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Waktu (WIB)</th>
                <th className="p-4">Kampanye / Slug</th>
                <th className="p-4">CS Ditugaskan</th>
                <th className="p-4">Sumber / Sosmed</th>
                <th className="p-4">Geolokasi</th>
                <th className="p-4">Perangkat & OS</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Memuat data log klik...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Tidak ada log klik yang sesuai dengan filter periode ini.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const date = new Date(log.created_at);
                  const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                  const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Time */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{formattedTime}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{formattedDate}</div>
                      </td>

                      {/* Campaign */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{log.campaign?.title || 'Unknown'}</div>
                        <div className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-semibold">/{log.campaign?.slug}</div>
                      </td>

                      {/* CS Assigned */}
                      <td className="p-4 whitespace-nowrap">
                        {log.cs ? (
                          <div className="flex items-center gap-2.5">
                            <CSAvatar name={log.cs.name} size="xs" />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{log.cs.name}</span>
                              <div className="text-[10px] text-slate-500 font-mono">+{log.cs.phone_number}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">Fallback Darurat</span>
                        )}
                      </td>

                      {/* Social Media */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${getChannelBadgeColor(
                            log.utm_source
                          )}`}
                        >
                          {log.utm_source || 'Direct'}
                        </span>
                      </td>

                      {/* Geolocation */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-brand-500" />
                          <span>{log.city || 'Indonesia'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 ml-5">{log.province || '-'}</div>
                      </td>

                      {/* Device & OS */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(log.device_type)}
                          <span className="capitalize font-semibold text-slate-800 dark:text-slate-300">{log.device_type}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {log.os || '-'} &bull; {log.browser || '-'}
                        </div>
                      </td>

                      {/* IP */}
                      <td className="p-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan halaman <span className="font-bold text-slate-900 dark:text-white">{pagination.page}</span> dari{' '}
            <span className="font-bold text-slate-900 dark:text-white">{pagination.totalPages || 1}</span> ({pagination.total} total log)
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
