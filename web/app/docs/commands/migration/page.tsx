import { PageHeader } from '@/components/docs/page-header';
import { CommandRef } from '@/components/docs/command-ref';
import { Prose } from '@/components/docs/prose';
import { FadeIn } from '@/components/motion/fade-in';
import { commandsByGroup, COMMAND_GROUPS } from '@/lib/content/commands';

export default function MigrationCommandsPage() {
  const cmds = commandsByGroup('migration');
  const meta = COMMAND_GROUPS.migration;
  return (
    <>
      <PageHeader eyebrow="Commands" title={meta.title} description={meta.description} />
      <Prose>
        <FadeIn>
          <p>
            Already have <code>.cursorrules</code> or <code>CLAUDE.md</code> in your repo? Rosetta can absorb them
            into the unified <code>.ai/</code> structure without losing your existing rules.
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
