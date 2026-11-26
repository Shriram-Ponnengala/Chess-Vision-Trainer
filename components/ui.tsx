// Small building blocks in the Chess OS style: white cards with a hairline ring,
// round buttons, a green primary action, and the brand mark.

import React, { useEffect, useState, type ReactNode } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line ${className}`}>{children}</section>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
};

export function Button({ variant = 'secondary', size = 'md', className = '', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
  const sizes = size === 'lg' ? 'h-14 px-7 text-lg' : 'h-11 px-5 text-[0.95rem]';
  const variants = {
    primary: 'bg-accent text-white shadow-sm hover:bg-accent-strong dark:text-[#10261a]',
    secondary: 'bg-surface text-fg shadow-sm ring-1 ring-line hover:bg-black/5 dark:hover:bg-white/10',
    ghost: 'text-muted hover:bg-black/5 hover:text-fg dark:hover:bg-white/10',
  }[variant];
  return <button type="button" className={`${base} ${sizes} ${variants} ${className}`} {...props} />;
}

export function IconButton({ label, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-lg text-muted transition hover:bg-black/5 hover:text-fg active:scale-95 dark:hover:bg-white/10"
      {...props}
    >
      {children}
    </button>
  );
}

/** "♞ Square Trainer" over "by Venture Chess Academy". */
export function Brand() {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="font-brand text-[1.15rem] leading-none font-semibold tracking-tight whitespace-nowrap sm:text-[1.45rem]">
        <span aria-hidden className="mr-1 text-accent">
          ♞
        </span>
        Square Trainer
      </p>
      <p className="text-[0.6875rem] leading-none text-muted">
        by{' '}
        <a href="https://venturechessacademy.com/" target="_blank" rel="noopener" className="hover:text-fg hover:underline">
          Venture Chess Academy
        </a>
      </p>
    </div>
  );
}

type Theme = 'light' | 'dark' | 'system';
const THEMES: { value: Theme; label: string; icon: ReactNode }[] = [
  { value: 'system', label: 'Theme: Device', icon: <Monitor size={18} /> },
  { value: 'light', label: 'Theme: Light', icon: <Sun size={18} /> },
  { value: 'dark', label: 'Theme: Dark', icon: <Moon size={18} /> },
];

/** Cycles Device → Light → Dark; each device remembers its own choice. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = localStorage.getItem('cvt-theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      delete root.dataset.theme;
      localStorage.removeItem('cvt-theme');
    } else {
      root.dataset.theme = theme;
      localStorage.setItem('cvt-theme', theme);
    }
  }, [theme]);
  const i = THEMES.findIndex((t) => t.value === theme);
  const current = THEMES[i];
  return (
    <IconButton label={current.label} onClick={() => setTheme(THEMES[(i + 1) % THEMES.length].value)}>
      {current.icon}
    </IconButton>
  );
}

/** One number with its name: Score, Streak, Accuracy… */
export function Stat({ label, value, tone, bumpKey }: { label: string; value: ReactNode; tone?: 'accent' | 'danger' | 'hint'; bumpKey?: number }) {
  const color = tone === 'accent' ? 'text-accent' : tone === 'danger' ? 'text-danger' : tone === 'hint' ? 'text-hint' : 'text-fg';
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className="text-[0.7rem] font-semibold tracking-wide text-muted uppercase">{label}</span>
      <span key={bumpKey} className={`font-brand text-2xl leading-none font-semibold tabular-nums ${color} ${bumpKey ? 'bump' : ''}`}>
        {value}
      </span>
    </div>
  );
}

/** A thin rounded bar, used for the clock and for how far the token has fallen. */
export function Meter({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'danger' | 'hint' }) {
  const fill = tone === 'danger' ? 'bg-danger' : tone === 'hint' ? 'bg-hint' : 'bg-accent';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-progress-off">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
