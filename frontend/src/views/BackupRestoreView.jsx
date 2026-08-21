import React, { useState, useEffect, useRef } from 'react';
import { useModal } from '../context/ModalContext.jsx';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  FileSpreadsheet,
  Trash2,
  HardDrive,
  Users,
  Megaphone,
  BarChart3,
  ShieldCheck,
  Layers,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function BackupRestoreView({ onRefreshGlobalData }) {
  const { showConfirm, showToast } = useModal();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Export State
  const [exportType, setExportType] = useState('full');
  const [isExporting, setIsExporting] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [parsedBackup, setParsedBackup] = useState(null);
  const [importMode, setImportMode] = useState('replace'); // 'replace' or 'merge'
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importErrorMsg, setImportErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBackupStats();
  }, []);

  const fetchBackupStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/backup/stats', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching backup stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // 1. Handle Export Download
  const handleExportDownload = async (type = 'full') => {
    setIsExporting(true);
    try {
      // Trigger download using browser cookie
      const url = `/api/backup/export?type=${type}&download=true`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tripbwi_rotator_backup_${type}_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('File backup berhasil diunduh ke perangkat Anda.', 'success');
      // Refresh stats to update last backup date
      setTimeout(fetchBackupStats, 1000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Handle File Selection for Import
  const handleFileChange = (e) => {
    setImportErrorMsg('');
    setImportSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportErrorMsg('Format file harus berupa JSON (.json).');
      return;
    }

    setImportFile(file);

    // Read and preview file content
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        if (!json.platform || json.platform !== 'TripBanyuwangi WA Rotator') {
          setImportErrorMsg('File JSON bukan backup resmi platform TripBanyuwangi WA Rotator.');
          setParsedBackup(null);
          return;
        }
        setParsedBackup(json);
      } catch (err) {
        setImportErrorMsg('File JSON rusak atau tidak valid.');
        setParsedBackup(null);
      }
    };
    reader.readAsText(file);
  };

  const executeRestoreApi = async () => {
    setIsImporting(true);
    setImportErrorMsg('');
    setImportSuccessMsg('');

    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          backup: parsedBackup,
          mode: importMode
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal memulihkan data dari backup.');
      }

      setImportSuccessMsg(
        `✅ ${result.message} (Pulih: ${result.counts?.campaigns || 0} Kampanye, ${result.counts?.csList || 0} CS, ${result.counts?.clickLogs || 0} Log Trafik)`
      );
      showToast('Database berhasil dipulihkan dari backup!', 'success');
      setImportFile(null);
      setParsedBackup(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      fetchBackupStats();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      setImportErrorMsg(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // 3. Handle Execute Import & Restore
  const handleExecuteImport = () => {
    if (!parsedBackup) return;

    if (importMode === 'replace') {
      showConfirm({
        title: 'Konfirmasi Timpa Total Data',
        message: 'Mode "Timpa Total" akan membersihkan data kampanye, CS, dan log yang ada saat ini dan menggantinya dengan isi file backup ini. Lanjutkan?',
        confirmText: 'Ya, Timpa Total',
        type: 'danger',
        onConfirm: executeRestoreApi
      });
    } else {
      executeRestoreApi();
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-500" />
            Pusat Backup & Pemulihan Data (Export / Import)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Amankan seluruh konfigurasi kampanye link rotator, data tim CS, dan riwayat log trafik klik agar data tidak pernah hilang
          </p>
        </div>

        <button
          onClick={fetchBackupStats}
          disabled={loadingStats}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin text-brand-500' : ''}`} />
          <span>Cek Status Database</span>
        </button>
      </div>

      {/* 1. Database Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Kampanye */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {stats?.totalCampaigns ?? '-'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Kampanye Terdaftar</div>
          </div>
        </div>

        {/* Card 2: Tim CS */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {stats?.totalCS ?? '-'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">CS Aktif di Rotator</div>
          </div>
        </div>

        {/* Card 3: Log Trafik */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {stats?.totalLogs ?? '-'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Riwayat Log Klik</div>
          </div>
        </div>

        {/* Card 4: Ukuran Data & Backup Terakhir */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {stats?.dbSizeReadable || 'SQLite Engine'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]" title={stats?.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleString('id-ID') : 'Belum pernah'}>
              Backup: {stats?.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleDateString('id-ID') : 'Belum ada'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Two Columns: Export Section & Import Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Export Section */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-500 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Ekspor & Download Backup</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Unduh snapshot database lengkap berformat JSON standar</p>
              </div>
            </div>

            {/* Quick Full Backup Button */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/10 via-amber-500/5 to-transparent border border-brand-500/20 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Full System Snapshot (.json)
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Menyimpan seluruh data Kampanye, Tim CS, Bobot Rotasi, Aturan Link, dan Log Trafik dalam 1 file backup.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleExportDownload('full')}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-brand-glow transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Memproses File...' : 'Download Full Backup (.json)'}</span>
              </button>
            </div>

            {/* Selective Module Exports */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Ekspor Modul Tertentu:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleExportDownload('campaigns')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kampanye & Link</span>
                  </div>
                  <FileJson className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => handleExportDownload('cs')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Tim CS & Jam Kerja</span>
                  </div>
                  <FileJson className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <a
                  href="/api/analytics/export"
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                    <span>Export Riwayat Log Klik (Format Excel CSV)</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500 shrink-0" />
            <span>Disarankan mengunduh backup berkala setiap kali memperbarui aturan rotasi iklan.</span>
          </div>
        </div>

        {/* Right: Import & Restore Section */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Restore & Impor Data</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Pulihkan data rotator dari file backup JSON sebelumnya</p>
              </div>
            </div>

            {/* Notification Messages */}
            {importSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importSuccessMsg}</span>
              </div>
            )}
            {importErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{importErrorMsg}</span>
              </div>
            )}

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-2xl p-5 text-center transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="backup-file-upload"
              />
              <label htmlFor="backup-file-upload" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 mx-auto flex items-center justify-center">
                  <FileJson className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {importFile ? importFile.name : 'Klik untuk memilih file backup JSON (.json)'}
                </div>
                <p className="text-[11px] text-slate-400">
                  {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'Pilih file backup yang telah diunduh sebelumnya'}
                </p>
              </label>
            </div>

            {/* Backup Snapshot Inspection Preview */}
            {parsedBackup && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Pratinjau Isi File Backup:</span>
                  <span className="text-[10px] text-brand-500 font-mono">
                    {parsedBackup.meta?.exported_at ? new Date(parsedBackup.meta.exported_at).toLocaleString('id-ID') : 'Valid'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                    <div className="font-bold text-amber-500">{parsedBackup.data?.campaigns?.length || 0}</div>
                    <div className="text-[10px] text-slate-400">Kampanye</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                    <div className="font-bold text-emerald-500">{parsedBackup.data?.csList?.length || 0}</div>
                    <div className="text-[10px] text-slate-400">Tim CS</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                    <div className="font-bold text-blue-500">{parsedBackup.data?.clickLogs?.length || 0}</div>
                    <div className="text-[10px] text-slate-400">Log Klik</div>
                  </div>
                </div>

                {/* Restore Mode Radios */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">Pilih Metode Restore:</span>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-brand-500 focus:ring-brand-500"
                      />
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">Timpa Total (Clean Replace)</div>
                        <div className="text-[10px] text-slate-400">Bersihkan data saat ini dan kembalikan sesuai persis isi backup</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-brand-500 focus:ring-brand-500"
                      />
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">Gabungkan (Merge & Upsert)</div>
                        <div className="text-[10px] text-slate-400">Tambahkan kampanye/CS baru tanpa menghapus data yang sudah ada</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Execute Button */}
                <button
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isImporting ? 'Sedang Memulihkan Data...' : 'Mulai Pulihkan / Restore Data'}</span>
                </button>
              </div>
            )}
          </div>

          {!parsedBackup && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Proses restore dijalankan secara aman menggunakan database transaction otomatis.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
