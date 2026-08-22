import React from 'react';
import { Globe, Users, Layers, Compass, MessageSquare, Send, Radio, Sparkles } from 'lucide-react';

export function TikTokIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function FacebookIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function WebsiteIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.067 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

export function YouTubeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function TwitterIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function TelegramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export const COLOR_THEMES = {
  rose: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.2)]'
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    border: 'border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]'
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]'
  },
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]'
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]'
  },
  red: {
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-600 dark:text-red-400',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]'
  },
  teal: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    border: 'border-teal-500/30',
    text: 'text-teal-600 dark:text-teal-400',
    glow: 'shadow-[0_0_12px_rgba(20,184,166,0.2)]'
  },
  slate: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    border: 'border-slate-500/30',
    text: 'text-slate-600 dark:text-slate-400',
    glow: ''
  }
};

export const AVAILABLE_ICONS = [
  { id: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
  { id: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { id: 'website', label: 'Website (Globe)', Icon: WebsiteIcon },
  { id: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'youtube', label: 'YouTube', Icon: YouTubeIcon },
  { id: 'twitter', label: 'Twitter / X', Icon: TwitterIcon },
  { id: 'telegram', label: 'Telegram', Icon: TelegramIcon },
  { id: 'users', label: 'Komunitas / Users', Icon: Users },
  { id: 'auto', label: 'Auto (Kompas)', Icon: Compass },
  { id: 'custom', label: 'Lainnya (Layers)', Icon: Layers }
];

export function getIconComponent(iconType = '') {
  const t = (iconType || '').toLowerCase();
  if (t === 'tiktok' || t === 'tt') return TikTokIcon;
  if (t === 'instagram' || t === 'ig') return InstagramIcon;
  if (t === 'website' || t === 'web' || t === 'globe') return WebsiteIcon;
  if (t === 'facebook' || t === 'fb') return FacebookIcon;
  if (t === 'google') return GoogleIcon;
  if (t === 'youtube' || t === 'yt') return YouTubeIcon;
  if (t === 'twitter' || t === 'x') return TwitterIcon;
  if (t === 'telegram') return TelegramIcon;
  if (t === 'users' || t === 'rekomendasi') return Users;
  if (t === 'auto' || t === 'compass') return Compass;
  return Layers;
}

export const PLATFORM_REGISTRY = {
  website: {
    id: 'website',
    label: 'Website',
    desc: 'Tombol WA & Landing Page',
    Icon: WebsiteIcon,
    theme: COLOR_THEMES.emerald
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    desc: 'Bio Instagram & IG Story',
    Icon: InstagramIcon,
    theme: COLOR_THEMES.purple
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    desc: 'Bio TikTok & TikTok Ads',
    Icon: TikTokIcon,
    theme: COLOR_THEMES.rose
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    desc: 'Meta Ads & Fanpage',
    Icon: FacebookIcon,
    theme: COLOR_THEMES.blue
  },
  google: {
    id: 'google',
    label: 'Google',
    desc: 'Google Ads & Search',
    Icon: GoogleIcon,
    theme: COLOR_THEMES.amber
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    desc: 'YouTube Description Link',
    Icon: YouTubeIcon,
    theme: COLOR_THEMES.red
  },
  rekomendasi: {
    id: 'rekomendasi',
    label: 'Rekomendasi',
    desc: 'Referral Word of Mouth',
    Icon: Users,
    theme: COLOR_THEMES.teal
  },
  auto: {
    id: 'auto',
    label: 'Auto-Detect',
    desc: 'Deteksi Otomatis Referrer / UTM',
    Icon: Compass,
    theme: COLOR_THEMES.slate
  },
  lainnya: {
    id: 'lainnya',
    label: 'Lainnya',
    desc: 'Sumber Custom / Direct',
    Icon: Layers,
    theme: COLOR_THEMES.slate
  }
};

export function getPlatformMeta(platformKey = '', categoryObj = null) {
  const key = (platformKey || '').trim().toLowerCase();

  // If a full custom category object was passed
  if (categoryObj) {
    const Icon = getIconComponent(categoryObj.icon_type);
    const theme = COLOR_THEMES[categoryObj.badge_color] || COLOR_THEMES.slate;
    return {
      id: categoryObj.code || key,
      label: categoryObj.name || key,
      desc: categoryObj.description || '',
      Icon,
      theme
    };
  }

  if (key === 'tt' || key === 'tiktok') return PLATFORM_REGISTRY.tiktok;
  if (key === 'ig' || key === 'instagram') return PLATFORM_REGISTRY.instagram;
  if (key === 'web' || key === 'website' || key === 'direct') return PLATFORM_REGISTRY.website;
  if (key === 'fb' || key === 'facebook') return PLATFORM_REGISTRY.facebook;
  if (key === 'google') return PLATFORM_REGISTRY.google;
  if (key === 'youtube' || key === 'yt') return PLATFORM_REGISTRY.youtube;
  if (key === 'rekomendasi') return PLATFORM_REGISTRY.rekomendasi;
  if (key === 'auto') return PLATFORM_REGISTRY.auto;

  return {
    id: key,
    label: key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Lainnya',
    desc: 'Kategori Sumber',
    Icon: getIconComponent(key),
    theme: COLOR_THEMES.slate
  };
}

export function PlatformBadge({ platform, category, size = 'sm', showIcon = true, className = '' }) {
  const meta = getPlatformMeta(platform, category);
  const Icon = meta.Icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg border ${meta.theme.bg} ${meta.theme.border} ${meta.theme.text} ${
        isSm ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
      } ${className}`}
    >
      {showIcon && <Icon className={isSm ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />}
      <span>{meta.label}</span>
    </span>
  );
}
