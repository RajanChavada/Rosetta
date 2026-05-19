'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  text: string;
  className?: string;
  variant?: 'floating' | 'inline';
};

export function CopyButton({ text, className, variant = 'floating' }: Props) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard API unavailable — silently fail
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      className={cn(
        'inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-md text-xs font-mono',
        'transition-all duration-150',
        variant === 'floating' && [
          'px-2 py-1.5',
          'text-[var(--color-fg-faint)] hover:text-[var(--color-fg)]',
          'bg-[var(--color-bg-elev)] hover:bg-[var(--color-bg-inline)]',
          'border border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
        ],
        variant === 'inline' && [
          'px-2 py-1',
          'text-[var(--color-fg-faint)] hover:text-[var(--color-fg)]',
        ],
        className,
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}
