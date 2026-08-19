import React from 'react';

/**
 * Helper to generate CS initials like "CB" (CS Bagus), "CP" (CS Putri), "CD" (CS Dina)
 */
export const getCSInitials = (name = '') => {
  if (!name) return 'CS';
  const clean = name.replace(/[\(\)]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const GRADIENTS = [
  'from-brand-500 to-amber-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600'
];

export const getCSGradient = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
};

export default function CSAvatar({ name = '', size = 'md', isActive = null, className = '' }) {
  const initials = getCSInitials(name);
  const gradient = getCSGradient(name);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-lg',
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-12 h-12 text-base rounded-2xl'
  };

  const dotSizes = {
    xs: 'w-2 h-2 -bottom-0.5 -right-0.5',
    sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    md: 'w-3 h-3 -bottom-0.5 -right-0.5',
    lg: 'w-3.5 h-3.5 -bottom-1 -right-1'
  };

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} bg-gradient-to-br ${gradient} text-white font-extrabold flex items-center justify-center shadow-sm select-none tracking-wide border border-white/10`}
      >
        {initials}
      </div>
      {isActive !== null && (
        <span
          className={`absolute ${dotSizes[size] || dotSizes.md} rounded-full border-2 border-white dark:border-slate-900 ${
            isActive ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        ></span>
      )}
    </div>
  );
}
