import { FadeIn } from '@/components/motion/fade-in';
import { Stagger, StaggerItem } from '@/components/motion/stagger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FEATURED_SKILLS } from '@/lib/content/skills';

export function SkillPreview() {
  return (
    <section className="py-24 px-6 border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-fg-faint)] mb-3">
            Catalog
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-fg)] leading-tight">
            Skills, ready to install.
          </h2>
          <p className="mt-3 text-[var(--color-fg-muted)] max-w-prose leading-relaxed">
            Reusable agent skills, each one auto-translates into every IDE you have configured.
          </p>
        </FadeIn>
        <Stagger className="mt-10 grid md:grid-cols-2 gap-4">
          {FEATURED_SKILLS.map((s) => (
            <StaggerItem key={s.name}>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 h-full">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-[var(--color-fg)] font-medium">{s.displayName}</h3>
                  <span className="font-mono text-xs text-[var(--color-fg-faint)] whitespace-nowrap">
                    {s.name}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
                  {s.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.domains.map((d) => (
                    <Badge key={d}>{d}</Badge>
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <FadeIn delay={0.1}>
          <div className="mt-8 flex justify-center">
            <Button variant="secondary" href="/docs/skill-catalog">
              Browse full catalog
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
