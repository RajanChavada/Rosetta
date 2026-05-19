import { Terminal } from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';
import { Stagger, StaggerItem } from '@/components/motion/stagger';
import { IDES } from '@/lib/content/ides';

export function IdeGrid() {
  return (
    <section className="py-24 px-6 border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-fg-faint)] mb-3">
            Supported IDEs
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-fg)] leading-tight">
            Ten IDEs. One config.
          </h2>
          <p className="mt-3 text-[var(--color-fg-muted)] max-w-prose leading-relaxed">
            Skills, rules, and memory translate automatically into each IDE&apos;s native format. Add a new one with a single command.
          </p>
        </FadeIn>
        <Stagger className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {IDES.map((ide) => (
            <StaggerItem key={ide.id}>
              <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-4 py-3 hover:border-[var(--color-border-strong)] transition-colors">
                <Terminal
                  size={16}
                  className="text-[var(--color-fg-faint)] flex-shrink-0"
                />
                <span className="text-sm text-[var(--color-fg)]">{ide.name}</span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
