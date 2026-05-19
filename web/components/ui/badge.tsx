import { cn } from '@/lib/cn';

type Variant = 'default' | 'accent' | 'muted';

const variants: Record<Variant, string> = {
  default: 'border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)]',
  accent: 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  muted: 'border-[var(--color-border)] bg-transparent text-[var(--color-fg-faint)]',
};

export function Badge({
  children,
  className,
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5',
        'text-xs font-mono',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
