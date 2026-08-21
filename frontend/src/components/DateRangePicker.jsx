import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';

const PRESET_OPTIONS = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'yesterday', label: 'Kemarin' },
  { id: '7d', label: '7 Hari Terakhir' },
  { id: 'this_week', label: 'Minggu Ini' },
  { id: '30d', label: '30 Hari Terakhir' },
  { id: 'this_month', label: 'Bulan Ini' },
  { id: 'last_month', label: 'Bulan Lalu' },
  { id: 'all_time', label: 'Semua Waktu' },
  { id: 'custom', label: 'Kustom Tanggal' }
];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function DateRangePicker({
  value = 'this_month',
  startDate = '',
  endDate = '',
  onChange,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const [dateFilterType, setDateFilterType] = useState(value);
  const [currentDate, setCurrentDate] = useState(() => {
    if (startDate) return new Date(startDate);
    return new Date();
  });
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [hoveredDate, setHoveredDate] = useState(null);

  // Sync temp dates and preset type with props
  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setDateFilterType(value);
  }, [startDate, endDate, value]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  const formatDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = parseInt(parts[2], 10);
    const m = months[parseInt(parts[1], 10) - 1];
    const y = parts[0].slice(-2);
    return `${d} ${m} '${y}`;
  };

  const handleDayClick = (date) => {
    const clickedStr = formatDateString(date);

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(clickedStr);
      setTempEnd('');
    } else {
      if (clickedStr < tempStart) {
        setTempStart(clickedStr);
      } else {
        setTempEnd(clickedStr);
      }
    }
  };

  const applyPreset = (presetId) => {
    setDateFilterType(presetId);
    if (presetId === 'custom') return;

    if (onChange) {
      onChange({
        range: presetId,
        startDate: '',
        endDate: ''
      });
    }
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (tempStart) {
      const finalEnd = tempEnd || tempStart;
      if (onChange) {
        onChange({
          range: 'custom',
          startDate: tempStart,
          endDate: finalEnd
        });
      }
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    const found = PRESET_OPTIONS.find((p) => p.id === value);
    if (value !== 'custom' && found) {
      return found.label;
    }
    if (startDate && endDate) {
      if (startDate === endDate) return formatDateReadable(startDate);
      return `${formatDateReadable(startDate)} s/d ${formatDateReadable(endDate)}`;
    }
    return 'Pilih Waktu';
  };

  const isDaySelected = (dateStr) => {
    return dateStr === tempStart || dateStr === tempEnd;
  };

  const isDayInRange = (dateStr) => {
    if (tempStart && tempEnd) {
      return dateStr > tempStart && dateStr < tempEnd;
    }
    if (tempStart && !tempEnd && hoveredDate) {
      if (hoveredDate > tempStart) {
        return dateStr > tempStart && dateStr < hoveredDate;
      }
    }
    return false;
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${isOpen ? 'z-50' : 'z-20'} ${className}`}>
      {/* Trigger Button (CRM Styled) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 px-3.5 py-2 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left shadow-sm cursor-pointer min-w-[180px]"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="text-brand-500 shrink-0" />
          <span className="truncate text-xs font-semibold">{getDisplayText()}</span>
        </div>
        <span className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-md shrink-0 font-bold uppercase tracking-wider">
          Pilih
        </span>
      </button>

      {/* Popover (2-Column CRM Layout) */}
      {isOpen && (
        <div className="absolute z-[999] mt-2 right-0 left-0 sm:left-auto sm:w-[500px] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row gap-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
          {/* Quick Presets List (Left Column) */}
          <div className="flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800 pr-0 sm:pr-3 shrink-0 sm:w-36">
            <span className="hidden sm:block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-brand-500" /> Preset Cepat
            </span>
            {PRESET_OPTIONS.map((p) => {
              const isSelected =
                (p.id === 'custom' && dateFilterType === 'custom') ||
                (p.id !== 'custom' && value === p.id && dateFilterType !== 'custom');
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl text-left whitespace-nowrap transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-brand-glow font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{p.label}</span>
                  {isSelected && <Check size={12} className="shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Interactive Calendar Picker Panel (Right Column) */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Header: Month switcher */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-500 dark:text-slate-400 hover:text-brand-500"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-500 dark:text-slate-400 hover:text-brand-500"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Min</span>
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-7" />;

                const dateStr = formatDateString(day);
                const isSelected = isDaySelected(dateStr);
                const isInRange = isDayInRange(dateStr);
                const isStart = dateStr === tempStart;
                const isEnd = dateStr === tempEnd;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setDateFilterType('custom');
                      handleDayClick(day);
                    }}
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`h-7 w-full text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-brand-500 text-white font-black z-10 shadow-sm'
                        : isInRange
                        ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 hover:bg-brand-500/25'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day.getDate()}
                    {/* Visual range indicator wings */}
                    {isStart && tempEnd && (
                      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-brand-500/15 -z-10 rounded-r-none" />
                    )}
                    {isEnd && tempStart && (
                      <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-brand-500/15 -z-10 rounded-l-none" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selection Info & Apply Action Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-1">
              <div className="flex flex-col text-[10px] text-slate-500 dark:text-slate-400 min-w-0 pr-2">
                <span className="font-semibold uppercase tracking-wider text-[9px] text-slate-400">Range Terpilih:</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold truncate text-[11px]">
                  {tempStart ? formatDateReadable(tempStart) : '...'} {tempEnd ? ` s/d ${formatDateReadable(tempEnd)}` : ''}
                </span>
              </div>
              <button
                type="button"
                disabled={!tempStart}
                onClick={handleApplyCustom}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-40 transition-all cursor-pointer shadow-brand-glow shrink-0"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
