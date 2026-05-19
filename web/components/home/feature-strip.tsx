import { FadeIn } from '@/components/motion/fade-in';
import { Stagger, StaggerItem } from '@/components/motion/stagger';

const features = [
  {
    title: 'One spec, every IDE',
    body: 'Edit .ai/master-skill.md once. Rosetta regenerates CLAUDE.md, .cursor/rules, .windsurf/rules and seven more wrappers. No more drift between configurations.',
  },
  {
    title: 'Skills translate automatically',
    body: "Install a skill once. Rosetta converts it to each IDE's native format with the right frontmatter, invocation syntax, and file layout.",
  },
  {
    title: 'Memory that persists',
    body: 'A three-layer memory system (project facts, learned heuristics, daily logs) keeps your agents grounded across sessions and team handoffs.',
  },
];

export function FeatureStrip() {
  return (
    <section className="py-24 px-6 border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-fg-faint)] mb-3">
            What it does
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-fg)] leading-tight">
            Three primitives. Ten IDEs. One workflow.
          </h2>
        </FadeIn>
        <Stagger className="mt-12 grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <div className="border-t border-[var(--color-border-strong)] pt-5">
                <h3 className="text-lg font-medium text-[var(--color-fg)]">{f.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-fg-muted)] leading-relaxed">
                  {f.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
