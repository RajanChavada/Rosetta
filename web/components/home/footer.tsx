import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-12 px-6 mt-12">
      <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="font-mono text-sm font-semibold text-[var(--color-fg)]">rosetta</p>
          <p className="mt-1 text-xs text-[var(--color-fg-faint)]">
            One source of truth for AI agents.
          </p>
        </div>
        <nav className="grid grid-cols-3 gap-x-10 gap-y-2 text-sm">
          <Link
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            href="/docs/getting-started"
          >
            Docs
          </Link>
          <Link
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            href="/docs/commands"
          >
            Commands
          </Link>
          <Link
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            href="/docs/skill-catalog"
          >
            Skills
          </Link>
          <Link
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            href="/docs/ides"
          >
            IDEs
          </Link>
          <a
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            href="https://github.com/RajanChavada/Rosetta"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <Link
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            href="/docs/yaml"
          >
            YAML schema
          </Link>
        </nav>
      </div>
    </footer>
  );
}
