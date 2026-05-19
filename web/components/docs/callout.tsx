import { Info, AlertTriangle, Lightbulb, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type Kind = 'tip' | 'note' | 'warn' | 'danger';

const meta: Record<
  Kind,
  { Icon: typeof Info; tone: string; iconColor: string; label: string }
> = {
  tip: {
    Icon: Lightbulb,
    tone: 'border-[var(--color-success)]/40 bg-[var(--color-success)]/[0.06]',
    iconColor: 'text-[var(--color-success)]',
    label: 'Tip',
  },
  note: {
    Icon: Info,
    tone: 'border-[var(--color-border)] bg-[var(--color-bg-elev)]',
    iconColor: 'text-[var(--color-fg-muted)]',
    label: 'Note',
  },
  warn: {
    Icon: AlertTriangle,
    tone: 'border-[var(--color-warn)]/40 bg-[var(--color-warn)]/[0.06]',
    iconColor: 'text-[var(--color-warn)]',
    label: 'Caution',
  },
  danger: {
    Icon: AlertCircle,
    tone: 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/[0.06]',
    iconColor: 'text-[var(--color-danger)]',
    label: 'Important',
  },
};

export function Callout({
  kind = 'note',
  title,
  children,
}: {
  kind?: Kind;
  title?: string;
  children: React.ReactNode;
}) {
  const { Icon, tone, iconColor, label } = meta[kind];
  return (
    <aside className={cn('my-6 rounded-lg border p-4', tone)}>
      <div className={cn('flex items-center gap-2 mb-2 text-[var(--color-fg)]')}>
        <Icon size={16} className={iconColor} />
        <span className="text-sm font-medium">{title ?? label}</span>
      </div>
      <div className="text-sm text-[var(--color-fg-muted)] leading-relaxed [&_p:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
}
