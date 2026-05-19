import { PageHeader } from '@/components/docs/page-header';
import { CommandRef } from '@/components/docs/command-ref';
import { Prose } from '@/components/docs/prose';
import { FadeIn } from '@/components/motion/fade-in';
import { commandsByGroup, COMMAND_GROUPS } from '@/lib/content/commands';

export default function HealthCommandsPage() {
  const cmds = commandsByGroup('health');
  const meta = COMMAND_GROUPS.health;
  return (
    <>
      <PageHeader eyebrow="Commands" title={meta.title} description={meta.description} />
      <Prose>
        <FadeIn>
          <p>
            Verify your Rosetta setup, audit templates, rotate memory, and switch profiles. <code>rosetta health</code> is the fastest first signal that
            something is missing.
          </p>
        </FadeIn>
      </Prose>
      {cmds.map((c, i) => (
        <FadeIn key={c.id} delay={i * 0.04}>
          <CommandRef spec={c} />
        </FadeIn>
      ))}
    </>
  );
}
