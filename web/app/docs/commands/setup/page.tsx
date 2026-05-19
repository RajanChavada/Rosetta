import { PageHeader } from '@/components/docs/page-header';
import { CommandRef } from '@/components/docs/command-ref';
import { FadeIn } from '@/components/motion/fade-in';
import { commandsByGroup, COMMAND_GROUPS } from '@/lib/content/commands';

export default function SetupCommandsPage() {
  const cmds = commandsByGroup('setup');
  const meta = COMMAND_GROUPS.setup;
  return (
    <>
      <PageHeader eyebrow="Commands" title={meta.title} description={meta.description} />
      {cmds.map((c, i) => (
        <FadeIn key={c.id} delay={i * 0.04}>
          <CommandRef spec={c} />
        </FadeIn>
      ))}
    </>
  );
}
