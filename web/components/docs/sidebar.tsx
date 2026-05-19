'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SIDEBAR_NAV } from '@/lib/content/nav';
import { cn } from '@/lib/cn';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-7">
      {SIDEBAR_NAV.map((group) => (
        <div key={group.title}>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-fg-faint)] mb-2">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      'block rounded-md px-2 py-1 text-sm transition-colors',
                      active
                        ? 'bg-[var(--color-bg-elev)] text-[var(--color-fg)]'
                        : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-elev)]/50',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
