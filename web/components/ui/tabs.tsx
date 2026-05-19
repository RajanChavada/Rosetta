'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Tab = { id: string; label: string; content: ReactNode };

export function Tabs({ tabs, initial }: { tabs: Tab[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="my-6">
      <div
        role="tablist"
        className="flex items-center gap-1 border-b border-[var(--color-border)]"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            className={cn(
              'px-3 py-2 text-sm font-mono transition-colors -mb-px border-b-2',
              t.id === active
                ? 'text-[var(--color-fg)] border-[var(--color-accent)]'
                : 'text-[var(--color-fg-faint)] border-transparent hover:text-[var(--color-fg-muted)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current?.content}</div>
    </div>
  );
}
