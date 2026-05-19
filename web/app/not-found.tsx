import Link from 'next/link';
import { TopNav } from '@/components/nav/top-nav';

export default function NotFound() {
  return (
    <>
      <TopNav />
      <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs text-[var(--color-fg-faint)] uppercase tracking-wider mb-3">
          404
        </p>
        <h1 className="text-3xl font-semibold mb-2 text-[var(--color-fg)]">Page not found</h1>
        <p className="text-[var(--color-fg-muted)] mb-6">
          The route you tried doesn&apos;t exist.
        </p>
        <Link
          href="/docs/getting-started"
          className="text-[var(--color-accent)] hover:brightness-110 transition"
        >
          Read the docs →
        </Link>
      </main>
    </>
  );
}
