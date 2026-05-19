import Link from 'next/link';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileDrawer } from './mobile-drawer';

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-tight text-[var(--color-fg)]"
          >
            rosetta
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/docs/getting-started"
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/docs/commands"
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            >
              Commands
            </Link>
            <Link
              href="/docs/skill-catalog"
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            >
              Skills
            </Link>
            <Link
              href="/docs/ides"
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            >
              IDEs
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/RajanChavada/Rosetta"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
          >
            <Github size={18} />
          </a>
          <Button variant="secondary" href="/docs/getting-started/installation">
            Install
          </Button>
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}
